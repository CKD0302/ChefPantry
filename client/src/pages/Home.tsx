import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import HowItWorks from "@/components/HowItWorks";
import ForChefs from "@/components/ForChefs";
import ForBusinesses from "@/components/ForBusinesses";
import Testimonials from "@/components/Testimonials";
import FeaturedDishes from "@/components/FeaturedDishes";
import CallToAction from "@/components/CallToAction";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-800">
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <HowItWorks />
        <ForChefs />
        <ForBusinesses />
        <Testimonials />
        <FeaturedDishes />
        <CallToAction />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
