import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { certificateService } from '../services';
import { Shield, CheckCircle, XCircle } from 'lucide-react';

export default function CertificateVerify() {
  const { certId } = useParams();
  const [cert, setCert] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    certificateService.verify(certId)
      .then(({ data }) => setCert(data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [certId]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="container section" style={{ maxWidth: 600, textAlign: 'center' }}>
      {error ? (
        <div className="certificate-card">
          <XCircle size={64} style={{ color: 'var(--clr-danger)', margin: '0 auto 1rem' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Invalid Certificate
          </h2>
          <p style={{ color: 'var(--clr-text-muted)' }}>
            Certificate ID <code>{certId}</code> could not be verified. It may be invalid or revoked.
          </p>
        </div>
      ) : (
        <div className="certificate-card">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <CheckCircle size={64} style={{ color: 'var(--clr-success)', margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--clr-success)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem', fontWeight: 600 }}>
              ✓ Verified Certificate
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              {cert?.courseName}
            </h2>
            <p style={{ color: 'var(--clr-text-muted)', marginBottom: '0.25rem' }}>
              This certifies that
            </p>
            <p style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {cert?.studentName}
            </p>
            <p style={{ color: 'var(--clr-text-muted)', marginBottom: '1.5rem' }}>
              has successfully completed this course under <strong>{cert?.instructorName}</strong>
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 'var(--radius)', padding: '0.5rem 1rem'
            }}>
              <Shield size={15} style={{ color: 'var(--clr-primary)' }} />
              <code style={{ color: 'var(--clr-primary)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>{cert?.certificateId}</code>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-dim)', marginTop: '1rem' }}>
              Issued: {cert?.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
