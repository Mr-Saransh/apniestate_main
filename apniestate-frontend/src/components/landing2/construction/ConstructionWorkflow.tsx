import { motion } from 'framer-motion'
import { PackageOpen, Clock, BadgeIndianRupee, ChevronRight } from 'lucide-react'

const PROBLEMS = [
  {
    icon: PackageOpen,
    title: 'Material Wastage & Theft',
    problem: 'Legacy software and WhatsApp group chats fail to monitor inventory, materials, and budget overruns. Theft goes undetected for weeks.',
    solution: "Apni Estate centralizes your entire inventory in real time — every item issued, returned, or flagged is tracked automatically.",
    tag: 'Inventory Control',
  },
  {
    icon: Clock,
    title: 'Project Delays',
    problem: 'Outdated timelines destroy client relationships. Poor coordination and approval bottlenecks bleed your margins on every project.',
    solution: 'Smart task sequencing, role-based notifications, and one-tap approvals keep every team on the same page and on schedule.',
    tag: 'Timeline Management',
  },
  {
    icon: BadgeIndianRupee,
    title: 'Blind Cashflow',
    problem: 'Hidden costs eat into your profits. Scattered invoices, manual follow-ups, and delayed payments make cashflow unpredictable.',
    solution: 'Automated invoice tracking, vendor payment scheduling, and real-time cost dashboards give you full financial visibility.',
    tag: 'Financial Clarity',
  },
]

export default function ConstructionWorkflow() {
  return (
    <section className="py-24 bg-[#0B1F4D] relative overflow-hidden">
      {/* Subtle background graphic */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(245,179,1,1) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#F5B301]/5 blur-[120px] -mr-64 -mt-64 pointer-events-none" />

      <div className="container mx-auto px-6 max-w-6xl relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/6 border border-white/12 text-white/70 text-xs font-bold mb-6 uppercase tracking-widest" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            The Real Cost of Doing Nothing
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Construction Projects Lose<br />
            <span className="text-[#F5B301]">Money Every Day</span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
            Every week without a proper system is revenue walking out the door. Here's what unmanaged construction looks like — and what Apni Estate does about it.
          </p>
        </div>

        <div className="space-y-6">
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/8 hover:border-[#F5B301]/20 transition-all duration-400"
            >
              <div className="flex flex-col md:flex-row gap-8">
                {/* Problem side */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white/8 border border-white/12 rounded-2xl flex items-center justify-center text-[#F5B301] flex-shrink-0">
                      <p.icon size={22} />
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.tag}</div>
                      <h3 className="text-xl font-black text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.title}</h3>
                    </div>
                  </div>
                  <p className="text-white/45 text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {p.problem}
                  </p>
                </div>

                {/* Divider arrow */}
                <div className="hidden md:flex items-center justify-center flex-shrink-0">
                  <div className="w-10 h-10 bg-[#F5B301]/12 border border-[#F5B301]/20 rounded-full flex items-center justify-center">
                    <ChevronRight size={18} className="text-[#F5B301]" />
                  </div>
                </div>

                {/* Solution side */}
                <div className="flex-1 bg-white/5 rounded-2xl p-5 border border-[#F5B301]/10 group-hover:border-[#F5B301]/20 transition-colors">
                  <div className="text-[9px] font-bold text-[#F5B301] uppercase tracking-widest mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Apni Estate Solution</div>
                  <p className="text-white/75 text-sm leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {p.solution}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
