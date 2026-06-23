import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight, AlertTriangle, ShieldCheck, Clock, Users, ArrowRight, Zap, RefreshCw, BarChart2, MessageSquare, Briefcase } from 'lucide-react';
import '@/styles/landing.css';

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState<'owner' | 'supervisor' | 'accountant'>('owner');

  return (
    <div className="v3-landing">
      {/* HEADER */}
      <header className="v3-header">
        <div className="v3-container flex justify-between items-center">
          <div className="font-bold text-xl c-primary flex items-center gap-8">
            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--c-accent)' }}></span>
            Apni Estate
          </div>
          <div className="flex gap-24 hidden-mobile">
            <a href="#product" className="font-semibold text-sm">Product</a>
            <a href="#marketplace" className="font-semibold text-sm">Marketplace</a>
            <a href="#pricing" className="font-semibold text-sm">Pricing</a>
          </div>
          <div className="flex gap-16">
            <Link to="/login" className="v3-btn btn-outline hidden-mobile" style={{ padding: '8px 16px', fontSize: '14px' }}>Sign In</Link>
            <Link to="/signup" className="v3-btn btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>Start Free Trial</Link>
          </div>
        </div>
      </header>

      {/* 1. HERO */}
      <section className="v3-hero bg-surface">
        <div className="v3-container grid-2">
          {/* Content (Top on mobile) */}
          <div className="flex flex-col gap-24">
            <h1 className="t-hero">
              The Operating System for <span className="c-primary">Indian Construction</span>
            </h1>
            <p className="t-body c-muted">
              Apni Estate is the all-in-one ERP built specifically for builders, contractors, and site supervisors. Manage projects, workforce, inventory, and finance with real-time AI intelligence.
            </p>
            <div className="flex wrap gap-16 mt-24">
              <Link to="/signup" className="v3-btn btn-primary">Start Free Trial</Link>
              <button className="v3-btn btn-outline">Book a Demo</button>
            </div>
            <div className="flex wrap gap-16 mt-32">
              <span className="font-semibold text-sm c-muted flex items-center gap-4">✓ RERA Ready</span>
              <span className="font-semibold text-sm c-muted flex items-center gap-4">✓ WhatsApp Integrated</span>
              <span className="font-semibold text-sm c-muted flex items-center gap-4">✓ Offline Support</span>
            </div>
          </div>

          {/* Visual (Bottom on mobile): Pure CSS Laptop & Overlapping Phone */}
          <div className="relative" style={{ minHeight: '380px', display: 'flex', alignItems: 'center' }}>
            <div className="mockup-laptop">
              <div className="mockup-laptop-header">
                <span className="mockup-dot red"></span>
                <span className="mockup-dot yellow"></span>
                <span className="mockup-dot green"></span>
                <div className="mockup-address">apniestate.in/dashboard</div>
              </div>
              <div className="mockup-laptop-body">
                <div className="mockup-nav">
                  <span className="mockup-logo">Apni Estate OS</span>
                  <span className="mockup-user">Admin View</span>
                </div>
                <div className="mockup-grid-3">
                  <div className="mockup-card">
                    <div className="mockup-card-title">Site Progress</div>
                    <div className="mockup-card-value">84.2%</div>
                  </div>
                  <div className="mockup-card">
                    <div className="mockup-card-title">Labour Strength</div>
                    <div className="mockup-card-value">148 / 150</div>
                  </div>
                  <div className="mockup-card">
                    <div className="mockup-card-title">Finance Variance</div>
                    <div className="mockup-card-value" style={{ color: '#16a34a' }}>+₹1.2L</div>
                  </div>
                </div>
                <div className="mockup-chart-container" style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Project Timeline Gantt</span>
                    <span style={{ color: '#22c55e' }}>On Schedule</span>
                  </div>
                  <div className="gantt-chart">
                    <div className="gantt-row">
                      <span className="gantt-label">Excavation</span>
                      <div className="gantt-timeline"><div className="gantt-bar green" style={{ width: '80%', left: '0%' }}></div></div>
                    </div>
                    <div className="gantt-row">
                      <span className="gantt-label">Foundation</span>
                      <div className="gantt-timeline"><div className="gantt-bar blue" style={{ width: '60%', left: '30%' }}></div></div>
                    </div>
                    <div className="gantt-row">
                      <span className="gantt-label">Pillars (1st Fl)</span>
                      <div className="gantt-timeline"><div className="gantt-bar gold" style={{ width: '30%', left: '70%' }}></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlapping Phone Mockup */}
            <div className="mockup-phone absolute hidden-mobile" style={{ width: '180px', bottom: '-24px', right: '0px', zIndex: 10, transform: 'scale(0.9)' }}>
              <div className="mockup-phone-notch"></div>
              <div className="mockup-phone-screen" style={{ minHeight: '320px', padding: '16px 8px 8px' }}>
                <div className="phone-header" style={{ fontSize: '9px' }}>
                  <span>Supervisor</span>
                  <span>5G</span>
                </div>
                <div className="phone-card" style={{ padding: '8px', fontSize: '10px' }}>
                  <span style={{ fontWeight: 'bold' }}>Quick Attendance</span>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    <span className="phone-avatar" style={{ width: '18px', height: '18px', fontSize: '8px' }}>RK</span>
                    <span className="phone-avatar" style={{ width: '18px', height: '18px', fontSize: '8px' }}>MS</span>
                    <span className="phone-avatar" style={{ width: '18px', height: '18px', fontSize: '8px' }}>VS</span>
                  </div>
                </div>
                <div className="phone-list" style={{ gap: '4px' }}>
                  <div className="phone-item" style={{ padding: '4px 8px', fontSize: '10px' }}>
                    <span>Ramesh Kumar</span>
                    <span className="phone-status present">P</span>
                  </div>
                  <div className="phone-item" style={{ padding: '4px 8px', fontSize: '10px' }}>
                    <span>Manoj Singh</span>
                    <span className="phone-status present">P</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUSTED BY BUILDERS */}
      <section className="v3-section">
        <div className="v3-container text-center">
          <p className="font-bold text-sm c-muted mb-48" style={{ letterSpacing: '0.05em' }}>
            TRUSTED BY THE FASTEST GROWING DEVELOPERS IN INDIA
          </p>
          <div className="grid-4 items-center justify-center gap-48" style={{ opacity: 0.7 }}>
            <h3 className="t-section c-muted" style={{ fontStyle: 'italic', letterSpacing: '2px' }}>SKYLINE</h3>
            <h3 className="t-section c-muted" style={{ letterSpacing: '4px' }}>PEARL</h3>
            <h3 className="t-section c-muted" style={{ fontWeight: '800' }}>APEX</h3>
            <h3 className="t-section c-muted" style={{ textDecoration: 'underline' }}>VANGUARD</h3>
          </div>
        </div>
      </section>

      {/* 3. PROBLEMS WE SOLVE */}
      <section className="v3-section bg-surface">
        <div className="v3-container">
          <div className="text-center max-w-3xl mb-64" style={{ margin: '0 auto 64px' }}>
            <h2 className="t-section mb-16">Construction Projects Lose Money Every Day</h2>
            <p className="t-body">Legacy tools and disconnected WhatsApp groups lead to massive unrecoverable losses.</p>
          </div>
          <div className="grid-3">
            <div className="v3-card">
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <Users color="var(--c-danger)" size={24} />
              </div>
              <h4 className="font-bold text-xl mb-12">Labor Fraud</h4>
              <p className="text-sm">Ghost workers and proxy punches inflating your labor costs by up to 15% without checkmarks.</p>
            </div>
            <div className="v3-card">
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <AlertTriangle color="var(--c-danger)" size={24} />
              </div>
              <h4 className="font-bold text-xl mb-12">Material Theft</h4>
              <p className="text-sm">Lack of real-time inventory tracking leads to untraceable site leakages of cement and sand.</p>
            </div>
            <div className="v3-card">
              <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <BarChart2 color="var(--c-danger)" size={24} />
              </div>
              <h4 className="font-bold text-xl mb-12">Budget Overruns</h4>
              <p className="text-sm">Siloed accounting causes massive overruns before managers even realize bills have piled up.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHY APNI ESTATE */}
      <section className="v3-section">
        <div className="v3-container text-center">
          <h2 className="t-section mb-16">Why Apni Estate Wins</h2>
          <p className="t-body max-w-3xl mb-64" style={{ margin: '0 auto 64px' }}>We didn't build just another SaaS tool. We built the exact operating system required to execute projects flawlessly in the Indian market.</p>
          
          <div className="v3-card" style={{ maxWidth: '800px', margin: '0 auto', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '16px', fontWeight: 'bold' }}>Feature Capability</th>
                  <th style={{ padding: '16px', fontWeight: 'bold', color: 'var(--c-primary)' }}>Apni Estate</th>
                  <th style={{ padding: '16px', fontWeight: 'normal', color: 'var(--c-text-muted)' }}>Traditional ERP</th>
                  <th style={{ padding: '16px', fontWeight: 'normal', color: 'var(--c-text-muted)' }}>WhatsApp/Excel</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '16px', fontWeight: '500' }}>Offline field capture</td>
                  <td style={{ padding: '16px', color: 'var(--c-success)', fontWeight: 'bold' }}>✓ Yes</td>
                  <td style={{ padding: '16px', color: 'var(--c-danger)' }}>✗ No</td>
                  <td style={{ padding: '16px', color: 'var(--c-success)' }}>✓ Yes</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '16px', fontWeight: '500' }}>Automated Tally Sync</td>
                  <td style={{ padding: '16px', color: 'var(--c-success)', fontWeight: 'bold' }}>✓ Yes</td>
                  <td style={{ padding: '16px', color: 'var(--c-success)' }}>✓ Yes</td>
                  <td style={{ padding: '16px', color: 'var(--c-danger)' }}>✗ No</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '16px', fontWeight: '500' }}>AI Billing Anomaly Scan</td>
                  <td style={{ padding: '16px', color: 'var(--c-success)', fontWeight: 'bold' }}>✓ Yes</td>
                  <td style={{ padding: '16px', color: 'var(--c-danger)' }}>✗ No</td>
                  <td style={{ padding: '16px', color: 'var(--c-danger)' }}>✗ No</td>
                </tr>
                <tr>
                  <td style={{ padding: '16px', fontWeight: '500' }}>WhatsApp Daily Reports</td>
                  <td style={{ padding: '16px', color: 'var(--c-success)', fontWeight: 'bold' }}>✓ Yes</td>
                  <td style={{ padding: '16px', color: 'var(--c-danger)' }}>✗ No</td>
                  <td style={{ padding: '16px', color: 'var(--c-danger)' }}>✗ No</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. PROJECT MANAGEMENT */}
      <section className="v3-section bg-surface" id="product">
        <div className="v3-container grid-2">
          {/* Mobile: Visual First */}
          <div className="grid-visual">
            <div className="mockup-laptop">
              <div className="mockup-laptop-header">
                <span className="mockup-dot red"></span>
                <span className="mockup-dot yellow"></span>
                <span className="mockup-dot green"></span>
                <div className="mockup-address">apniestate.in/projects</div>
              </div>
              <div className="mockup-laptop-body" style={{ minHeight: '220px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--c-accent)' }}>Live Gantt Tracking</span>
                <div className="gantt-chart" style={{ marginTop: '16px' }}>
                  <div className="gantt-row">
                    <span className="gantt-label">Excavation</span>
                    <div className="gantt-timeline"><div className="gantt-bar green" style={{ width: '100%', left: '0%' }}></div></div>
                  </div>
                  <div className="gantt-row">
                    <span className="gantt-label">RCC slab</span>
                    <div className="gantt-timeline"><div className="gantt-bar blue" style={{ width: '40%', left: '40%' }}></div></div>
                  </div>
                  <div className="gantt-row">
                    <span className="gantt-label">Masonry</span>
                    <div className="gantt-timeline"><div className="gantt-bar gold" style={{ width: '10%', left: '80%' }}></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid-content">
            <h2 className="t-section mb-16">Absolute Control Over Project Timelines</h2>
            <p className="t-body mb-32">Maintain complete authority over your project dependencies, milestones, and daily progress without relying on manual updates.</p>
            
            <div className="v3-bullet">
              <CheckCircle2 className="v3-bullet-icon" size={24} />
              <div>
                <div className="v3-bullet-text">Live Gantt Tracking</div>
                <div className="v3-bullet-desc">Real-time scheduling and critical path analysis.</div>
              </div>
            </div>
            <div className="v3-bullet">
              <CheckCircle2 className="v3-bullet-icon" size={24} />
              <div>
                <div className="v3-bullet-text">Geo-tagged Site Photos</div>
                <div className="v3-bullet-desc">Visual progress updates tied directly to tasks.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ATTENDANCE MANAGEMENT */}
      <section className="v3-section">
        <div className="v3-container grid-2 reverse">
          <div className="grid-visual">
            <div className="mockup-laptop">
              <div className="mockup-laptop-header">
                <span className="mockup-dot red"></span>
                <span className="mockup-dot yellow"></span>
                <span className="mockup-dot green"></span>
                <div className="mockup-address">apniestate.in/attendance</div>
              </div>
              <div className="mockup-laptop-body" style={{ minHeight: '220px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--c-accent)' }}>Wage Ledger & Presence Verification</span>
                <table className="attendance-table" style={{ marginTop: '12px' }}>
                  <thead>
                    <tr>
                      <th>Worker Name</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Wages Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Amit Kumar</td>
                      <td>Skilled Mason</td>
                      <td><span className="phone-status present">P</span></td>
                      <td>₹750.00</td>
                    </tr>
                    <tr>
                      <td>Ramesh Dev</td>
                      <td>Helper</td>
                      <td><span className="phone-status present">P</span></td>
                      <td>₹450.00</td>
                    </tr>
                    <tr>
                      <td>Sanjay Shah</td>
                      <td>Bar Bender</td>
                      <td><span className="phone-status absent">A</span></td>
                      <td>₹0.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="grid-content">
            <h2 className="t-section mb-16">Eradicate Labor Fraud Instantly</h2>
            <p className="t-body mb-32">Log labor presence, manage shifts, and calculate daily wages directly from the field with geo-fenced security.</p>
            
            <div className="v3-bullet">
              <CheckCircle2 className="v3-bullet-icon" size={24} />
              <div>
                <div className="v3-bullet-text">1-Tap Bulk Attendance</div>
                <div className="v3-bullet-desc">Mark hundreds of workers present in seconds.</div>
              </div>
            </div>
            <div className="v3-bullet">
              <CheckCircle2 className="v3-bullet-icon" size={24} />
              <div>
                <div className="v3-bullet-text">Automated Wages & PRWs</div>
                <div className="v3-bullet-desc">Overtime and advances synced directly to finance logs.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. INVENTORY MANAGEMENT */}
      <section className="v3-section bg-surface">
        <div className="v3-container grid-2">
          <div className="grid-visual">
            <div className="mockup-laptop">
              <div className="mockup-laptop-header">
                <span className="mockup-dot red"></span>
                <span className="mockup-dot yellow"></span>
                <span className="mockup-dot green"></span>
                <div className="mockup-address">apniestate.in/inventory</div>
              </div>
              <div className="mockup-laptop-body" style={{ minHeight: '220px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--c-accent)' }}>Material Ledger Ledger</span>
                <table className="ledger-table" style={{ marginTop: '12px' }}>
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Stock Level</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>OPC Cement 43 Grade</td>
                      <td>42 Bags</td>
                      <td><span className="alert-pill low">Low Alert</span></td>
                    </tr>
                    <tr>
                      <td>Fe 550 Steel Rods</td>
                      <td>4.2 Tons</td>
                      <td><span className="alert-pill ok">OK</span></td>
                    </tr>
                    <tr>
                      <td>Crushed Aggregate</td>
                      <td>12 Tons</td>
                      <td><span className="alert-pill ok">OK</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="grid-content">
            <h2 className="t-section mb-16">Never Lose a Cement Bag Again</h2>
            <p className="t-body mb-32">Complete traceability from material indent to consumption. Prevent work stoppages with predictive low-stock alerts.</p>
            
            <div className="v3-bullet">
              <CheckCircle2 className="v3-bullet-icon" size={24} />
              <div>
                <div className="v3-bullet-text">Automated GRNs</div>
                <div className="v3-bullet-desc">Easy Goods Receipt Notes with photo capture.</div>
              </div>
            </div>
            <div className="v3-bullet">
              <CheckCircle2 className="v3-bullet-icon" size={24} />
              <div>
                <div className="v3-bullet-text">Multi-Site Transfer</div>
                <div className="v3-bullet-desc">Track inter-site asset movement flawlessly.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FINANCE MANAGEMENT */}
      <section className="v3-section">
        <div className="v3-container grid-2 reverse">
          <div className="grid-visual">
            <div className="mockup-laptop">
              <div className="mockup-laptop-header">
                <span className="mockup-dot red"></span>
                <span className="mockup-dot yellow"></span>
                <span className="mockup-dot green"></span>
                <div className="mockup-address">apniestate.in/finance</div>
              </div>
              <div className="mockup-laptop-body" style={{ minHeight: '220px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--c-accent)' }}>Actual Cashflow vs Budgeted</span>
                <div className="finance-bar-chart">
                  <div className="finance-bar-group">
                    <div className="finance-bar budget" style={{ height: '40px' }} title="Budget"></div>
                    <div className="finance-bar actual" style={{ height: '35px' }} title="Actual"></div>
                  </div>
                  <div className="finance-bar-group">
                    <div className="finance-bar budget" style={{ height: '70px' }}></div>
                    <div className="finance-bar actual" style={{ height: '85px' }}></div>
                  </div>
                  <div className="finance-bar-group">
                    <div className="finance-bar budget" style={{ height: '90px' }}></div>
                    <div className="finance-bar actual" style={{ height: '60px' }}></div>
                  </div>
                  <div className="finance-bar-group">
                    <div className="finance-bar budget" style={{ height: '110px' }}></div>
                    <div className="finance-bar actual" style={{ height: '105px' }}></div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '10px', marginTop: '8px' }}>
                  <span style={{ color: '#3b82f6' }}>● Budgeted</span>
                  <span style={{ color: 'var(--c-accent)' }}>● Actual</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid-content">
            <h2 className="t-section mb-16">Keep Your Cash Flow Positive</h2>
            <p className="t-body mb-32">Native construction accounting built for developers. Track budget versus actuals minute-by-minute.</p>
            
            <div className="v3-bullet">
              <CheckCircle2 className="v3-bullet-icon" size={24} />
              <div>
                <div className="v3-bullet-text">Real-time BOQ</div>
                <div className="v3-bullet-desc">Instantly identify budget overruns before payments are made.</div>
              </div>
            </div>
            <div className="v3-bullet">
              <CheckCircle2 className="v3-bullet-icon" size={24} />
              <div>
                <div className="v3-bullet-text">Tally Integration</div>
                <div className="v3-bullet-desc">2-way sync keeps your accountants happy and compliant.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. REPORTS & ANALYTICS */}
      <section className="v3-section bg-surface">
        <div className="v3-container grid-2">
          <div className="grid-visual">
            <div className="mockup-laptop">
              <div className="mockup-laptop-header">
                <span className="mockup-dot red"></span>
                <span className="mockup-dot yellow"></span>
                <span className="mockup-dot green"></span>
                <div className="mockup-address">apniestate.in/reports</div>
              </div>
              <div className="mockup-laptop-body" style={{ minHeight: '220px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--c-accent)' }}>Daily Progress Report Summary</span>
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
                    <span>Labor Strength Today</span>
                    <span>14 Masons, 32 Helpers</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
                    <span>Material Consumption</span>
                    <span>45 Bags Cement, 4 Tons Sand</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Curing Status</span>
                    <span style={{ color: '#22c55e' }}>Done (2nd Cycle)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid-content">
            <h2 className="t-section mb-16">Stop Compiling Excel Sheets</h2>
            <p className="t-body mb-32">Get beautiful, actionable insights generated automatically and delivered to your WhatsApp daily.</p>
            
            <div className="v3-bullet">
              <CheckCircle2 className="v3-bullet-icon" size={24} />
              <div>
                <div className="v3-bullet-text">DPR Automation</div>
                <div className="v3-bullet-desc">Daily Progress Reports generated with zero manual effort.</div>
              </div>
            </div>
            <div className="v3-bullet">
              <CheckCircle2 className="v3-bullet-icon" size={24} />
              <div>
                <div className="v3-bullet-text">Profitability Forecasts</div>
                <div className="v3-bullet-desc">Know your margins months before project handover.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. AI INTELLIGENCE */}
      <section className="v3-section" style={{ backgroundColor: '#0A1128', color: 'white' }}>
        <div className="v3-container grid-2 reverse">
          <div className="grid-visual">
            <div className="mockup-laptop" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="mockup-laptop-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span className="mockup-dot red"></span>
                <span className="mockup-dot yellow"></span>
                <span className="mockup-dot green"></span>
                <div className="mockup-address" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}>apniestate.in/ai-audits</div>
              </div>
              <div className="mockup-laptop-body" style={{ minHeight: '220px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--c-accent)' }}>Apni AI Anomaly Detector</span>
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '6px', padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle color="#ef4444" size={16} />
                    <span>Vendor invoice cement price ₹380/bag is 15% above target rate.</span>
                  </div>
                  <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid #eab308', borderRadius: '6px', padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle color="#eab308" size={16} />
                    <span>Timeline Slippage Warning: Steel delivery delayed.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid-content">
            <p className="font-bold text-sm c-accent mb-16 uppercase tracking-widest">Apni AI Engine</p>
            <h2 className="t-section mb-16 c-white">Construction Intelligence Built In</h2>
            <p className="t-body mb-32" style={{ color: '#9CA3AF' }}>Move from reactive firefighting to proactive management using our proprietary machine learning models trained on millions of construction data points.</p>
            
            <div className="v3-bullet">
              <CheckCircle2 className="v3-bullet-icon" size={24} />
              <div>
                <div className="v3-bullet-text c-white">AI Delay Prediction</div>
                <div className="v3-bullet-desc" style={{ color: '#9CA3AF' }}>Analyzes weather and labor turnout to predict timeline slips.</div>
              </div>
            </div>
            <div className="v3-bullet">
              <CheckCircle2 className="v3-bullet-icon" size={24} />
              <div>
                <div className="v3-bullet-text c-white">Risk Detection</div>
                <div className="v3-bullet-desc" style={{ color: '#9CA3AF' }}>Scans vendor invoices against market rates to flag overcharging.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. MARKETPLACE */}
      <section className="v3-section" id="marketplace">
        <div className="v3-container text-center">
          <h2 className="t-section mb-16">The Apni Estate Marketplace</h2>
          <p className="t-body max-w-3xl mb-64" style={{ margin: '0 auto 64px' }}>We don't just give you software. We connect you directly to the resources you need to build faster and cheaper.</p>
          
          <div className="mockup-laptop" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="mockup-laptop-header">
              <span className="mockup-dot red"></span>
              <span className="mockup-dot yellow"></span>
              <span className="mockup-dot green"></span>
              <div className="mockup-address">apniestate.in/marketplace</div>
            </div>
            <div className="mockup-laptop-body" style={{ minHeight: '240px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Vendor Material Exchange Quotes</span>
                <span style={{ background: 'var(--c-primary)', color: 'white', padding: '4px 10px', borderRadius: '4px', fontSize: '11px' }}>Active Bids</span>
              </div>
              <div className="grid-3" style={{ marginTop: '16px' }}>
                <div style={{ border: '1px solid #334155', background: '#1e293b', borderRadius: '8px', padding: '12px', textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>Shree Cement (OPC 43)</div>
                  <div style={{ color: 'var(--c-accent)', fontWeight: 'bold', fontSize: '18px', margin: '8px 0' }}>₹335/bag</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>Delivery: 24 Hours<br/>Min Order: 200 bags</div>
                </div>
                <div style={{ border: '1px solid #334155', background: '#1e293b', borderRadius: '8px', padding: '12px', textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>UltraTech Cement</div>
                  <div style={{ color: 'var(--c-accent)', fontWeight: 'bold', fontSize: '18px', margin: '8px 0' }}>₹342/bag</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>Delivery: 12 Hours<br/>Min Order: 100 bags</div>
                </div>
                <div style={{ border: '1px solid #334155', background: '#1e293b', borderRadius: '8px', padding: '12px', textAlign: 'left' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '12px' }}>Ambuja Kawach</div>
                  <div style={{ color: 'var(--c-accent)', fontWeight: 'bold', fontSize: '18px', margin: '8px 0' }}>₹350/bag</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>Delivery: 24 Hours<br/>Min Order: 150 bags</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. MOBILE EXPERIENCE */}
      <section className="v3-section bg-surface">
        <div className="v3-container text-center">
          <h2 className="t-section mb-16">Built for the Field</h2>
          <p className="t-body max-w-3xl mb-64" style={{ margin: '0 auto 64px' }}>Supervisors don't carry laptops. Our mobile app works completely offline, syncing data instantly when connection returns.</p>
          
          <div className="phones-grid">
            {/* Phone 1 */}
            <div className="mockup-phone">
              <div className="mockup-phone-notch"></div>
              <div className="mockup-phone-screen">
                <div className="phone-header">
                  <span>Labour Punch-In</span>
                  <span>5G</span>
                </div>
                <div className="phone-card" style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Site Location Verified</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>South Wing Block C</span>
                </div>
                <div className="phone-list">
                  <div className="phone-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="phone-avatar">AK</div>
                      <span>Amit Kumar</span>
                    </div>
                    <span className="phone-status present">Present</span>
                  </div>
                  <div className="phone-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="phone-avatar">RD</div>
                      <span>Ramesh Dev</span>
                    </div>
                    <span className="phone-status present">Present</span>
                  </div>
                  <div className="phone-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="phone-avatar">SK</div>
                      <span>Sanjay Shah</span>
                    </div>
                    <span className="phone-status absent">Absent</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone 2 */}
            <div className="mockup-phone">
              <div className="mockup-phone-notch"></div>
              <div className="mockup-phone-screen">
                <div className="phone-header">
                  <span>Tasks Sheet</span>
                  <span>5G</span>
                </div>
                <div className="phone-card" style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Tasks for Today</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Casting Column 4-8</span>
                </div>
                <div className="phone-list">
                  <div className="phone-item">
                    <span>Steel tying check</span>
                    <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✓</span>
                  </div>
                  <div className="phone-item">
                    <span>Formwork layout approval</span>
                    <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✓</span>
                  </div>
                  <div className="phone-item">
                    <span>Concrete mix audit</span>
                    <span style={{ color: '#eab308', fontWeight: 'bold' }}>Pending</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone 3 */}
            <div className="mockup-phone">
              <div className="mockup-phone-notch"></div>
              <div className="mockup-phone-screen">
                <div className="phone-header">
                  <span>Material Request</span>
                  <span>5G</span>
                </div>
                <div className="phone-card" style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Active Indent</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>#IND-4091-A</span>
                </div>
                <div className="phone-list">
                  <div className="phone-item">
                    <span>500 Bags OPC Cement</span>
                    <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>Ordered</span>
                  </div>
                  <div className="phone-item">
                    <span>3 Tons Fe 550 Rebars</span>
                    <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>Ordered</span>
                  </div>
                  <div className="phone-item">
                    <span>Curing Water Tanker</span>
                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>Delivered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 13. TEAM ROLES */}
      <section className="v3-section">
        <div className="v3-container grid-2">
          {/* Visual on mobile: content below it */}
          <div className="grid-visual">
            <div className="mockup-laptop">
              <div className="mockup-laptop-header">
                <span className="mockup-dot red"></span>
                <span className="mockup-dot yellow"></span>
                <span className="mockup-dot green"></span>
                <div className="mockup-address">apniestate.in/roles</div>
              </div>
              <div className="mockup-laptop-body" style={{ minHeight: '260px' }}>
                {activeRole === 'owner' && (
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--c-accent)' }}>Builder Portfolio Overview</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total Portfolio Value</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>₹42.5 Cr</div>
                      </div>
                      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Avg Project ROI</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>+18.4%</div>
                      </div>
                    </div>
                  </div>
                )}
                {activeRole === 'supervisor' && (
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--c-accent)' }}>Site Supervisor Overview</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Active Labour Counts</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>84 present</div>
                      </div>
                      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Tasks to Clear Today</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#eab308' }}>6 Pending</div>
                      </div>
                    </div>
                  </div>
                )}
                {activeRole === 'accountant' && (
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--c-accent)' }}>Accountant Billing Dashboard</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Unbilled indents</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>₹4.2 Lakhs</div>
                      </div>
                      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Sync Status to Tally</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>Synced</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="grid-content">
            <h2 className="t-section mb-16">One Platform. Every Role.</h2>
            <p className="t-body mb-32">Role-based dashboards ensure everyone sees exactly what they need to do their job, without the clutter.</p>
            <div className="flex flex-col gap-16">
              <button 
                onClick={() => setActiveRole('owner')}
                className="v3-card p-24 text-left" 
                style={{ cursor: 'pointer', border: activeRole === 'owner' ? '2px solid var(--c-primary)' : '1px solid rgba(0,0,0,0.05)' }}
              >
                <h4 className="font-bold text-lg mb-8" style={{ color: activeRole === 'owner' ? 'var(--c-primary)' : 'var(--c-text-primary)' }}>Builder / Owner</h4>
                <p className="text-sm">Portfolio ROI, high-level approvals, and risk management.</p>
              </button>
              <button 
                onClick={() => setActiveRole('supervisor')}
                className="v3-card p-24 text-left"
                style={{ cursor: 'pointer', border: activeRole === 'supervisor' ? '2px solid var(--c-primary)' : '1px solid rgba(0,0,0,0.05)' }}
              >
                <h4 className="font-bold text-lg mb-8" style={{ color: activeRole === 'supervisor' ? 'var(--c-primary)' : 'var(--c-text-primary)' }}>Site Supervisor</h4>
                <p className="text-sm">Daily labor logging, progress photos, and material indents.</p>
              </button>
              <button 
                onClick={() => setActiveRole('accountant')}
                className="v3-card p-24 text-left"
                style={{ cursor: 'pointer', border: activeRole === 'accountant' ? '2px solid var(--c-primary)' : '1px solid rgba(0,0,0,0.05)' }}
              >
                <h4 className="font-bold text-lg mb-8" style={{ color: activeRole === 'accountant' ? 'var(--c-primary)' : 'var(--c-text-primary)' }}>Accountant</h4>
                <p className="text-sm">Invoice processing, vendor payments, and Tally synchronization.</p>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 14. TESTIMONIALS */}
      <section className="v3-section bg-surface">
        <div className="v3-container text-center">
          <h2 className="t-section mb-64" style={{ margin: '0 auto 64px' }}>Trusted by Industry Leaders</h2>
          <div className="grid-3 text-left">
            <div className="v3-card">
              <div className="flex gap-8 mb-16 c-accent">★★★★★</div>
              <p className="mb-24">"Apni Estate replaced 4 different tools and a dozen WhatsApp groups. We've recovered 8% of our budget simply through better material tracking."</p>
              <div className="font-bold">Rahul Verma</div>
              <div className="text-sm c-muted">Director, Skyline Builders</div>
            </div>
            <div className="v3-card">
              <div className="flex gap-8 mb-16 c-accent">★★★★★</div>
              <p className="mb-24">"The offline mobile app is a game-changer for our remote sites. Supervisors actually use it because it's so fast."</p>
              <div className="font-bold">Vikram Singh</div>
              <div className="text-sm c-muted">Project Manager, Pearl Dev</div>
            </div>
            <div className="v3-card">
              <div className="flex gap-8 mb-16 c-accent">★★★★★</div>
              <p className="mb-24">"Tally integration and automated PRW billing saves our accounting team 20 hours a week. Incredible ROI."</p>
              <div className="font-bold">Neha Gupta</div>
              <div className="text-sm c-muted">CFO, Apex Construction</div>
            </div>
          </div>
        </div>
      </section>

      {/* 15. PRICING */}
      <section className="v3-section" id="pricing">
        <div className="v3-container">
          <div className="text-center max-w-3xl mb-64" style={{ margin: '0 auto 64px' }}>
            <h2 className="t-section mb-16">Transparent Enterprise Pricing</h2>
            <p className="t-body">Scale without limits. Pay for the modules you actually need.</p>
          </div>
          
          <div className="grid-3">
            <div className="v3-card pricing-card flex flex-col">
              <h3 className="text-2xl font-bold mb-8">Growth</h3>
              <p className="c-muted mb-24">For emerging contractors</p>
              <div className="font-bold text-4xl mb-32">₹4,999<span className="text-sm c-muted font-semibold">/mo</span></div>
              <div className="flex flex-col gap-16 mb-48 flex-1">
                <div className="v3-bullet-text">✓ 3 Active Projects</div>
                <div className="v3-bullet-text">✓ 500 Workers limit</div>
                <div className="v3-bullet-text">✓ Basic ERP Modules</div>
              </div>
              <button className="v3-btn w-full btn-outline">Start Free Trial</button>
            </div>
            
            <div className="v3-card pricing-card featured flex flex-col">
              <div className="featured-tag">Most Popular</div>
              <h3 className="text-2xl font-bold mb-8">Professional</h3>
              <p className="c-muted mb-24">For established developers</p>
              <div className="font-bold text-4xl mb-32">₹14,999<span className="text-sm c-muted font-semibold">/mo</span></div>
              <div className="flex flex-col gap-16 mb-48 flex-1">
                <div className="v3-bullet-text">✓ 10 Active Projects</div>
                <div className="v3-bullet-text">✓ Unlimited Workers</div>
                <div className="v3-bullet-text">✓ Full ERP + Finance</div>
                <div className="v3-bullet-text">✓ AI Delay Prediction</div>
              </div>
              <button className="v3-btn w-full btn-primary">Start Free Trial</button>
            </div>
            
            <div className="v3-card pricing-card flex flex-col">
              <h3 className="text-2xl font-bold mb-8">Enterprise</h3>
              <p className="c-muted mb-24">For massive portfolios</p>
              <div className="font-bold text-4xl mb-32">Custom</div>
              <div className="flex flex-col gap-16 mb-48 flex-1">
                <div className="v3-bullet-text">✓ Unlimited Projects</div>
                <div className="v3-bullet-text">✓ Custom API Integrations</div>
                <div className="v3-bullet-text">✓ On-premise options</div>
              </div>
              <button className="v3-btn w-full btn-outline">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* 16. FAQ */}
      <section className="v3-section bg-surface">
        <div className="v3-container max-w-3xl">
          <h2 className="t-section mb-48 text-center" style={{ margin: '0 auto 48px' }}>Frequently Asked Questions</h2>
          <div className="flex flex-col gap-16">
            <div className="v3-card p-24">
              <h4 className="font-bold text-lg mb-8">Does the mobile app work offline?</h4>
              <p className="text-sm">Yes. The app heavily caches data locally. Supervisors can mark attendance and take photos underground or in remote areas. Data syncs automatically when a connection is restored.</p>
            </div>
            <div className="v3-card p-24">
              <h4 className="font-bold text-lg mb-8">How long does implementation take?</h4>
              <p className="text-sm">For the Growth plan, you can be up and running in 24 hours. Enterprise rollouts typically take 2-4 weeks including data migration from your legacy systems.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 17. FINAL CTA */}
      <section className="v3-section" style={{ backgroundColor: '#0A3D91', color: 'white', padding: '120px 0' }}>
        <div className="v3-container text-center max-w-4xl" style={{ margin: '0 auto' }}>
          <h2 className="t-hero c-white mb-24">Stop Managing Construction Through WhatsApp and Excel.</h2>
          <p className="t-body mb-48" style={{ color: '#E5E7EB' }}>
            Join the top developers using Apni Estate to deliver projects on time, eradicate theft, and maximize profitability.
          </p>
          <div className="flex wrap justify-center gap-16">
            <button className="v3-btn btn-accent flex items-center gap-8">Start Free Trial <ChevronRight size={20}/></button>
            <button className="v3-btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>Book a Demo</button>
          </div>
        </div>
      </section>
      
      {/* FOOTER */}
      <footer className="v3-section" style={{ backgroundColor: '#0A1128', paddingBottom: '32px' }}>
        <div className="v3-container">
          <div className="flex flex-col items-center gap-32" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '48px', marginBottom: '32px' }}>
            <div className="font-bold text-2xl" style={{ color: '#F4B400' }}>Apni Estate</div>
            <div className="flex wrap justify-center gap-32">
              <a href="#" className="font-semibold text-sm" style={{ color: 'white' }}>Product</a>
              <a href="#" className="font-semibold text-sm" style={{ color: 'white' }}>Company</a>
              <a href="#" className="font-semibold text-sm" style={{ color: 'white' }}>Privacy</a>
              <a href="#" className="font-semibold text-sm" style={{ color: 'white' }}>Terms</a>
            </div>
          </div>
          <p className="text-center text-sm" style={{ color: '#6B7280' }}>&copy; 2026 Apni Estate Technologies. Built for Builders.</p>
        </div>
      </footer>
    </div>
  );
}
