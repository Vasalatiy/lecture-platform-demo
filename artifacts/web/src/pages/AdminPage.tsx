import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileVideo, RefreshCw, Save, Trash2, UploadCloud } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import {
  createLecture,
  deleteLecture,
  requestUploadUrl,
  updateLectureStatus,
  ApiError,
  type Lecture,
  type LectureInput,
} from "../api/client";
import { AppShell } from "../components/AppShell";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useLectures } from "../hooks/useLectures";
import { useVideoStats } from "../hooks/useVideoStats";
import { formatLectureDate } from "../lib/format";

const emptyForm: LectureInput = {
  title: "",
  description: "",
  lecturer: "",
  category: "",
  videoUrl: "",
  status: "draft",
};

function messageFrom(error: unknown): string {
  if (error instanceof ApiError) {
    return "Не удалось выполнить действие. Попробуйте ещё раз.";
  }
  return error instanceof Error ? error.message : "Произошла ошибка.";
}

export function AdminPage() {
  const user = useCurrentUser();
  const isAdmin = user.data?.role === "admin";
  const stats = useVideoStats(isAdmin);
  const lectures = useLectures();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<LectureInput>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const adminLectures = useMemo(() => lectures.data?.lectures ?? [], [lectures.data]);

  async function refreshAdminData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["lectures"] }),
      queryClient.invalidateQueries({ queryKey: ["video-stats"] }),
    ]);
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const trimmed = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        lecturer: form.lecturer.trim(),
        category: form.category.trim(),
        videoUrl: form.videoUrl?.trim() ?? "",
      };

      if (!trimmed.title || !trimmed.lecturer || !trimmed.category) {
        throw new Error("Укажите название видео, автора материала и раздел.");
      }

      let videoUrl = trimmed.videoUrl;

      if (file) {
        const uploadContentType = getVideoContentType(file);
        const upload = await requestUploadUrl({
          name: file.name,
          size: file.size,
          contentType: uploadContentType,
        });

        await uploadFile(upload.uploadURL, file, uploadContentType);
        videoUrl = upload.objectPath;
      }

      return createLecture({ ...trimmed, videoUrl });
    },
    async onSuccess(created) {
      setMessage(
        created.videoUrl
          ? `Материал «${created.title}» создан, видео загружено.`
          : `Материал «${created.title}» создан без видео. Его можно добавить позже.`,
      );
      setError(null);
      setForm(emptyForm);
      setFile(null);
      await refreshAdminData();
    },
    onError(err) {
      setMessage(null);
      setError(messageFrom(err));
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Lecture["status"] }) => updateLectureStatus(id, status),
    async onSuccess() {
      setError(null);
      await refreshAdminData();
    },
    onError(err) {
      setError(messageFrom(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLecture,
    async onSuccess() {
      setMessage("Материал удалён.");
      setError(null);
      await refreshAdminData();
    },
    onError(err) {
      setError(messageFrom(err));
    },
  });

  function updateField<K extends keyof LectureInput>(key: K, value: LectureInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    createMutation.mutate();
  }

  if (user.isLoading) {
    return (
      <AppShell eyebrow="Панель администратора" title="Проверяем доступ">
        <div className="empty-state">Загружаем профиль администратора...</div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell eyebrow="Панель администратора" title="Требуется доступ администратора">
        <section className="admin-summary">
          <div>
            <strong>{user.data ? "Обычная учётная запись" : "Профиль недоступен"}</strong>
            <p>
              {user.data
                ? "У этой учётной записи нет прав администратора."
                : "Вход выполнен, но профиль пользователя пока не получен."}
            </p>
          </div>
        </section>
        {user.error ? (
          <div className="notice warning">
            Не удалось проверить права доступа. Попробуйте войти ещё раз.
          </div>
        ) : null}
      </AppShell>
    );
  }

  return (
    <AppShell eyebrow="Школа ухода за колостомой" title="Панель администратора">
      <section className="admin-summary">
        <div>
          <p>
            Здесь можно добавлять, загружать и публиковать обучающие материалы для
            пациентов.
          </p>
        </div>
      </section>

      <section className="stats-grid" aria-label="Статистика видео">
        <div>
          <strong>{stats.data?.total ?? "-"}</strong>
          <span>Всего</span>
        </div>
        <div>
          <strong>{stats.data?.published ?? "-"}</strong>
          <span>Опубликовано</span>
        </div>
        <div>
          <strong>{stats.data?.draft ?? "-"}</strong>
          <span>Черновики</span>
        </div>
      </section>

      <form className="admin-form" onSubmit={onSubmit}>
        <h2>Добавить обучающий материал</h2>
        <div className="notice">
          Выберите MP4, WebM или MOV. Можно оставить поле пустым и прикрепить видео
          позже.
        </div>
        <label className="field">
          <span>Название видео</span>
          <input
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Название обучающего видео"
            required
          />
        </label>
        <label className="field">
          <span>Описание для пациента</span>
          <textarea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Кратко расскажите, чему поможет этот материал"
            rows={4}
          />
        </label>
        <label className="field">
          <span>Специалист / автор материала</span>
          <input
            value={form.lecturer}
            onChange={(event) => updateField("lecturer", event.target.value)}
            placeholder="Имя и должность специалиста"
            required
          />
        </label>
        <label className="field">
          <span>Раздел</span>
          <input
            value={form.category}
            onChange={(event) => updateField("category", event.target.value)}
            placeholder="Например, Основы ухода"
            required
          />
        </label>
        <label className="field">
          <span>Статус</span>
          <select
            value={form.status}
            onChange={(event) => updateField("status", event.target.value as Lecture["status"])}
          >
            <option value="draft">Черновик</option>
            <option value="published">Опубликовано</option>
          </select>
        </label>
        <label className={file ? "upload-dropzone active" : "upload-dropzone"}>
          <FileVideo aria-hidden="true" size={30} />
          <span>{file ? file.name : "Файл видео"}</span>
          <small>
            {file
              ? `Выбран файл: ${(file.size / 1024 / 1024).toFixed(1)} МБ`
              : "Выберите файл или оставьте поле пустым, чтобы добавить видео позже."}
          </small>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>

        {message ? <div className="notice success">{message}</div> : null}
        {error ? <div className="notice warning">{error}</div> : null}

        <div className="button-row">
          <button
            className="button secondary"
            type="button"
            onClick={() => void refreshAdminData()}
            disabled={createMutation.isPending}
          >
            <RefreshCw aria-hidden="true" size={18} />
            Обновить
          </button>
          <button className="button primary" type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              "Сохраняем..."
            ) : (
              <>
                <Save aria-hidden="true" size={18} />
                Сохранить материал
              </>
            )}
          </button>
        </div>
      </form>

      <section className="admin-list" aria-label="Добавленные материалы">
        <div className="section-heading">
          <h2>Добавленные материалы</h2>
        </div>
        {lectures.isLoading ? (
          <div className="empty-state">Загружаем материалы...</div>
        ) : adminLectures.length === 0 ? (
          <div className="empty-state">Материалов пока нет.</div>
        ) : (
          adminLectures.map((lecture) => (
            <article className="admin-lecture" key={lecture.id}>
              <div>
                <p className="category-label">{lecture.category}</p>
                <h3>{lecture.title}</h3>
                <p>{lecture.lecturer} · {formatLectureDate(lecture.createdAt)}</p>
                <p>{lecture.videoUrl ? "Видео прикреплено" : "Видео пока не прикреплено"}</p>
              </div>
              <div className="admin-actions">
                <span className={lecture.status === "published" ? "status published" : "status draft"}>
                  {lecture.status === "published" ? "Опубликовано" : "Черновик"}
                </span>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() =>
                    statusMutation.mutate({
                      id: lecture.id,
                      status: lecture.status === "published" ? "draft" : "published",
                    })
                  }
                  disabled={statusMutation.isPending}
                >
                  {lecture.status === "published" ? "В черновик" : "Опубликовать"}
                </button>
                <button
                  className="button danger"
                  type="button"
                  onClick={() => deleteMutation.mutate(lecture.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 aria-hidden="true" size={16} />
                  Удалить
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </AppShell>
  );
}

function getVideoContentType(file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "mp4") return "video/mp4";
  if (extension === "webm") return "video/webm";
  if (extension === "mov") return "video/quicktime";
  return file.type || "application/octet-stream";
}

async function uploadFile(
  uploadURL: string,
  file: File,
  contentType: string,
): Promise<void> {
  const response = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": contentType,
    },
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить видео: ${response.status}`);
  }
}
