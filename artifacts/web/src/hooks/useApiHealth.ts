import { useQuery } from "@tanstack/react-query";
import { getHealth } from "../api/client";

export function useApiHealth() {
  return useQuery({
    queryKey: ["api-health"],
    queryFn: getHealth,
    retry: 1,
  });
}
