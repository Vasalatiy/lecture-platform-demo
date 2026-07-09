import { Search } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { LectureCard } from "../components/LectureCard";
import { useLectures } from "../hooks/useLectures";

export function LecturesPage() {
  const lectures = useLectures();
  const data = lectures.data;

  return (
    <AppShell eyebrow="Школа ухода за колостомой" title="Обучающие видео">
      <p className="helper-note">
        Материалы для пациентов и их близких: понятные видеоинструкции по уходу за
        колостомой.
      </p>
      <div className="catalog-tools">
        <div className="search-box">
          <Search aria-hidden="true" size={18} />
          <input placeholder="Найдите нужный материал" disabled />
        </div>
      </div>
      {data?.source === "mock" ? (
        <div className="notice">
          Не удалось загрузить материалы. Пока можно посмотреть примеры
          видеоинструкций.
        </div>
      ) : null}
      <section className="lecture-list" aria-label="Каталог обучающих видео">
        {lectures.isLoading ? (
          <div className="empty-state">Загружаем материалы...</div>
        ) : data?.lectures.length === 0 ? (
          <div className="empty-state">Пока нет опубликованных материалов</div>
        ) : (
          data?.lectures.map((lecture) => <LectureCard key={lecture.id} lecture={lecture} />)
        )}
      </section>
    </AppShell>
  );
}
