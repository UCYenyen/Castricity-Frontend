import { ForecastView } from "@/components/features/forecast/forecast-view";

export const metadata = {
  title: "Castricity — Multi-horizon Forecast",
  description: "Peramalan permintaan multi-horizon dengan analisis skenario bagaimana-jika.",
};

export default function ForecastPage() {
  return <ForecastView />;
}
