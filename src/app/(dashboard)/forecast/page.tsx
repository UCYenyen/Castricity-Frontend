import { WhatIfPanel } from "@/components/features/forecast/whatif-panel";

export const metadata = {
  title: "Castricity — What-if Forecaster",
  description: "Run what-if scenarios against the electricity demand model.",
};

export default function ForecastPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <WhatIfPanel />
    </div>
  );
}
