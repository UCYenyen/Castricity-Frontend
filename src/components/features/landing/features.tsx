import { Activity, BrainCircuit, LineChart, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "AI-Powered Forecasts",
    description: "State-of-the-art XGBoost models provide day-ahead and week-ahead demand predictions.",
    icon: LineChart,
    accent: "text-accent-green",
    bg: "bg-accent-green/10",
    border: "border-accent-green/20",
  },
  {
    title: "Anomaly Detection",
    description: "Automatically identify heatwaves, solar drops, and anomalous consumption patterns.",
    icon: ShieldAlert,
    accent: "text-accent-red",
    bg: "bg-accent-red/10",
    border: "border-accent-red/20",
  },
  {
    title: "Explainable AI",
    description: "Dive into what-if scenarios and understand the exact factors driving demand spikes.",
    icon: BrainCircuit,
    accent: "text-accent-purple",
    bg: "bg-accent-purple/10",
    border: "border-accent-purple/20",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-card/30 border-y border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need for grid operations
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Built for operators, data scientists, and energy analysts.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Card key={i} className={`bg-popover/40 backdrop-blur border border-border transition-all hover:border-muted-foreground/30 hover:shadow-lg`}>
                <CardHeader>
                  <div className={`size-10 rounded-lg flex items-center justify-center mb-4 border ${feature.bg} ${feature.border} ${feature.accent}`}>
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-text-secondary leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
