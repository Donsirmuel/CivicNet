import { Nav } from '../components/landing/Nav';
import { MapHero } from '../components/landing/MapHero';
import { ProblemStory } from '../components/landing/ProblemStory';
import { HowItMoves } from '../components/landing/HowItMoves';
import { EscalationStory } from '../components/landing/EscalationStory';
import { ResolutionStory } from '../components/landing/ResolutionStory';
import { ClosingBand } from '../components/landing/ClosingBand';
import { Footer } from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <main className="lovable-landing relative">
      <Nav />
      <MapHero />
      <ProblemStory />
      <EscalationStory />
      <HowItMoves />
      <ResolutionStory />
      <ClosingBand />
      <Footer />
    </main>
  );
}
