import { ForecastView } from "@/components/features/forecast/forecast-view";

export const metadata = {
  title: "Castricity — Multi-horizon Forecast",
  description: "Multi-horizon demand forecast with what-if scenario analysis.",
};

export default function ForecastPage() {
  return <ForecastView />;
}
