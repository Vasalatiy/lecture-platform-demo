import type { Lecture } from "../api/client";

export const mockLectures: Lecture[] = [
  {
    id: "intro-platform",
    title: "Как ухаживать за колостомой в первые дни",
    description:
      "Понятная видеоинструкция о ежедневном уходе, гигиене и бережном отношении к коже.",
    lecturer: "Медицинский специалист",
    category: "Основы ухода",
    videoUrl: "",
    status: "published",
    createdAt: "2026-05-14T09:30:00.000Z",
  },
  {
    id: "video-foundations",
    title: "Замена калоприёмника: пошаговая инструкция",
    description:
      "Пошаговая подготовка и замена калоприёмника в домашних условиях.",
    lecturer: "Медицинский специалист",
    category: "Видеоинструкции",
    videoUrl: "",
    status: "published",
    createdAt: "2026-05-21T11:00:00.000Z",
  },
  {
    id: "course-ops",
    title: "Уход за кожей вокруг стомы",
    description:
      "Как очищать и защищать кожу, а также на какие изменения важно обратить внимание.",
    lecturer: "Медицинский специалист",
    category: "Здоровье кожи",
    videoUrl: "",
    status: "published",
    createdAt: "2026-06-03T15:15:00.000Z",
  },
  {
    id: "when-to-see-doctor",
    title: "Когда нужно обратиться к врачу",
    description:
      "Какие изменения самочувствия и состояния стомы требуют консультации специалиста.",
    lecturer: "Врач-колопроктолог",
    category: "Важные симптомы",
    videoUrl: "",
    status: "published",
    createdAt: "2026-06-10T10:00:00.000Z",
  },
  {
    id: "nutrition-lifestyle",
    title: "Питание и образ жизни после формирования колостомы",
    description:
      "Практические рекомендации о питании, питьевом режиме и возвращении к привычной активности.",
    lecturer: "Медицинский специалист",
    category: "Образ жизни",
    videoUrl: "",
    status: "published",
    createdAt: "2026-06-17T12:30:00.000Z",
  },
];
