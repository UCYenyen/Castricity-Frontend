import { LiveView } from "@/components/features/live/live-view";

export const metadata = {
  title: "Castricity — Live Forecaster",
  description: "Real-time electricity demand forecasting with live SSE streaming, anomaly detection, and what-if scenario analysis.",
};

export default function LivePage() {
  return <LiveView />;
}
