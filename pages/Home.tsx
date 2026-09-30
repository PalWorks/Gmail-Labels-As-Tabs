import React from 'react';
import { HeroA } from '../components/sections/HeroA';
import {
  CompareSection,
  FaqSection,
  FactsStrip,
  FeaturesSection,
  FinalCta,
  HowItWorks,
  PrivacySection,
  TourSection,
  UpcomingSection,
  VideoSection,
} from '../components/sections/Sections';

export const Home: React.FC = () => (
  <>
    <HeroA />
    <FactsStrip />
    <TourSection />
    <FeaturesSection />
    <UpcomingSection />
    <HowItWorks />
    <VideoSection />
    <CompareSection />
    <PrivacySection />
    <FaqSection />
    <FinalCta title="Put your busiest views one click away." body="Free, open source, and a minute to set up." />
  </>
);
