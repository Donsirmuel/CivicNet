import { Nav } from '../components/landing/Nav';
import { MapHero } from '../components/landing/MapHero';
import { HowItMoves } from '../components/landing/HowItMoves';
import { ClosingBand } from '../components/landing/ClosingBand';
import { Footer } from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="lovable-landing relative">
      <Nav />
      <MapHero />
      <HowItMoves />
      <ClosingBand />
      <Footer />
    </main>
  );
}
