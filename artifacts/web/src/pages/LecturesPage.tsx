import { Search } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { LectureCard } from "../components/LectureCard";
import { useLectures } from "../hooks/useLectures";

export function LecturesPage() {
  const lectures = useLectures();
  const data = lectures.data;

  return (
    <AppShell eyebrow="Обучающие материалы для пациентов и их родственников" title="Школа ухода за трахеостомой">
      <p className="helper-note">
        Короткие демонстрационные видео и материалы знакомят с темами ежедневного
        ухода за трахеостомой и обращения за медицинской помощью.
      </p>
      <div className="catalog-tools">
        <div className="search-box">
          <Search aria-hidden="true" size={18} />
          <input placeholder="Найдите нужный материал" disabled />
        </div>
      </div>
      {data?.source === "mock" ? (
        <div className="notice">
          Не удалось загрузить материалы. Пока можно посмотреть демонстрационные
          образовательные материалы.
        </div>
      ) : null}
      <section className="lecture-list" aria-label="Каталог образовательных материалов">
        {lectures.isLoading ? (
          <div className="empty-state">Загружаем материалы...</div>
        ) : data?.lectures.length === 0 ? (
          <div className="empty-state">
            Материалы пока не добавлены. После публикации они появятся на этой странице.
          </div>
        ) : (
          data?.lectures.map((lecture) => <LectureCard key={lecture.id} lecture={lecture} />)
        )}
      </section>
    </AppShell>
  );
}
