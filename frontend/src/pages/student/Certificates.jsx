import { useState, useEffect } from 'react';
import { certificateService } from '../../services';
import { Award, Download, ExternalLink, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Certificates() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    certificateService.getMy()
      .then(({ data }) => setCerts(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1 className="section-title">My Certificates</h1>
          <p className="section-subtitle">{certs.length} certificate{certs.length !== 1 ? 's' : ''} earned</p>
        </div>
      </div>

      {certs.length === 0 ? (
        <div className="empty-state">
          <Award size={60} className="empty-state-icon" />
          <h3>No certificates yet</h3>
          <p>Complete a course to earn your first certificate!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {certs.map((cert) => (
            <div key={cert._id} className="certificate-card">
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Award size={52} style={{ color: 'var(--clr-warning)', margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                  Certificate of Completion
                </p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {cert.courseName}
                </h3>
                <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                  Awarded to <strong>{cert.studentName}</strong>
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-dim)', marginBottom: '1.25rem' }}>
                  Instructor: {cert.instructorName} · {new Date(cert.issuedAt).toLocaleDateString()}
                </p>
                <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius)', padding: '0.5rem 0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <Shield size={14} style={{ color: 'var(--clr-primary)' }} />
                  <code style={{ fontSize: '0.78rem', color: 'var(--clr-primary)', letterSpacing: '0.05em' }}>{cert.certificateId}</code>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <a
                    href={`/verify/${cert.certificateId}`}
                    target="_blank"
                    className="btn btn-ghost btn-sm"
                    rel="noreferrer"
                  >
                    <ExternalLink size={13} /> Verify
                  </a>
                  {cert.pdfUrl && (
                    <a href={cert.pdfUrl} download className="btn btn-primary btn-sm">
                      <Download size={13} /> Download
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
