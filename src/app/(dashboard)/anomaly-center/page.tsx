import { AnomalyCenterView } from "@/components/features/anomaly-center/anomaly-center-view";

export const metadata = {
  title: "Castricity — Anomaly Center",
  description: "All flagged anomalous demand points across the historical window.",
};

export default function AnomalyCenterPage() {
  return <AnomalyCenterView />;
}
