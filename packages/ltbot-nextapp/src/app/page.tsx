import HeroSection from "./components/home/HeroSection";
import FeatureSection from "./components/home/FeatureSection";
import PersonalizationSection from "./components/home/PersonalizationSection";
import TestimonialsSection from "./components/home/TestimonialsSection";
import FooterSection from "./components/home/FooterSection";
import HabitEntrySection from "./components/home/HabitEntrySection";

export default function Home() {
  return (
    <main style={{ background: "var(--theme-bg-base)" }}>
      <HeroSection />
      <HabitEntrySection />
      <FeatureSection />
      <PersonalizationSection />
      <TestimonialsSection />
      <FooterSection />
    </main>
  );
}
