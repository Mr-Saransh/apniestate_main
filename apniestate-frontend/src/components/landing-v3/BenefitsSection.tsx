import React from 'react';
import { Eye, IndianRupee, TrendingUp, ShieldCheck, Clock, BrainCircuit } from 'lucide-react';

const BENEFITS = [
  {
    icon: Eye,
    title: 'Real-time Project Visibility',
    desc: 'Know exactly what is happening on every site, from any device, at any time.',
  },
  {
    icon: IndianRupee,
    title: 'Better Cost Control',
    desc: 'Track every rupee — from material procurement to labour wages — with categorised expense breakdowns.',
  },
  {
    icon: TrendingUp,
    title: 'Faster Procurement',
    desc: 'Streamline BOQ to PO to delivery. Reduce material procurement time with automated workflows.',
  },
  {
    icon: ShieldCheck,
    title: 'Better Transparency',
    desc: 'Clear audit trails for every decision, payment, and approval. Build trust with stakeholders.',
  },
  {
    icon: Clock,
    title: 'Reduced Manual Work',
    desc: 'Replace scattered Excel sheets with integrated digital workflows for attendance, DPR, and finance.',
  },
  {
    icon: BrainCircuit,
    title: 'Better Decision Making',
    desc: 'Data-driven project intelligence with alerts for low stock, overdue milestones, and budget deviations.',
  },
];

export default function BenefitsSection() {
  return (
    <section className="ae-section" style={{ background: '#FFFFFF' }}>
      <div className="ae-container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div className="ae-label" style={{ color: '#2648E7', marginBottom: 12 }}>Why Apni Estate</div>
          <h2 className="ae-heading-lg" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', color: '#0B132B', marginBottom: 16 }}>
            Built for How Indian Builders <span style={{ color: '#2648E7' }}>Actually Work.</span>
          </h2>
          <p className="ae-body" style={{ maxWidth: 540, margin: '0 auto', fontSize: 16 }}>
            Practical outcomes for real construction challenges. No hype — just tools that make your work simpler.
          </p>
        </div>

        {/* Benefits Grid — 3x2 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}>
          {BENEFITS.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} style={{
                padding: 32,
                borderRadius: 20,
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                transition: 'all 0.3s ease',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#2648E730';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(38,72,231,0.06)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: '#EEF2FD',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                  color: '#2648E7',
                }}>
                  <Icon size={24} />
                </div>
                <h4 style={{
                  fontSize: 18, fontWeight: 700, color: '#0F172A',
                  fontFamily: 'var(--ae-font-display)',
                  marginBottom: 8,
                }}>
                  {b.title}
                </h4>
                <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>
                  {b.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
