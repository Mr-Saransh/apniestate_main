import { motion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ConstructionCTA() {
  return (
    <section className="py-24 bg-[#F5F7FF] overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="relative rounded-[40px] bg-[#0B1F4D] p-8 md:p-20 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#F5B301]/8 blur-[100px] -mr-48 -mt-48 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-white/4 blur-[80px] -ml-24 -mb-24 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="w-16 h-16 bg-[#F5B301] rounded-3xl flex items-center justify-center text-[#0B1F4D] mb-8 shadow-lg shadow-[#F5B301]/20"
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 4L28 10V16C28 23 22 27.5 16 30C10 27.5 4 23 4 16V10L16 4Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 16l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Ready to Build <span className="text-[#F5B301]">Smarter?</span>
            </h2>

            <p className="text-white/55 text-lg mb-12 max-w-xl" style={{ fontFamily: "'Inter', sans-serif" }}>
              Join the leading construction companies that are using Apni Estate to deliver projects on time and on budget.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                to="/signup"
                className="px-10 py-5 bg-[#F5B301] text-[#0B1F4D] rounded-2xl font-bold text-base hover:shadow-xl hover:shadow-[#F5B301]/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Start Free Trial
                <ArrowRight size={18} />
              </Link>
              <button
                className="px-10 py-5 bg-white/6 backdrop-blur-md border border-white/12 text-white rounded-2xl font-bold text-base hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Play size={16} className="text-[#F5B301]" />
                Watch Product Tour
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
