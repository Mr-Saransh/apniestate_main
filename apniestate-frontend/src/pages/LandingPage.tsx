import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

import Nav from '@/components/landing2/Nav';
import ConstructionHero from '@/components/landing2/construction/ConstructionHero';
import ConstructionFeatures from '@/components/landing2/construction/ConstructionFeatures';
import ConstructionWorkflow from '@/components/landing2/construction/ConstructionWorkflow';
import Stats from '@/components/landing2/Stats';
import RecognizedBy from '@/components/landing2/RecognizedBy';
import ConstructionCTA from '@/components/landing2/construction/ConstructionCTA';
import Footer from '@/components/landing2/Footer';

import '@/styles/landing2.css';

export default function LandingPage() {
  // Apply any body styles here to prevent leaking to other pages if needed
  useEffect(() => {
    document.body.style.background = '#F5F7FF';
    document.body.style.color = '#0B1F4D';
    document.body.style.fontFamily = "'Inter', system-ui, sans-serif";
    
    return () => {
      document.body.style.background = '';
      document.body.style.color = '';
      document.body.style.fontFamily = '';
    };
  }, []);

  return (
    <div style={{ background: '#F5F7FF', minHeight: '100vh', overflowX: 'hidden' }}>
      <Nav />
      <ConstructionHero />
      <RecognizedBy />
      <ConstructionFeatures />
      <ConstructionWorkflow />
      <Stats />
      <ConstructionCTA />
      <Footer />

      {/* Sticky mobile CTA */}
      <div className="sticky-cta">
        <Link to="/login" style={{
          flex: 1, display: 'block', textAlign: 'center',
          background: '#0B1F4D', color: '#fff',
          padding: '12px', borderRadius: 12,
          fontSize: 14, fontWeight: 700, textDecoration: 'none',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          Sign In
        </Link>
        <Link to="/signup" style={{
          flex: 1, display: 'block', textAlign: 'center',
          background: '#F5B301', color: '#0B1F4D',
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
