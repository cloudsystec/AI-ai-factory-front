import "./styles/landing.css";
import Navigation from "./components/layout/Navigation.jsx";
import Footer from "./components/layout/Footer.jsx";
import HeroSection from "./components/Index/HeroSection.jsx";
import SolucaoSection from "./components/Index/SolucaoSection.jsx";
import ComoFuncionaSection from "./components/Index/ComoFuncionaSection.jsx";
import PrecosSection from "./components/Index/PrecosSection.jsx";
import FaqSection from "./components/Index/FaqSection.jsx";
import CtaBannerSection from "./components/Index/CtaBannerSection.jsx";
import { LandingModalProvider } from "./LandingModalContext.jsx";

export default function LandingPage() {
  return (
    <LandingModalProvider>
      <div className="landing-root antialiased selection:bg-purple-500/30 relative">
        <div className="bg-glow-orb w-[600px] h-[600px] bg-purple-600/30 top-[-10%] left-[-10%]" />
        <div className="bg-glow-orb w-[500px] h-[500px] bg-blue-600/20 top-[20%] right-[-5%]" />
        <div className="bg-glow-orb w-[800px] h-[800px] bg-purple-900/20 bottom-[-10%] left-[20%]" />
        <Navigation />
        <main className="relative z-10">
          <HeroSection />
          <SolucaoSection />
          <ComoFuncionaSection />
          <PrecosSection />
          <FaqSection />
          <CtaBannerSection />
        </main>
        <Footer />
      </div>
    </LandingModalProvider>
  );
}
