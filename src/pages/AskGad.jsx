import { useEffect, useState } from 'react';
import { askGadApi } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { MessageCircle, Send, Clock, CheckCircle, AlertCircle, Loader, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  PENDING:    { label: 'Pending',    color: '#d97706', bg: '#fef3c7', icon: Clock },
  IN_REVIEW:  { label: 'In Review',  color: '#7c3aed', bg: '#ede9fe', icon: Clock },
  ANSWERED:   { label: 'Answered',   color: '#16a34a', bg: '#dcfce7', icon: CheckCircle },
  ESCALATED:  { label: 'Escalated',  color: '#dc2626', bg: '#fee2e2', icon: AlertCircle },
};

export default function AskGad() {
  const { user } = useAuth();
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
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Ask Dr. Gad</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Get expert answers from Dr. Gad</p>
      </div>
      <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <Lock size={36} style={{ color: 'var(--muted)', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Premium Feature</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 300, margin: '0 auto 20px' }}>
          Subscribe to get access to Ask Dr. Gad and receive expert answers about your child's development.
        </p>
        <Link to="/profile" style={{ display: 'inline-block', background: 'var(--green)', color: '#fff', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
          View subscription plans
        </Link>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Ask Dr. Gad</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Submit questions and get expert answers</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Send size={14} /> Ask a question
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
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Submit a Question</h2>
          <form onSubmit={submit}>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Child's Name</label>
                <input value={form.childName} onChange={e => setForm(f => ({ ...f, childName: e.target.value }))}
                  placeholder="e.g. Amina" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Child's Age</label>
                <input value={form.childAge} onChange={e => setForm(f => ({ ...f, childAge: e.target.value }))}
                  placeholder="e.g. 5 years" style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Subject *</label>
              <input required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Brief subject of your question" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Your Question *</label>
              <textarea required value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Describe your question in detail…"
                rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={submitting}
                style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, opacity: submitting ? .7 : 1 }}>
                {submitting ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : <><Send size={14} /> Submit</>}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                Cancel
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
          <div style={{ fontWeight: 600, marginBottom: 4 }}>No questions yet</div>
          <div style={{ fontSize: 14 }}>Click "Ask a question" to get started</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {questions.map(q => {
            const cfg = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.PENDING;
            const StatusIcon = cfg.icon;
            return (
              <div key={q.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{q.subject}</div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
                      <StatusIcon size={11} /> {cfg.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>{q.body}</p>
                  {q.createdAt && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>{new Date(q.createdAt).toLocaleDateString()}</div>}
                </div>
                {q.response && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px', background: 'var(--green-light)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>Dr. Gad's Response</div>
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
