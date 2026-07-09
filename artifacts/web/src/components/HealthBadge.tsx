import { Activity, WifiOff } from "lucide-react";
import { useApiHealth } from "../hooks/useApiHealth";

export function HealthBadge() {
  const health = useApiHealth();
  const healthy = health.data?.status === "ok" || health.data?.status === "healthy";

  return (
    <div className={healthy ? "health-badge healthy" : "health-badge"}>
      {healthy ? <Activity aria-hidden="true" size={16} /> : <WifiOff aria-hidden="true" size={16} />}
      <span>{healthy ? "API connected" : "API pending"}</span>
    </div>
  );
}
