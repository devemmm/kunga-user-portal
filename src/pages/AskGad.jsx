import { useEffect, useState } from 'react';
import { askGadApi } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useLang } from '../lib/i18n.jsx';
import { MessageCircle, Send, Clock, CheckCircle, AlertCircle, Loader, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_CONFIG_KEYS = {
  PENDING:   { tKey: 'askGad.statusPending',   color: '#d97706', bg: '#fef3c7', icon: Clock },
  IN_REVIEW: { tKey: 'askGad.statusInReview',  color: '#7c3aed', bg: '#ede9fe', icon: Clock },
  ANSWERED:  { tKey: 'askGad.statusAnswered',  color: '#16a34a', bg: '#dcfce7', icon: CheckCircle },
  ESCALATED: { tKey: 'askGad.statusEscalated', color: '#dc2626', bg: '#fee2e2', icon: AlertCircle },
};

export default function AskGad() {
  const { user } = useAuth();
  const { t } = useLang();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: '', body: '', childAge: '', childName: '' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isPremium = ['ACTIVE', 'TRIAL'].includes(user?.subscriptionStatus);

  useEffect(() => {
    if (!isPremium) { setLoading(false); return; }
    askGadApi.list()
      .then(d => setQuestions(Array.isArray(d) ? d : (d?.questions ?? d?.submissions ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isPremium]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const q = await askGadApi.submit(form);
      setQuestions(prev => [q, ...prev]);
      setForm({ subject: '', body: '', childAge: '', childName: '' });
      setShowForm(false);
      setSuccess('Your question has been submitted! Dr. Gad will respond soon.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message ?? 'Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isPremium) return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{t('askGad.title')}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{t('askGad.subtitle')}</p>
      </div>
      <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <Lock size={36} style={{ color: 'var(--muted)', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t('askGad.locked')}</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 300, margin: '0 auto 20px' }}>
          {t('askGad.lockedDesc')}
        </p>
        <Link to="/payments" style={{ display: 'inline-block', background: 'var(--green)', color: '#fff', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
          {t('askGad.upgrade')}
        </Link>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{t('askGad.title')}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{t('askGad.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Send size={14} /> {t('askGad.send')}
        </button>
      </div>

      {success && (
        <div style={{ background: 'var(--green-light)', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', color: 'var(--green-dark)', fontSize: 14, marginBottom: 16 }}>
          {success}
        </div>
      )}

      {/* Question form */}
      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{t('askGad.formTitle')}</h2>
          <form onSubmit={submit}>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{t('askGad.childName')}</label>
                <input value={form.childName} onChange={e => setForm(f => ({ ...f, childName: e.target.value }))}
                  placeholder={t('askGad.childNamePlaceholder')} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{t('askGad.childAge')}</label>
                <input value={form.childAge} onChange={e => setForm(f => ({ ...f, childAge: e.target.value }))}
                  placeholder={t('askGad.childAgePlaceholder')} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{t('askGad.subject')} *</label>
              <input required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder={t('askGad.subjectPlaceholder')} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{t('askGad.question')} *</label>
              <textarea required value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder={t('askGad.placeholder')}
                rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={submitting}
                style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, opacity: submitting ? .7 : 1 }}>
                {submitting ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> {t('askGad.sending')}</> : <><Send size={14} /> {t('askGad.submitBtn')}</>}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--green)' }} />
        </div>
      ) : questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
          <MessageCircle size={36} style={{ margin: '0 auto 12px', opacity: .4 }} />
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{t('askGad.empty')}</div>
          <div style={{ fontSize: 14 }}>{t('askGad.emptyDesc')}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {questions.map(q => {
            const cfg = STATUS_CONFIG_KEYS[q.status] ?? STATUS_CONFIG_KEYS.PENDING;
            const StatusIcon = cfg.icon;
            return (
              <div key={q.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{q.subject}</div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
                      <StatusIcon size={11} /> {t(cfg.tKey)}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>{q.body}</p>
                  {q.createdAt && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>{new Date(q.createdAt).toLocaleDateString()}</div>}
                </div>
                {q.response && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px', background: 'var(--green-light)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>{t('askGad.response')}</div>
                    <p style={{ fontSize: 13 }}>{q.response}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8,
  fontSize: 14, outline: 'none', fontFamily: 'inherit', background: 'var(--surface)',
};
