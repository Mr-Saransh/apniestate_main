import { motion } from 'framer-motion'
import { UserPlus, Settings, Rocket, LayoutDashboard, FileText, IndianRupee } from 'lucide-react'

const STEPS = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Create Account',
    desc: 'Sign up to get started in seconds. No credit card required.',
  },
  {
    icon: Settings,
    step: '02',
    title: 'Setup',
    desc: 'Configure your projects, teams and data to match your workflow.',
  },
  {
    icon: Rocket,
    step: '03',
    title: 'Go Live',
    desc: 'Start managing everything in real time across every site and team.',
  },
]

const ROLES = [
  {
    icon: LayoutDashboard,
    role: 'Executive Command Center',
    desc: 'Full portfolio visibility — budgets, timelines, approvals, and cashflow in one dashboard.',
    color: '#0B1F4D',
  },
  {
    icon: FileText,
    role: 'Site Manager Console',
    desc: 'Real-time labour attendance, material issuance, daily logs, and task assignment.',
    color: '#1A3A8F',
  },
  {
    icon: IndianRupee,
    role: 'Finance & Accounts',
    desc: 'Invoice tracking, vendor payments, cost analysis, and cashflow forecasting.',
    color: '#F5B301',
  },
]

export default function ConstructionFeatures() {
  return (
    <>
      {/* Section 1: Start Managing in Minutes */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#0B1F4D 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="container mx-auto px-6 max-w-6xl relative">
          <div className="text-center mb-4">
            <h2 className="text-4xl lg:text-5xl font-black text-[#0B1F4D] leading-tight mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Start Managing in <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5B301] to-[#E09600]">Minutes</span>
            </h2>
            <p className="text-[#6B7BA8] text-lg max-w-xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
              Our onboarding flow is designed for speed. Get your entire team set up and running in minutes, not days.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-14">
            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative group p-8 rounded-3xl bg-[#F5F7FF] border border-[#0B1F4D]/5 hover:bg-white hover:shadow-2xl hover:shadow-[#0B1F4D]/8 hover:-translate-y-2 transition-all duration-500"
              >
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 -right-4 w-8 h-px bg-[#0B1F4D]/15 z-10" />
                )}
                <div className="text-[48px] font-black text-[#0B1F4D]/6 leading-none mb-4 select-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {s.step}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#0B1F4D] flex items-center justify-center text-white mb-5 group-hover:bg-[#F5B301] group-hover:text-[#0B1F4D] transition-colors duration-400">
                  <s.icon size={22} />
                </div>
                <h3 className="text-xl font-black text-[#0B1F4D] mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {s.title}
                </h3>
                <p className="text-[#6B7BA8] text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: A Dashboard for Every Role */}
      <section className="py-20 bg-[#F5F7FF] relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-4xl lg:text-5xl font-black text-[#0B1F4D] leading-tight mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              A Dashboard for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5B301] to-[#E09600]">Every Role</span>
            </h2>
            <p className="text-[#6B7BA8] text-lg max-w-xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
              Apni Estate gives each role purpose-built intelligence. No clutter — just what you need to make decisions faster.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {ROLES.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white rounded-3xl p-8 border border-[#0B1F4D]/6 hover:shadow-2xl hover:shadow-[#0B1F4D]/10 hover:-translate-y-2 transition-all duration-500 cursor-default"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: r.color === '#F5B301' ? '#FFF8E1' : '#EEF1FB' }}
                >
                  <r.icon size={26} style={{ color: r.color }} />
                </div>
                <h3 className="text-lg font-black text-[#0B1F4D] mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {r.role}
                </h3>
                <p className="text-[#6B7BA8] text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {r.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
