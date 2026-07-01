import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, ChevronRight, HardHat, ShieldCheck, Clock,
  Users, ArrowRight, Zap, RefreshCw, BarChart2,
  Briefcase, Activity, AlertTriangle, FileText, Check
} from 'lucide-react';
import Logo from '@/components/shared/Logo';
import '@/styles/landing.css';

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState<'builder' | 'supervisor' | 'manager' | 'accountant'>('builder');

  // Intersection Observer for fade-in animations
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('lp-animate-fade');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-2-0" style={{ backgroundColor: 'var(--lp-bg)' }}>

      {/* 1. ENTERPRISE NAVIGATION */}
      <header className="lp-nav">
        <div className="lp-nav-container">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Logo size="md" />
          </Link>

          <div className="lp-nav-links">
            <a href="#features" className="lp-nav-link">Features</a>
            <a href="#roles" className="lp-nav-link">Roles</a>
            <a href="#recognition" className="lp-nav-link">Recognition</a>
            <a href="#pricing" className="lp-nav-link">Pricing</a>
            <a href="#about" className="lp-nav-link">About</a>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link to="/login" className="lp-nav-link" style={{ fontWeight: 600 }}>Login</Link>
            <Link to="/signup" className="lp-btn lp-btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="lp-section" style={{ paddingTop: '80px', paddingBottom: '80px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', marginBottom: '60px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'var(--lp-surface)', borderRadius: '20px', border: '1px solid var(--lp-border)', marginBottom: '24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--lp-primary)' }}>
            <Zap size={14} fill="var(--lp-primary)" /> The Operating System for Indian Construction
          </div>
          <h1 className="lp-h1 animate-on-scroll" style={{ marginBottom: '24px' }}>
            Build Smarter. <br /> <span className="lp-gradient-text" style={{ fontWeight: 800 }}>Manage Everything.</span>
          </h1>
          <p className="lp-subtitle animate-on-scroll" style={{ marginBottom: '40px', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 40px auto' }}>
            Apni Estate is the premium ERP built specifically for builders, contractors, and site supervisors to eliminate wastage and accelerate project delivery.
          </p>
          <div className="animate-on-scroll" style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Link to="/signup" className="lp-btn lp-btn-primary">Start Building Free <ArrowRight size={18} /></Link>
            <a href="#demo" className="lp-btn lp-btn-secondary">Book a Demo</a>
          </div>
        </div>

        {/* High-Fidelity UI Mockup */}
        <div className="lp-browser-frame animate-on-scroll lp-float" style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
          <div className="lp-browser-header">
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="lp-browser-dot red"></span>
              <span className="lp-browser-dot yellow"></span>
              <span className="lp-browser-dot green"></span>
            </div>
            <div style={{ flex: 1, textAlign: 'center', fontSize: '12px', color: 'var(--lp-text-muted)', fontFamily: 'monospace' }}>
              app.apniestate.in/dashboard
            </div>
          </div>
          {/* Mockup Body Content */}
          <div style={{ padding: '24px', background: '#F8FAFC', minHeight: '400px', textAlign: 'left', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Executive Command Center</h3>
                <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Welcome back, Lead Builder</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="lp-float" style={{ background: '#FFF', padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: 600 }}>12 Active Sites</div>
                <div className="lp-float" style={{ background: '#FFF', padding: '8px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', fontWeight: 600 }}>₹2.4Cr Cashflow</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#FFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Total Portfolio Progress</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#0A3D91', marginTop: '8px' }}>68%</div>
                <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '4px', marginTop: '12px' }}>
                  <div style={{ width: '68%', height: '100%', background: '#0A3D91', borderRadius: '4px' }}></div>
                </div>
              </div>
              <div style={{ background: '#FFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Labour Force Today</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981', marginTop: '8px' }}>1,240 <span style={{ fontSize: '14px', color: '#64748B' }}>Workers</span></div>
              </div>
              <div style={{ background: '#FFF', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Budget Burn Rate</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#F59E0B', marginTop: '8px' }}>42%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (ONBOARDING WORKFLOW) */}
      <section className="lp-section lp-section-bg" style={{ textAlign: 'center' }}>
        <h2 className="lp-h2 animate-on-scroll" style={{ marginBottom: '16px' }}>Start Managing in Minutes</h2>
        <p className="lp-subtitle animate-on-scroll" style={{ marginBottom: '60px', maxWidth: '600px', margin: '0 auto 60px auto' }}>
          Our onboarding flow is designed for speed. Get your entire team aligned without any technical training.
        </p>

        <div className="lp-stepper animate-on-scroll">
          <div className="lp-step">
            <div className="lp-step-number lp-pulse-soft">1</div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Create Account</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--lp-text-muted)', margin: 0 }}>Sign up securely via email or Google.</p>
          </div>
          <div className="lp-step">
            <div className="lp-step-number lp-pulse-soft" style={{ animationDelay: '0.5s' }}>2</div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Select Role</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--lp-text-muted)', margin: 0 }}>Choose your exact designation.</p>
          </div>
          <div className="lp-step">
            <div className="lp-step-number lp-pulse-soft" style={{ animationDelay: '1s' }}>3</div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Setup Company</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--lp-text-muted)', margin: 0 }}>Join an existing workspace or create a new enterprise.</p>
          </div>
          <div className="lp-step">
            <div className="lp-step-number lp-pulse-soft" style={{ animationDelay: '1.5s' }}>4</div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Invite Team</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--lp-text-muted)', margin: 0 }}>Add supervisors, managers, and accountants.</p>
          </div>
          <div className="lp-step">
            <div className="lp-step-number lp-pulse-soft" style={{ animationDelay: '2s' }}>5</div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Build Smarter</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--lp-text-muted)', margin: 0 }}>Track progress, materials, and cashflow in real-time.</p>
          </div>
        </div>
      </section>

      {/* 4. ROLE SHOWCASE */}
      <section id="roles" className="lp-section">
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 className="lp-h2 animate-on-scroll">A Dashboard for Every Role</h2>
          <p className="lp-subtitle animate-on-scroll" style={{ maxWidth: '600px', margin: '16px auto 0 auto' }}>
            Apni Estate provides role-specific intelligence. No clutter. Just the data you need to do your job.
          </p>
        </div>

        <div className="animate-on-scroll" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' }}>
          {[
            { id: 'builder', label: 'Builder / Owner' },
            { id: 'supervisor', label: 'Site Supervisor' },
            { id: 'manager', label: 'Project Manager' },
            { id: 'accountant', label: 'Accountant' }
          ].map(role => (
            <button
              key={role.id}
              onClick={() => setActiveRole(role.id as any)}
              style={{
                padding: '12px 24px',
                borderRadius: '30px',
                fontWeight: 600,
                border: '1px solid',
                borderColor: activeRole === role.id ? 'var(--lp-primary)' : 'var(--lp-border)',
                background: activeRole === role.id ? 'var(--lp-primary)' : 'transparent',
                color: activeRole === role.id ? '#FFF' : 'var(--lp-text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {role.label}
            </button>
          ))}
        </div>

        <div className="lp-card animate-on-scroll" style={{ display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            {activeRole === 'builder' && (
              <>
                <h3 className="lp-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase color="var(--lp-primary)" /> Executive Command Center
                </h3>
                <p style={{ color: 'var(--lp-text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
                  Oversee your entire portfolio from 30,000 feet. Track macro budget burns, portfolio health, automated risk assessments, and approve expenses across all sites instantly.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><CheckCircle2 size={18} color="var(--lp-accent)" /> Portfolio Intelligence</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><CheckCircle2 size={18} color="var(--lp-accent)" /> Universal Approvals</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><CheckCircle2 size={18} color="var(--lp-accent)" /> Financial Forecasting</li>
                </ul>
              </>
            )}
            {activeRole === 'supervisor' && (
              <>
                <h3 className="lp-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HardHat color="var(--lp-primary)" /> Site Execution Engine
                </h3>
                <p style={{ color: 'var(--lp-text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
                  Manage the ground reality. Track daily worker attendance, request materials before they run out, and submit Daily Progress Reports (DPR) directly from your mobile device.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><CheckCircle2 size={18} color="var(--lp-accent)" /> Face/Geo-fenced Attendance</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><CheckCircle2 size={18} color="var(--lp-accent)" /> Material Requests</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><CheckCircle2 size={18} color="var(--lp-accent)" /> Daily Progress Reports</li>
                </ul>
              </>
            )}
            {activeRole === 'accountant' && (
              <>
                <h3 className="lp-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart2 color="var(--lp-primary)" /> Financial Ledger
                </h3>
                <p style={{ color: 'var(--lp-text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
                  Maintain a unified cashbook. Track every rupee spent on materials, labour, and overheads. Process invoices, clear purchase orders, and monitor budget utilization in real-time.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><CheckCircle2 size={18} color="var(--lp-accent)" /> Real-time Cashbook</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><CheckCircle2 size={18} color="var(--lp-accent)" /> Invoice Management</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><CheckCircle2 size={18} color="var(--lp-accent)" /> Expense Vouchers</li>
                </ul>
              </>
            )}
            {activeRole === 'manager' && (
              <>
                <h3 className="lp-h3" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity color="var(--lp-primary)" /> Project Management
                </h3>
                <p style={{ color: 'var(--lp-text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
                  Manage project timelines, assign tasks to supervisors, and track overall progress across multiple active construction sites.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><CheckCircle2 size={18} color="var(--lp-accent)" /> Milestone Tracking</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}><CheckCircle2 size={18} color="var(--lp-accent)" /> Task Delegation</li>
                </ul>
              </>
            )}
          </div>
          <div className="lp-float" style={{ flex: 1, minWidth: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '240px',
              borderRadius: '40px',
              border: '10px solid #121212',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), inset 0 0 0 2px rgba(255,255,255,0.1)',
              overflow: 'hidden',
              backgroundColor: '#121212'
            }}>
              {/* Teardrop Notch */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '36px',
                height: '18px',
                backgroundColor: '#121212',
                borderBottomLeftRadius: '18px',
                borderBottomRightRadius: '18px',
                zIndex: 10,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <div style={{ width: '8px', height: '8px', backgroundColor: '#1a1a2e', borderRadius: '50%', border: '1px solid #333' }}></div>
              </div>
              <img 
                src={`/branding/${activeRole}_preview.png`} 
                alt={`${activeRole} dashboard preview`} 
                style={{ width: '100%', display: 'block', borderRadius: '30px' }} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. PROBLEM / SOLUTION SECTION */}
      <section className="lp-section lp-section-bg">
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 className="lp-h2 animate-on-scroll">Construction Projects Lose Money Every Day</h2>
          <p className="lp-subtitle animate-on-scroll" style={{ maxWidth: '600px', margin: '16px auto 0 auto' }}>
            Legacy software and WhatsApp groups lead to miscommunication, delayed materials, and budget overruns.
          </p>
        </div>

        <div className="animate-on-scroll" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          <div className="lp-card">
            <div className="lp-pulse-soft" style={{ width: '48px', height: '48px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <AlertTriangle size={24} color="#EF4444" />
            </div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px' }}>Material Wastage & Theft</h4>
            <p style={{ color: 'var(--lp-text-muted)', marginBottom: '16px', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Without real-time inventory tracking, materials are over-ordered, wasted, or lost.
            </p>
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', borderLeft: '3px solid #10B981', fontSize: '0.9rem', fontWeight: 500, color: '#065F46' }}>
              Solution: Real-time digital inventory & automated re-order alerts.
            </div>
          </div>

          <div className="lp-card">
            <div className="lp-pulse-soft" style={{ width: '48px', height: '48px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', animationDelay: '1s' }}>
              <Clock size={24} color="#F59E0B" />
            </div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px' }}>Project Delays</h4>
            <p style={{ color: 'var(--lp-text-muted)', marginBottom: '16px', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Waiting for approvals on WhatsApp delays procurement and stalls site work.
            </p>
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', borderLeft: '3px solid #10B981', fontSize: '0.9rem', fontWeight: 500, color: '#065F46' }}>
              Solution: Universal one-click Approval Center for executives.
            </div>
          </div>

          <div className="lp-card">
            <div className="lp-pulse-soft" style={{ width: '48px', height: '48px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', animationDelay: '2s' }}>
              <RefreshCw size={24} color="#3B82F6" />
            </div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px' }}>Blind Cashflow</h4>
            <p style={{ color: 'var(--lp-text-muted)', marginBottom: '16px', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Builders don't know the actual budget burn rate until it's too late.
            </p>
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', borderLeft: '3px solid #10B981', fontSize: '0.9rem', fontWeight: 500, color: '#065F46' }}>
              Solution: Live cashbook integration and budget variance charts.
            </div>
          </div>
        </div>
      </section>

      {/* 6. WHY APNI ESTATE (BENEFITS) */}
      <section className="lp-section">
        <div className="lp-benefits-card animate-on-scroll">
          <div style={{ flex: 1, minWidth: '260px' }}>
            <h2 style={{ color: "white", fontSize: '2.5rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Why Construction Enterprises Choose Us
            </h2>
            <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '32px', lineHeight: 1.6 }}>
              We didn't build just another project management tool. We built the financial and operational backbone for scaling construction companies.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--lp-accent)" /> <span style={{ fontWeight: 600 }}>Save up to 12% on costs</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--lp-accent)" /> <span style={{ fontWeight: 600 }}>Zero fake data</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--lp-accent)" /> <span style={{ fontWeight: 600 }}>Offline-ready execution</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={20} color="var(--lp-accent)" /> <span style={{ fontWeight: 600 }}>AI Cost Estimations</span></div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '260px', display: 'flex', justifyContent: 'center' }}>
            {/* Visual representation of savings/metrics */}
            <div style={{ width: '100%', maxWidth: '360px', background: 'rgba(255,255,255,0.1)', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
              <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--lp-accent)', marginBottom: '8px' }}>12%</div>
              <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Average Cost Reduction</div>
              <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.2)', marginBottom: '24px' }}></div>
              <div style={{ fontSize: '48px', fontWeight: 800, color: '#10B981', marginBottom: '8px' }}>3x</div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>Faster Approval Cycles</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. RECOGNITION & REGISTRATION (AUTHENTIC TRUST) */}
      <section id="recognition" className="lp-section lp-section-bg" style={{ textAlign: 'center' }}>
        <h2 className="lp-h2 animate-on-scroll" style={{ marginBottom: '16px' }}>Recognized & Registered</h2>
        <p className="lp-subtitle animate-on-scroll" style={{ marginBottom: '60px', maxWidth: '600px', margin: '0 auto 60px auto' }}>
          Apni Estate is an officially registered and recognized technology startup, committed to digitizing the Indian construction sector.
        </p>

        <div className="animate-on-scroll" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '32px' }}>
          <div className="lp-card lp-float" style={{ flex: 1, minWidth: '280px', maxWidth: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <img src="/branding/startupindia.png" alt="Startup India Recognition" className="lp-trust-logo" />
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Registered under Startup India</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--lp-text-muted)', lineHeight: 1.5 }}>
                Officially recognized startup under the Government of India Startup India initiative.
              </p>
            </div>
          </div>

          <div className="lp-card lp-float-delayed" style={{ flex: 1, minWidth: '280px', maxWidth: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <img src="/branding/startuptripura.png" alt="Startup Tripura Registration" className="lp-trust-logo" />
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Registered under Startup Tripura</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--lp-text-muted)', lineHeight: 1.5 }}>
                Recognized technology startup actively contributing to the local innovation ecosystem.
              </p>
            </div>
          </div>

          <div className="lp-card lp-float" style={{ flex: 1, minWidth: '280px', maxWidth: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', animationDelay: '1s' }}>
            <img src="/branding/dit.png" alt="Directorate of IT Recognition" className="lp-trust-logo" />
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Recognized by DIT</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--lp-text-muted)', lineHeight: 1.5 }}>
                Government-recognized technology startup by the Directorate of Information Technology.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. AUTHENTICATION CTA */}
      <section className="lp-section" style={{ textAlign: 'center', paddingTop: '120px', paddingBottom: '120px' }}>
        <h2 className="lp-h1 animate-on-scroll" style={{ marginBottom: '24px' }}>Ready to Build Smarter?</h2>
        <p className="lp-subtitle animate-on-scroll" style={{ marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto' }}>
          Join top construction firms using Apni Estate to deliver projects on time and under budget.
        </p>

        <div className="animate-on-scroll" style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '48px', flexWrap: 'wrap' }}>
          <Link to="/signup" className="lp-btn lp-btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
            Start Free Trial
          </Link>
          <a href="#demo" className="lp-btn lp-btn-secondary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
            Watch Product Tour
          </a>
        </div>

        <div className="animate-on-scroll" style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', color: 'var(--lp-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="var(--lp-primary)" /> Account Creation</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="var(--lp-primary)" /> Role Selection</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="var(--lp-primary)" /> Company Setup</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="var(--lp-primary)" /> Team Invitation</div>
        </div>
      </section>

      {/* 9. ENTERPRISE FOOTER */}
      <footer style={{ borderTop: '1px solid var(--lp-border)', background: 'var(--lp-surface)', paddingTop: '60px', paddingBottom: '40px' }}>
        <div className="lp-section" style={{ padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '60px' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Logo size="md" />
            <p style={{ fontSize: '0.9rem', color: 'var(--lp-text-muted)', lineHeight: 1.6 }}>
              The premium operating system built specifically for Indian construction companies to manage projects, finances, and workforce.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Product</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--lp-text-muted)' }}>
              <li><a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Builder Dashboard</a></li>
              <li><a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Site Execution</a></li>
              <li><a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Cost Estimator</a></li>
              <li><a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Company</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--lp-text-muted)' }}>
              <li><a href="#about" style={{ color: 'inherit', textDecoration: 'none' }}>About Us</a></li>
              <li><a href="#careers" style={{ color: 'inherit', textDecoration: 'none' }}>Careers</a></li>
              <li><a href="#recognition" style={{ color: 'inherit', textDecoration: 'none' }}>Recognitions</a></li>
              <li><a href="#contact" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Legal</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--lp-text-muted)' }}>
              <li><a href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</a></li>
              <li><a href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a></li>
              <li><a href="/security" style={{ color: 'inherit', textDecoration: 'none' }}>Security</a></li>
            </ul>
          </div>

        </div>

        <div className="lp-section" style={{ padding: '0 24px', borderTop: '1px solid var(--lp-border)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--lp-text-muted)' }}>
            © {new Date().getFullYear()} Apni Estate. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '0.9rem', color: 'var(--lp-text-muted)' }}>
            <a href="https://linkedin.com" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>LinkedIn</a>
            <a href="mailto:hello@apniestate.in" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}>Email</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
