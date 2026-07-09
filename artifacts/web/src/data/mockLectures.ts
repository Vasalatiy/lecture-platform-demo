import type { Lecture } from "../api/client";

export const mockLectures: Lecture[] = [
  {
    id: "intro-platform",
    title: "Designing Private Learning Spaces",
    description:
      "A practical lecture on shaping trusted digital classrooms with focused video, metadata, and role-aware publishing.",
    lecturer: "Dr. Mira Solan",
    category: "Platform Design",
    videoUrl: "",
    status: "published",
    createdAt: "2026-05-14T09:30:00.000Z",
  },
  {
    id: "video-foundations",
    title: "Video Delivery Foundations",
    description:
      "How lecture files move from upload to playback, including object paths, streaming endpoints, and browser video behavior.",
    lecturer: "Anton Reyes",
    category: "Engineering",
    videoUrl: "",
    status: "published",
    createdAt: "2026-05-21T11:00:00.000Z",
  },
  {
    id: "course-ops",
    title: "Course Operations for Small Cohorts",
    description:
      "A systems view of categories, publishing workflow, admin review, and simple catalog maintenance.",
    lecturer: "Nadia Chen",
    category: "Operations",
    videoUrl: "",
    status: "published",
    createdAt: "2026-06-03T15:15:00.000Z",
  },
];
