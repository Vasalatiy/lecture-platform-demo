import { useQuery } from "@tanstack/react-query";
import { getLectureStreamUrl } from "../api/client";

export function useLectureStream(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["lecture-stream", id],
    enabled: Boolean(id) && enabled,
    retry: 1,
    queryFn: async () => {
      if (!id) {
        throw new Error("Lecture id is required.");
      }

      return getLectureStreamUrl(id);
    },
  });
}
