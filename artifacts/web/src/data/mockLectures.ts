import type { Lecture } from "../api/client";

export const mockLectures: Lecture[] = [
  {
    id: "tracheostomy-introduction",
    title: "Знакомство с трахеостомой",
    description:
      "Демонстрационный образовательный материал для знакомства с темой трахеостомы и форматом внутреннего MVP.",
    lecturer: "Кафедра торакальной хирургии",
    category: "Знакомство",
    videoUrl: "",
    status: "published",
    createdAt: "2026-05-14T09:30:00.000Z",
  },
  {
    id: "daily-care-preparation",
    title: "Подготовка к ежедневному уходу",
    description:
      "Демонстрационный образовательный материал о подготовке к повседневному уходу без лечебных назначений и индивидуальных рекомендаций.",
    lecturer: "Кафедра торакальной хирургии",
    category: "Ежедневный уход",
    videoUrl: "",
    status: "published",
    createdAt: "2026-05-21T11:00:00.000Z",
  },
  {
    id: "tracheostomy-area-care",
    title: "Уход за областью трахеостомы",
    description:
      "Демонстрационный образовательный материал, показывающий структуру будущих пояснений по теме ухода.",
    lecturer: "Кафедра торакальной хирургии",
    category: "Основы ухода",
    videoUrl: "",
    status: "published",
    createdAt: "2026-06-03T15:15:00.000Z",
  },
  {
    id: "when-to-seek-medical-help",
    title: "Когда необходимо обратиться за медицинской помощью",
    description:
      "Демонстрационный образовательный материал о том, что вопросы состояния здоровья следует обсуждать с медицинским специалистом.",
    lecturer: "Кафедра торакальной хирургии",
    category: "Медицинская помощь",
    videoUrl: "",
    status: "published",
    createdAt: "2026-06-10T10:00:00.000Z",
  },
];
