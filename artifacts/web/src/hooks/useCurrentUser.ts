import { useQuery } from "@tanstack/react-query";
import { getMe } from "../api/client";

export function useCurrentUser(enabled = true) {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: getMe,
    enabled,
    retry: 1,
  });
}
