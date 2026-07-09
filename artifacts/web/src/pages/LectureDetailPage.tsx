import { ArrowLeft, CalendarDays, UserRound } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { useLectureStream } from "../hooks/useLectureStream";
import { useLecture } from "../hooks/useLectures";
import { formatLectureDate } from "../lib/format";
import { getLectureId, Link, useRouter } from "../lib/router";

export function LectureDetailPage() {
  const router = useRouter();
  const lectureId = getLectureId(router.path);
  const lecture = useLecture(lectureId);
  const data = lecture.data;
  const hasVideoFile = Boolean(data?.lecture?.videoUrl);
  const stream = useLectureStream(lectureId, data?.source === "api" && hasVideoFile);

  if (lecture.isLoading) {
    return (
      <AppShell eyebrow="Видеоинструкция" title="Загрузка">
        <div className="empty-state">Загружаем материал...</div>
      </AppShell>
    );
  }

  if (!data?.lecture) {
    return (
      <AppShell eyebrow="Видеоинструкция" title="Материал не найден">
        <Link href="/lectures" className="secondary-link">
          <ArrowLeft aria-hidden="true" size={18} />
          Вернуться к видео
        </Link>
        <div className="empty-state">
          Не удалось найти этот материал.
        </div>
      </AppShell>
    );
  }

  const activeLecture = data.lecture;

  return (
    <AppShell eyebrow={activeLecture.category} title={activeLecture.title}>
      <Link href="/lectures" className="secondary-link">
        <ArrowLeft aria-hidden="true" size={18} />
        Назад
      </Link>
      {data.source === "mock" ? (
        <div className="notice warning">
          Сейчас показан демонстрационный материал.
        </div>
      ) : null}
      <section className="video-panel">
        {!activeLecture.videoUrl ? (
          <div className="video-placeholder">
            Видео к этому материалу пока не прикреплено
          </div>
        ) : stream.isLoading ? (
          <div className="video-placeholder">Подготавливаем видео...</div>
        ) : stream.data?.url ? (
          <video src={stream.data.url} controls playsInline preload="metadata" />
        ) : stream.error ? (
          <div className="video-placeholder">
            Не удалось загрузить видео.
          </div>
        ) : (
          <div className="video-placeholder">
            Видео к этому материалу пока недоступно.
          </div>
        )}
      </section>
      <section className="detail-panel">
        <div className="metadata-row detail">
          <span>
            <UserRound aria-hidden="true" size={16} />
            Специалист / автор материала: {activeLecture.lecturer}
          </span>
          <span>
            <CalendarDays aria-hidden="true" size={16} />
            {formatLectureDate(activeLecture.createdAt)}
          </span>
        </div>
        <h2>О материале</h2>
        <p>{activeLecture.description}</p>
      </section>
    </AppShell>
  );
}
