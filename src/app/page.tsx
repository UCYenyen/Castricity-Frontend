import { Navbar } from "@/components/features/landing/navbar";
import { Hero } from "@/components/features/landing/hero";
import { Features } from "@/components/features/landing/features";
import { Footer } from "@/components/features/landing/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
