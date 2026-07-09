# Развёртывание в Yandex Cloud

Целевая схема для MVP:

- одна виртуальная машина Yandex Compute Cloud;
- nginx с HTTPS перед Node.js API и собранным PWA;
- PostgreSQL на той же VM;
- приватный Yandex Object Storage для видео;
- Clerk остаётся внешним сервисом аутентификации.

Это недорогая и понятная конфигурация для MVP, но VM и PostgreSQL на одном
диске остаются единой точкой отказа. Для более серьёзной эксплуатации следует
перенести PostgreSQL в управляемый сервис или на отдельную VM.

## 1. Yandex Object Storage

1. Создайте приватный бакет, например `colostomy-school-videos`.
2. Создайте отдельный сервисный аккаунт и статический ключ доступа только для
   работы приложения с этим бакетом. Не используйте ключ личного аккаунта.
3. Выдайте минимальные права на чтение и запись объектов.
4. Настройте CORS для домена приложения. Пример `cors.json`:

   ```json
   {
     "CORSRules": [
       {
         "AllowedOrigins": ["https://school.example.ru"],
         "AllowedMethods": ["GET", "HEAD", "PUT"],
         "AllowedHeaders": ["Content-Type"],
         "ExposeHeaders": ["ETag"],
         "MaxAgeSeconds": 3600
       }
     ]
   }
   ```

   Применить конфигурацию можно через AWS CLI:

   ```bash
   aws s3api put-bucket-cors \
     --bucket colostomy-school-videos \
     --cors-configuration file://cors.json \
     --endpoint-url=https://storage.yandexcloud.net
   ```

   При локальной проверке временно добавьте `http://localhost:5173` в
   `AllowedOrigins`.

Yandex Object Storage поддерживает S3 API и подписанные URL. Приложение
выдаёт администратору подписанный PUT URL на 15 минут, а пациенту — подписанный
GET URL на один час. Статические ключи остаются только на сервере.

Официальная документация:

- [S3 API Yandex Object Storage](https://yandex.cloud/ru/docs/storage/s3/)
- [Подписанные URL](https://yandex.cloud/ru/docs/storage/concepts/pre-signed-urls)
- [Настройка CORS](https://yandex.cloud/ru/docs/storage/operations/buckets/cors)

## 2. Compute Cloud VM

1. Создайте Ubuntu LTS VM с публичным IP и постоянным диском.
2. В security group откройте входящие TCP-порты `22`, `80` и `443`.
   Порт приложения `5000` наружу не открывайте.
3. Создайте DNS A-запись домена на публичный IP VM.
4. Установите Node.js 22, nginx, PostgreSQL, Git и Certbot.
5. Клонируйте репозиторий, выберите нужную ветку и соберите приложение:

   ```bash
   corepack enable
   pnpm install --frozen-lockfile
   pnpm build:render
   ```

Команда `build:render` собирает web PWA и API. Express раздаёт web-сборку и
обрабатывает относительные запросы `/api`, поэтому отдельный frontend-сервис
не нужен.

## 3. PostgreSQL на VM

Создайте отдельного пользователя и базу с сильным паролем:

```sql
CREATE ROLE colostomy_app LOGIN PASSWORD 'replace_with_a_strong_password';
CREATE DATABASE colostomy_school OWNER colostomy_app;
```

Ограничьте PostgreSQL локальным интерфейсом VM. Пример строки подключения:

```dotenv
DATABASE_URL=postgresql://colostomy_app:replace_with_a_strong_password@127.0.0.1:5432/colostomy_school
```

Перед первым запуском примените схему с той же `DATABASE_URL`:

```bash
pnpm --filter @workspace/db push
```

Эта операция создаёт/обновляет схему; приложение само не добавляет
демонстрационные записи.

## 4. Переменные окружения

Храните production-переменные в закрытом файле, например
`/etc/colostomy-school.env`, с правами `600`. Не добавляйте его в Git.

```dotenv
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://colostomy_app:strong_password@127.0.0.1:5432/colostomy_school

CLERK_SECRET_KEY=sk_live_your_secret_key
CLERK_PUBLISHABLE_KEY=pk_live_your_publishable_key
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_publishable_key

STORAGE_DRIVER=s3
S3_ENDPOINT=https://storage.yandexcloud.net
S3_REGION=ru-central1
S3_BUCKET_NAME=colostomy-school-videos
S3_ACCESS_KEY_ID=your_static_access_key_id
S3_SECRET_ACCESS_KEY=your_static_secret_access_key
S3_FORCE_PATH_STYLE=true
```

`S3_PUBLIC_BASE_URL` не задавайте для приватного бакета. Если бакет намеренно
сделан публичным, это значение должно указывать на корень бакета, например:

```dotenv
S3_PUBLIC_BASE_URL=https://storage.yandexcloud.net/colostomy-school-videos
```

В таком режиме любой знающий URL сможет получить видео без авторизации.

## 5. systemd

Пример `/etc/systemd/system/colostomy-school.service`:

```ini
[Unit]
Description=Colostomy Care School
After=network.target postgresql.service

[Service]
Type=simple
User=colostomy
WorkingDirectory=/opt/colostomy-school
EnvironmentFile=/etc/colostomy-school.env
ExecStart=/usr/bin/node artifacts/api-server/dist/index.mjs
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now colostomy-school
sudo systemctl status colostomy-school
```

## 6. nginx и HTTPS

Пример nginx-конфигурации:

```nginx
server {
    listen 80;
    server_name school.example.ru;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Проверьте конфигурацию и выпустите сертификат:

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d school.example.ru
```

После включения HTTPS обновите CORS бакета и настройки домена/redirect URL в
Clerk.

## 7. Резервные копии PostgreSQL

Минимум раз в сутки создавайте дамп `pg_dump --format=custom`, загружайте его
в отдельный префикс Object Storage, например `postgres-backups/`, и удаляйте
локальный временный файл после успешной загрузки:

```bash
pg_dump --format=custom --file=/var/backups/colostomy-school.dump \
  postgresql://colostomy_app@127.0.0.1:5432/colostomy_school

aws s3 cp /var/backups/colostomy-school.dump \
  s3://colostomy-school-backups/postgres/colostomy-school-$(date +%F).dump \
  --endpoint-url=https://storage.yandexcloud.net
```

Используйте отдельный приватный backup-бакет, lifecycle-политику хранения и
периодически проверяйте восстановление на тестовой базе. Пароль PostgreSQL и
S3-ключи передавайте через защищённое окружение, а не записывайте в скрипт.

## 8. Clerk и требования российского контура

Clerk остаётся внешним поставщиком аутентификации. В production instance Clerk
добавьте `https://school.example.ru` в разрешённые origins/authorized parties
и redirect URLs, затем проверьте `/debug-auth`.

Если требуется полностью российский контур размещения и обработки данных,
Clerk впоследствии нужно заменить собственной или российской системой
аутентификации. Текущее изменение хранилища само по себе этого требования не
решает.

## 9. Проверка после развёртывания

1. Откройте `/api/healthz`.
2. Откройте `/debug-auth`, войдите и проверьте `ok (admin)`.
3. Создайте материал без видео и проверьте дружелюбное сообщение.
4. Загрузите небольшой MP4, WebM или MOV через `/admin`.
5. Убедитесь, что объект появился в `s3/videos/`.
6. Опубликуйте материал и проверьте воспроизведение и перемотку.
7. Перезапустите сервис и убедитесь, что видео продолжает работать.
