import React from 'react';
import { HeroA } from '../components/sections/HeroA';
import { HeroB, OperatorShelf } from '../components/sections/HeroB';
import {
  CompareSection,
  FaqSection,
  FactsStrip,
  FeaturesSection,
  FinalCta,
  HowItWorks,
  PrivacySection,
  ProductShot,
  TourSection,
  UpcomingSection,
} from '../components/sections/Sections';

/**
 * Two designs share every word and differ in form. VITE_VARIANT picks one at
 * build time (vite.config.ts), and the other is dropped from the bundle. Once
 * one is chosen, the other and this switch are deleted.
 */
const VARIANT = import.meta.env.VITE_VARIANT === 'b' ? 'b' : 'a';

export const Home: React.FC = () =>
  VARIANT === 'b' ? (
    <>
      <HeroB />
      <OperatorShelf />
      <TourSection />
      <FeaturesSection />
      <UpcomingSection />
      <HowItWorks />
      <ProductShot />
      <PrivacySection />
      <CompareSection />
      <FaqSection />
      <FinalCta title="Type it once. Click it forever." body="Free, open source, and a minute to set up." />
    </>
  ) : (
    <>
      <HeroA />
      <FactsStrip />
      <TourSection />
      <FeaturesSection />
      <UpcomingSection />
      <HowItWorks />
      <ProductShot />
      <CompareSection />
      <PrivacySection />
      <FaqSection />
      <FinalCta title="Put your busiest views one click away." body="Free, open source, and a minute to set up." />
    </>
  );
