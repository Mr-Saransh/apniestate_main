import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, BarChart3, Users, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

function DashboardVisual() {
  return (
    <div className="relative w-full max-w-[480px]">
      {/* Decorative rings */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="w-[85%] h-[85%] border border-[#0B1F4D] rounded-full animate-[spin_25s_linear_infinite]" />
        <div className="absolute w-[65%] h-[65%] border border-dashed border-[#F5B301] rounded-full animate-[spin_18s_linear_infinite_reverse]" />
      </div>

      {/* Main dashboard card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 bg-white/90 backdrop-blur-2xl rounded-3xl border border-white shadow-2xl overflow-hidden"
      >
        {/* Header bar */}
        <div className="bg-[#0B1F4D] px-5 py-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
          </div>
          <span className="text-[9px] font-bold text-white/50 tracking-widest uppercase" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Apni Estate · Executive Command Center
          </span>
          <div className="w-8 h-2 bg-white/20 rounded-full" />
        </div>

        <div className="p-5">
          {/* Project status */}
          <div className="flex justify-between items-center mb-5">
            <div>
              <div className="text-[9px] text-[#6B7BA8] font-bold uppercase tracking-wider mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Active Project</div>
              <div className="text-base font-black text-[#0B1F4D]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Skyline Residences – Phase 2</div>
            </div>
            <div className="bg-[#22C55E]/10 text-[#22C55E] px-3 py-1 rounded-full text-[9px] font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>ON TRACK</div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Budget Used', val: '62%', color: '#F5B301' },
              { label: 'Tasks Done', val: '148/210', color: '#0B1F4D' },
              { label: 'Days Left', val: '34', color: '#22C55E' },
            ].map((s, i) => (
              <div key={i} className="bg-[#F5F7FF] rounded-xl p-3 border border-[#0B1F4D]/5 text-center">
                <div className="text-[8px] text-[#6B7BA8] font-bold uppercase mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.label}</div>
                <div className="text-sm font-black" style={{ color: s.color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Progress bars */}
          <div className="space-y-3">
            {[
              { label: 'Material Tracking', pct: 78 },
              { label: 'Labour Attendance', pct: 91 },
              { label: 'Invoice Approvals', pct: 55 },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] font-bold text-[#0B1F4D]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.label}</span>
                  <span className="text-[9px] font-bold text-[#6B7BA8]">{item.pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#F0F2F8] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 1.2, delay: 0.5 + i * 0.15 }}
                    className="h-full rounded-full bg-gradient-to-r from-[#0B1F4D] to-[#1A3A8F]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Floating badges */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-4 -right-4 bg-white/90 backdrop-blur-xl p-3 rounded-2xl border border-white shadow-xl z-20 hidden sm:flex items-center gap-2.5"
      >
        <div className="w-8 h-8 bg-[#F5B301] rounded-xl flex items-center justify-center">
          <TrendingUp size={16} className="text-[#0B1F4D]" />
        </div>
        <div>
          <div className="text-[8px] font-bold text-[#6B7BA8] uppercase">Budget Tracking</div>
          <div className="text-xs font-black text-[#0B1F4D]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Real-time Costing</div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-4 -left-4 bg-white/90 backdrop-blur-xl p-3 rounded-2xl border border-white shadow-xl z-20 hidden sm:flex items-center gap-2.5"
      >
        <div className="w-8 h-8 bg-[#0B1F4D] rounded-xl flex items-center justify-center">
          <Users size={16} className="text-white" />
        </div>
        <div>
          <div className="text-[8px] font-bold text-[#6B7BA8] uppercase">Team Collaboration</div>
          <div className="text-xs font-black text-[#0B1F4D]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>All synced up</div>
        </div>
      </motion.div>
    </div>
  )
}

export default function ConstructionHero() {
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#EEF1FB] via-[#F5F7FF] to-[#FFFBEE]" />
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-radial-[circle_at_center,rgba(245,179,1,0.07),transparent_70%] blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-radial-[circle_at_center,rgba(11,31,77,0.05),transparent_70%] blur-3xl" />
      </div>

      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center py-12">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B1F4D]/8 border border-[#0B1F4D]/15 text-[#0B1F4D] text-xs font-bold mb-8 uppercase tracking-widest" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <span className="w-2 h-2 rounded-full bg-[#F5B301] animate-pulse" />
              The leading platform for Indian construction
            </div>

            <h1 className="text-5xl lg:text-6xl font-black text-[#0B1F4D] leading-[1.08] mb-6 tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Build Smarter.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5B301] to-[#E09600]">
                Manage Everything.
              </span>
            </h1>

            <p className="text-lg text-[#6B7BA8] leading-relaxed mb-10 max-w-xl" style={{ fontFamily: "'Inter', sans-serif" }}>
              Apni Estate is the premium ERP built specifically for Indian construction and real estate departments to eliminate wastage, track projects, and centralize operations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to="/signup" className="px-8 py-4 bg-[#0B1F4D] text-white rounded-2xl font-bold text-base shadow-xl shadow-[#0B1F4D]/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Start Building Now
                <ArrowRight size={18} />
              </Link>
              <button className="px-8 py-4 bg-white border border-[#0B1F4D]/12 text-[#0B1F4D] rounded-2xl font-bold text-base hover:bg-[#F5F7FF] transition-all" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Book a Demo
              </button>
            </div>

            {/* Value Pillars for Startup */}
            <div className="grid grid-cols-2 gap-6 items-center border-t border-[#0B1F4D]/6 pt-8">
              {[
                { title: 'Zero Setup', desc: 'Start instantly' },
                { title: '100% Cloud', desc: 'Access anywhere' },
                { title: 'Made for India', desc: 'Local workflows' },
                { title: 'All-in-One', desc: 'End-to-end ERP' },
              ].map((s, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-lg font-black text-[#0B1F4D]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.title}</span>
                  <span className="text-[10px] font-bold text-[#6B7BA8] uppercase tracking-wide">{s.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center"
          >
            <DashboardVisual />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
