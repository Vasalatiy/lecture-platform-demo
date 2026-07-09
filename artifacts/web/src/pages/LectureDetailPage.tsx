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
      <AppShell eyebrow="Lecture" title="Loading">
        <div className="empty-state">Loading lecture...</div>
      </AppShell>
    );
  }

  if (!data?.lecture) {
    return (
      <AppShell eyebrow="Lecture" title="Not found">
        <Link href="/lectures" className="secondary-link">
          <ArrowLeft aria-hidden="true" size={18} />
          Back to catalog
        </Link>
        <div className="empty-state">
          This lecture was not found from `/api/videos/:id` or the temporary demo fallback.
          {data?.errorMessage ? ` Backend response: ${data.errorMessage}` : null}
        </div>
      </AppShell>
    );
  }

  const activeLecture = data.lecture;

  return (
    <AppShell eyebrow={activeLecture.category} title={activeLecture.title}>
      <Link href="/lectures" className="secondary-link">
        <ArrowLeft aria-hidden="true" size={18} />
        Back
      </Link>
      {data.source === "mock" ? (
        <div className="notice warning">
          Showing demo lecture metadata because `/api/videos/:id` is unavailable or requires sign-in.
          {data.errorMessage ? <span> Backend response: {data.errorMessage}</span> : null}
        </div>
      ) : null}
      <section className="video-panel">
        {!activeLecture.videoUrl ? (
          <div className="video-placeholder">
            Video file is not attached to this lecture yet. Admins can add local development video storage from the upload form.
          </div>
        ) : stream.isLoading ? (
          <div className="video-placeholder">Preparing video stream...</div>
        ) : stream.data?.url ? (
          <video src={stream.data.url} controls playsInline preload="metadata" />
        ) : stream.error ? (
          <div className="video-placeholder">
            Video stream is unavailable from `/api/videos/:id/stream-url`.
            {stream.error instanceof Error ? ` ${stream.error.message}` : null}
          </div>
        ) : (
          <div className="video-placeholder">
            Video playback requires a live backend lecture and `/api/videos/:id/stream-url`.
          </div>
        )}
      </section>
      <section className="detail-panel">
        <div className="metadata-row detail">
          <span>
            <UserRound aria-hidden="true" size={16} />
            {activeLecture.lecturer}
          </span>
          <span>
            <CalendarDays aria-hidden="true" size={16} />
            {formatLectureDate(activeLecture.createdAt)}
          </span>
        </div>
        <h2>About this lecture</h2>
        <p>{activeLecture.description}</p>
      </section>
    </AppShell>
  );
}
