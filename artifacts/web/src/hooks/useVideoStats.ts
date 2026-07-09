import { useQuery } from "@tanstack/react-query";
import { getVideoStats } from "../api/client";

export function useVideoStats(enabled: boolean) {
  return useQuery({
    queryKey: ["video-stats"],
    queryFn: getVideoStats,
    enabled,
    retry: 1,
  });
}
