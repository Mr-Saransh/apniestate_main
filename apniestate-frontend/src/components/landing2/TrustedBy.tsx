const FIRMS = [
  'Blackstone Real Estate', 'CBRE Group', 'JLL', 'Colliers', 'Cushman & Wakefield',
  'Keller Williams', 'Sotheby\'s Realty', 'Marcus & Millichap', 'RE/MAX', 'Brookfield Properties',
  'Prologis', 'AvalonBay Communities',
]

export default function TrustedBy() {
  const doubled = [...FIRMS, ...FIRMS]

  return (
    <section style={{
      background: '#fff',
      borderTop: '1px solid rgba(11,31,77,0.06)',
      borderBottom: '1px solid rgba(11,31,77,0.06)',
      padding: '32px 0',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', marginBottom: 20, textAlign: 'center' }}>
        <p style={{
          fontSize: 11, fontWeight: 700, color: '#B0BBDA',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          fontFamily: "'Inter', sans-serif",
        }}>
          Trusted by 180+ leading real estate organizations worldwide
        </p>
      </div>

      <div style={{ overflow: 'hidden', position: 'relative' }}>
        {/* Fade edges */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, zIndex: 2,
          background: 'linear-gradient(to right, #fff, transparent)',
        }} />
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, zIndex: 2,
          background: 'linear-gradient(to left, #fff, transparent)',
        }} />

        <div style={{ display: 'flex', gap: 48, width: 'max-content' }} className="animate-marquee">
          {doubled.map((firm, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
              padding: '4px 0',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(11,31,77,0.08), rgba(11,31,77,0.04))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(11,31,77,0.25)' }} />
              </div>
              <span style={{
                fontSize: 13, fontWeight: 600, color: '#B0BBDA',
                fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap',
              }}>
                {firm}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
