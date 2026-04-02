import { ArrowLeft, Mail } from 'lucide-react'
import { LATEST_UPDATE } from '../../constants/changelog'
import pkg from '../../../package.json'

export default function AboutScreen({ onBack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#f0f4f8', overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 16px 12px', backgroundColor: '#fff', borderBottom: '1px solid #e8edf3' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', marginRight: '8px', color: '#0f172a' }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '17px', color: '#0f172a', margin: 0 }}>
          About
        </h2>
      </div>

      {/* App identity */}
      <div style={{ textAlign: 'center', padding: '32px 24px 24px' }}>
        <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '22px', color: 'var(--ssc-blue)' }}>
          Starving Student Card
        </div>
        <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
          Version {pkg.version}
        </div>
        <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', marginTop: '14px', maxWidth: '300px', margin: '14px auto 0' }}>
          Your guide to every deal on the Starving Student Discount Card — 418 deals, 199 local businesses, all on one interactive map built for Utah County students.
        </p>
      </div>

      {/* What's New */}
      <div className="mx-4 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '13px', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            What's New in {LATEST_UPDATE.version}
          </h3>
        </div>
        <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', padding: '14px 16px', margin: 0 }}>
          {LATEST_UPDATE.description}
        </p>
      </div>

      {/* Contact */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '13px', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Contact
          </h3>
        </div>
        <a
          href="mailto:adam.b.cottrell@gmail.com"
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', textDecoration: 'none' }}
        >
          <Mail size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '14px', color: '#334155', fontWeight: 500 }}>Questions or feedback?</div>
            <div style={{ fontSize: '13px', color: 'var(--ssc-blue)', marginTop: '2px' }}>adam.b.cottrell@gmail.com</div>
          </div>
        </a>
      </div>

      {/* Legal */}
      <p style={{ textAlign: 'center', fontSize: '12px', color: '#cbd5e1', padding: '24px 16px' }}>
        © {new Date().getFullYear()} Starving Student Card
      </p>

    </div>
  )
}
