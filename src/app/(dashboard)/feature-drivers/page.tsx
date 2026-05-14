import { FeatureDriversView } from "@/components/features/feature-drivers/feature-drivers-view";

export const metadata = {
  title: "Castricity — Feature Drivers",
  description: "Fitur-fitur yang digunakan model dan tingkat kepentingan SHAP global.",
};

export default function FeatureDriversPage() {
  return <FeatureDriversView />;
}
