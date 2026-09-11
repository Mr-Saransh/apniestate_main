import React, { useState } from 'react';
import { ClipboardList, Compass, Truck, HardHat, KeyRound, ChevronRight } from 'lucide-react';

const STEPS = [
  {
    id: 'plan',
    icon: ClipboardList,
    label: 'Planning',
    title: 'Feasibility & Project Setup',
    desc: 'Define project scope, set budgets, create BOQ, assign teams, and establish milestones — all before the first brick is laid.',
    capabilities: ['Project Setup', 'Budget Allocation', 'BOQ Creation', 'Team Assignment'],
    color: '#2648E7',
  },
  {
    id: 'design',
    icon: Compass,
    label: 'Design',
    title: 'Drawings & Approvals',
    desc: 'Manage architectural drawings, track document revisions, handle approval workflows, and maintain a single source of truth.',
    capabilities: ['Document Management', 'Version Control', 'Approval Workflows', 'Drawing Storage'],
    color: '#7C3AED',
  },
  {
    id: 'procure',
    icon: Truck,
    label: 'Procurement',
    title: 'Material & Vendor Management',
    desc: 'Raise material requirements, compare vendor quotations, issue purchase orders, track deliveries, and manage inventory.',
    capabilities: ['Material Requests', 'Vendor Quotations', 'Purchase Orders', 'Inventory Tracking'],
    color: '#F59E0B',
  },
  {
    id: 'build',
    icon: HardHat,
    label: 'Construction',
    title: 'Site Execution & Monitoring',
    desc: 'Track daily progress with DPR, manage labour attendance, monitor equipment, log expenses, and stay on schedule.',
    capabilities: ['Daily Progress (DPR)', 'Labour Attendance', 'Expense Tracking', 'Equipment Logs'],
    color: '#EF4444',
  },
  {
    id: 'handover',
    icon: KeyRound,
    label: 'Handover',
    title: 'Completion & Delivery',
    desc: 'Generate final reports, manage CRM leads and bookings, handle customer handover, and close the project with full financial clarity.',
    capabilities: ['Milestone Reports', 'CRM & Bookings', 'Financial Summary', 'Client Handover'],
    color: '#10B981',
  },
];

export default function LifecycleSection() {
  const [active, setActive] = useState(0);
  const step = STEPS[active];
  const Icon = step.icon;

  return (
    <section id="features" className="ae-section" style={{ background: '#FFFFFF' }}>
      <div className="ae-container">
        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <div className="ae-label" style={{ color: '#2648E7', marginBottom: 12 }}>The Complete Journey</div>
          <h2 className="ae-heading-lg" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)', color: '#0B132B', marginBottom: 16 }}>
            The Construction Lifecycle.{' '}
            <span style={{ color: '#2648E7' }}>Digitised.</span>
          </h2>
          <p className="ae-body" style={{ maxWidth: 560, fontSize: 16 }}>
            Apni Estate connects every phase of your project — from initial planning to final handover — in one unified platform.
          </p>
        </div>

        {/* Step Selector — Horizontal Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 48,
          overflowX: 'auto', paddingBottom: 4,
          WebkitOverflowScrolling: 'touch',
        }}>
          {STEPS.map((s, i) => {
            const SI = s.icon;
            const isActive = i === active;
            return (
              <button
                key={s.id}
                onClick={() => setActive(i)}
                style={{
                  flex: '1 0 auto',
                  minWidth: 140,
                  padding: '16px 20px',
                  borderRadius: 16,
                  border: isActive ? `2px solid ${s.color}` : '2px solid transparent',
                  background: isActive ? `${s.color}08` : 'transparent',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  transition: 'all 0.25s ease',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: isActive ? s.color : '#F1F5F9',
                  color: isActive ? '#fff' : '#94A3B8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.25s ease',
                }}>
                  <SI size={22} />
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: isActive ? '#0F172A' : '#94A3B8',
                  fontFamily: 'var(--ae-font-display)',
                  transition: 'color 0.2s',
                }}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div style={{
          height: 4, borderRadius: 2,
          background: '#F1F5F9', marginBottom: 48,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: step.color,
            width: `${((active + 1) / STEPS.length) * 100}%`,
            transition: 'width 0.4s ease, background 0.4s ease',
          }} />
        </div>

        {/* Active Step Content */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr',
          gap: 48, alignItems: 'center',
        }}>
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: `${step.color}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: step.color,
              }}>
                <Icon size={28} />
              </div>
              <div>
                <div className="ae-label" style={{ color: step.color, marginBottom: 2 }}>
                  Phase {active + 1} of {STEPS.length}
                </div>
                <h3 className="ae-heading-md" style={{ fontSize: 24, color: '#0B132B' }}>
                  {step.title}
                </h3>
              </div>
            </div>

            <p className="ae-body" style={{ fontSize: 16, marginBottom: 28, maxWidth: 560 }}>
              {step.desc}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {step.capabilities.map(c => (
                <span key={c} style={{
                  padding: '8px 16px', borderRadius: 10,
                  background: '#F8FAFC', border: '1px solid #E2E8F0',
                  fontSize: 13, fontWeight: 600, color: '#475569',
                  fontFamily: 'var(--ae-font-display)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <ChevronRight size={14} style={{ color: step.color }} />
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
