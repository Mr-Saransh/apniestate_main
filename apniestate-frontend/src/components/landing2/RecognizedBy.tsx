import { motion } from 'framer-motion'
import { useState } from 'react'

// Placeholder images - Please replace these with the actual images you uploaded
// Save them as tripura.png, startupindia.png, and dit.png in the src/imports folder
import startupTripuraLogo from '@/imports/tripura.png' 
import startupIndiaLogo from '@/imports/startupindia.png' 
import ditTripuraLogo from '@/imports/dit.png' 

const REGISTRATIONS = [
  {
    title: 'Startup Tripura',
    body: 'Recognized by the Government of Tripura\'s Startup policy, reflecting our commitment to enterprise-grade innovation in the region.',
    logo: startupTripuraLogo,
  },
  {
    title: 'Startup India',
    body: 'Officially recognized by the Government of India\'s Startup India initiative — validating our legitimate, high-growth trajectory.',
    logo: startupIndiaLogo,
  },
  {
    title: 'DIT Tripura',
    body: 'Acknowledged by the Directorate of Information Technology (Govt. of Tripura) for technological advancement in construction.',
    logo: ditTripuraLogo,
  },
]

export default function RecognizedBy() {
  return (
    <section style={{
      background: 'linear-gradient(180deg, #F5F7FF 0%, #FFFFFF 100%)',
      padding: 'clamp(64px, 8vw, 100px) 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle background decoration */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.2), transparent)' }} />
      <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(37,99,235,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 5vw, 64px)' }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p style={{
              display: 'inline-block',
              fontSize: 12, fontWeight: 700, color: '#2563EB',
              letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              background: 'rgba(37, 99, 235, 0.1)',
              padding: '6px 16px',
              borderRadius: 30,
            }}>
              Official Recognition
            </p>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 'clamp(32px, 4vw, 48px)',
              fontWeight: 800, color: '#0F172A',
              letterSpacing: '-0.02em', marginBottom: 16,
              lineHeight: 1.2,
            }}
          >
            Backed by Government Initiatives
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: 18, color: '#64748B', fontFamily: "'Inter', sans-serif", maxWidth: 650, margin: '0 auto', lineHeight: 1.6 }}
          >
            Apni Estate is officially registered and recognized for its commitment to digitizing Indian construction and driving technological advancement.
          </motion.p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 32,
          alignItems: 'stretch',
        }}>
          {REGISTRATIONS.map((r, i) => (
            <RecognitionCard key={i} registration={r} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function RecognitionCard({ registration, index }: { registration: typeof REGISTRATIONS[0], index: number }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15 + 0.3 }}
      whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)' }}
      style={{
        background: '#FFFFFF',
        borderRadius: 24,
        padding: '48px 32px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0,0,0,0.02)',
        border: '1px solid rgba(15, 23, 42, 0.04)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease',
      }}
    >
      <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, width: '100%' }}>
        {!imgError ? (
          <img 
            src={registration.logo} 
            alt={registration.title} 
            onError={() => setImgError(true)}
            style={{ maxHeight: '100%', maxWidth: '80%', objectFit: 'contain', filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.05))' }} 
          />
        ) : (
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 12 }}>
            Logo
          </div>
        )}
      </div>
      <h3 style={{
        fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 12,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {registration.title}
      </h3>
      <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.6, fontFamily: "'Inter', sans-serif", margin: 0 }}>
        {registration.body}
      </p>
    </motion.div>
  )
}
