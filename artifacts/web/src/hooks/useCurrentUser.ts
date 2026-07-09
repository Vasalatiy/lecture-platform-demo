import { useQuery } from "@tanstack/react-query";
import { getMe } from "../api/client";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: getMe,
    retry: 1,
  });
}
