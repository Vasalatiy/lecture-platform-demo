import { useQuery } from "@tanstack/react-query";
import { getLecture, getLectures } from "../api/client";
import { mockLectures } from "../data/mockLectures";

export type DataSource = "api" | "mock";

export function useLectures() {
  return useQuery({
    queryKey: ["lectures"],
    queryFn: async () => {
      try {
        const lectures = await getLectures();
        return { lectures, source: "api" as DataSource, errorMessage: null };
      } catch (error) {
        return {
          lectures: mockLectures,
          source: "mock" as DataSource,
          errorMessage: error instanceof Error ? error.message : "The video API is unavailable.",
        };
      }
    },
  });
}

export function useLecture(id: string | undefined) {
  return useQuery({
    queryKey: ["lecture", id],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) {
        throw new Error("Lecture id is required.");
      }

      try {
        const lecture = await getLecture(id);
        return { lecture, source: "api" as DataSource, errorMessage: null };
      } catch (error) {
        return {
          lecture: mockLectures.find((item) => item.id === id) ?? null,
          source: "mock" as DataSource,
          errorMessage: error instanceof Error ? error.message : "The video API is unavailable.",
        };
      }
    },
  });
}
