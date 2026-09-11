import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

import LandingNav from '@/components/landing-v3/Nav';
import HeroSection from '@/components/landing-v3/HeroSection';
import LifecycleSection from '@/components/landing-v3/LifecycleStepper';
import StakeholderSection from '@/components/landing-v3/StakeholdersSection';
import PlatformSection from '@/components/landing-v3/PlatformSection';
import BenefitsSection from '@/components/landing-v3/BenefitsSection';
import PricingSection from '@/components/landing-v3/PricingSection';
import TrustSection from '@/components/landing-v3/TrustSection';
import FinalCTA from '@/components/landing-v3/FinalCTA';
import Footer from '@/components/landing-v3/Footer';

import '@/styles/landing-v3.css';

export default function LandingPageV3() {
  useEffect(() => {
    // Set meta for landing page
    document.title = 'Apni Estate — Construction Management ERP & Real Estate CRM';

    const prev = {
      bg: document.body.style.background,
      color: document.body.style.color,
      font: document.body.style.fontFamily,
      overflow: document.body.style.overflowX,
    };

    document.body.style.background = '#FFFFFF';
    document.body.style.color = '#0F172A';
    document.body.style.fontFamily = "'Inter', system-ui, sans-serif";
    document.body.style.overflowX = 'hidden';

    return () => {
      document.body.style.background = prev.bg;
      document.body.style.color = prev.color;
      document.body.style.fontFamily = prev.font;
      document.body.style.overflowX = prev.overflow;
    };
  }, []);

  return (
    <div className="ae-landing">
      <LandingNav />
      <HeroSection />
      <LifecycleSection />
      <StakeholderSection />
      <PlatformSection />
      <BenefitsSection />
      <PricingSection />
      <TrustSection />
      <FinalCTA />
      <Footer />

      {/* Mobile sticky CTA */}
      <div className="ae-sticky-cta">
        <Link to="/login" style={{
          flex: 1, display: 'block', textAlign: 'center',
          background: '#0B132B', color: '#fff',
          padding: '12px', borderRadius: 12,
          fontSize: 14, fontWeight: 700, textDecoration: 'none',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          Log In
        </Link>
        <Link to="/signup" style={{
          flex: 1, display: 'block', textAlign: 'center',
          background: '#FCC300', color: '#0B132B',
          padding: '12px', borderRadius: 12,
          fontSize: 14, fontWeight: 700, textDecoration: 'none',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          Start Free Trial
        </Link>
      </div>
    </div>
  );
}
