import { motion } from 'framer-motion'

const WHY = [
  { icon: '🏗️', stat: '3%', label: 'Savings on Every Site', desc: 'Cut material and labour costs on every project through real-time tracking and alerts.' },
  { icon: '📉', stat: '12%', label: 'Average Cost Reduction', desc: 'Apni Estate customers report 12% lower overall project costs within the first quarter.' },
  { icon: '⚡', stat: '3×', label: 'Faster Approval Cycles', desc: 'Mobile-first approvals mean decisions in minutes, not days — keeping work moving.' },
  { icon: '🔒', stat: '0', label: 'Data Loss Incidents', desc: 'Cloud-first architecture with automatic backups means your data is always safe.' },
]

export default function Stats() {
  return (
    <section style={{
      background: 'linear-gradient(135deg, #0B1F4D 0%, #162D6E 100%)',
      padding: 'clamp(60px, 8vw, 100px) 20px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.05,
        backgroundImage: 'radial-gradient(circle, rgba(245,179,1,1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div style={{
        position: 'absolute', top: -200, right: -200, width: 500, height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,179,1,0.12), transparent 70%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(245,179,1,0.7)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Why Construction Enterprises Choose Us
          </p>
          <h2 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 900, color: '#fff',
            letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.15,
          }}>
            We didn't build yet another project<br />management tool.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.50)', fontFamily: "'Inter', sans-serif", maxWidth: 580, margin: '0 auto', lineHeight: 1.7 }}>
            We built the first purpose-built ERP for Indian construction — designed specifically for Indian builders and contractors, not adapted from Western enterprise tools.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
          gap: 16,
        }}>
          {WHY.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              style={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 20, padding: 'clamp(22px, 3vw, 30px)',
                textAlign: 'center',
                transition: 'background 0.25s, border-color 0.25s',
                cursor: 'default',
              }}
              whileHover={{ scale: 1.02 }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 'clamp(36px, 4vw, 52px)',
                fontWeight: 900, color: '#F5B301',
                letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 8,
              }}>
                {s.stat}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: "'Inter', sans-serif", lineHeight: 1.6 }}>
                {s.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
