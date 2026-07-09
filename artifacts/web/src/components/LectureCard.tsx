import { CalendarDays, ChevronRight, FileText, PlayCircle, UserRound } from "lucide-react";
import type { Lecture } from "../api/client";
import { formatLectureDate } from "../lib/format";
import { Link } from "../lib/router";

export function LectureCard({ lecture }: { lecture: Lecture }) {
  return (
    <article className="lecture-card">
      <div className="card-media">
        {lecture.videoUrl ? <PlayCircle aria-hidden="true" size={34} /> : <FileText aria-hidden="true" size={34} />}
        <span>{lecture.category}</span>
      </div>
      <div className="card-body">
        <span className={lecture.videoUrl ? "content-badge video" : "content-badge material"}>
          {lecture.videoUrl ? "Видео" : "Материал"}
        </span>
        <h2>{lecture.title}</h2>
        <p className="card-description">{lecture.description}</p>
        <div className="metadata-row">
          <span>
            <UserRound aria-hidden="true" size={15} />
            {lecture.lecturer}
          </span>
          <span>
            <CalendarDays aria-hidden="true" size={15} />
            {formatLectureDate(lecture.createdAt)}
          </span>
        </div>
        <Link href={`/lectures/${lecture.id}`} className="primary-link">
          {lecture.videoUrl ? "Смотреть видео" : "Открыть материал"}
          <ChevronRight aria-hidden="true" size={18} />
        </Link>
      </div>
    </article>
  );
}
