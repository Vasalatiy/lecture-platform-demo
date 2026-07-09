import { Search } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { HealthBadge } from "../components/HealthBadge";
import { LectureCard } from "../components/LectureCard";
import { useLectures } from "../hooks/useLectures";

export function LecturesPage() {
  const lectures = useLectures();
  const data = lectures.data;

  return (
    <AppShell eyebrow="Mobile learning" title="Lectures">
      <div className="catalog-tools">
        <div className="search-box">
          <Search aria-hidden="true" size={18} />
          <input placeholder="Search lectures" disabled />
        </div>
        <HealthBadge />
      </div>
      {data?.source === "mock" ? (
        <div className="notice warning">
          Showing demo lecture data because `/api/videos` is unavailable or requires sign-in.
          {data.errorMessage ? <span> Backend response: {data.errorMessage}</span> : null}
        </div>
      ) : null}
      <section className="lecture-list" aria-label="Lecture catalog">
        {lectures.isLoading ? (
          <div className="empty-state">Loading lectures...</div>
        ) : data?.lectures.length === 0 ? (
          <div className="empty-state">No lectures are available yet.</div>
        ) : (
          data?.lectures.map((lecture) => <LectureCard key={lecture.id} lecture={lecture} />)
        )}
      </section>
      <p className="helper-note">Catalog data is requested from `/api/videos`; demo data is only used as a temporary fallback.</p>
    </AppShell>
  );
}
