import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lib/i18n.jsx';
import { useAuth } from '../lib/auth.jsx';
import { subscriptionsApi, paymentsApi, manualPaymentsApi } from '../lib/api.js';
import {
  CreditCard, Clock, CheckCircle, AlertCircle, Upload,
  Loader, Shield, Star,
} from 'lucide-react';

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────

const SUB_STATUS = {
  ACTIVE:    { color: '#16a34a', bg: '#dcfce7', Icon: CheckCircle, tKey: 'sub.statusActive'    },
  TRIAL:     { color: '#7c3aed', bg: '#ede9fe', Icon: Clock,        tKey: 'sub.statusTrial'    },
  CANCELLED: { color: '#dc2626', bg: '#fee2e2', Icon: AlertCircle,  tKey: 'sub.statusCancelled'},
  EXPIRED:   { color: '#d97706', bg: '#fef3c7', Icon: AlertCircle,  tKey: 'sub.statusExpired'  },
  NONE:      { color: '#64748b', bg: '#f1f5f9', Icon: Shield,        tKey: 'sub.statusFree'    },
};

// ─── SUBSCRIPTION SECTION ──────────────────────────────────────────────────────

function SubscriptionSection({ sub, loading }) {
  const { t } = useLang();
  const statusKey  = sub?.status ?? 'NONE';
  const cfg        = SUB_STATUS[statusKey] ?? SUB_STATUS.NONE;
  const statusLabel = t(cfg.tKey);

  return (
    <div>
      {/* Current plan card */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{t('sub.currentPlan')}</h2>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
            <Loader size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--green)' }} />
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <cfg.Icon size={22} style={{ color: cfg.color }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{sub?.plan ?? t('sub.free')}</div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
                  <cfg.Icon size={11} /> {statusLabel}
                </span>
              </div>
            </div>
            {sub?.periodEnd && (
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {statusKey === 'CANCELLED' ? t('sub.accessUntil') : t('sub.renewsOn')}: <strong style={{ color: 'var(--text)' }}>{new Date(sub.periodEnd).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              </div>
            )}
            {sub?.platform && (
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>
                {t('sub.platform')}: <strong style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{sub.platform.replace(/_/g, ' ')}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Available plans */}
      {(!sub || statusKey === 'NONE' || statusKey === 'EXPIRED' || statusKey === 'CANCELLED') && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{t('sub.availablePlans')}</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {[
              { name: 'Gold',    price: '$299.99/mo', color: '#d97706', bg: '#fef3c7', features: ['All learning modules', 'Progress tracking', 'Milestone tracking'] },
              { name: 'Premium', price: '$349.99/mo', color: '#7c3aed', bg: '#ede9fe', features: ['Everything in Gold', 'Ask Dr. Gad (2 questions/mo)', 'Priority support'] },
            ].map(plan => (
              <div key={plan.name} style={{ background: 'var(--surface)', border: `2px solid ${plan.color}`, borderRadius: 'var(--radius)', padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{plan.name}</div>
                    <div style={{ fontSize: 14, color: plan.color, fontWeight: 600 }}>{plan.price}</div>
                  </div>
                  <Star size={18} style={{ color: plan.color }} />
                </div>
                <ul style={{ paddingLeft: 16, marginBottom: 0 }}>
                  {plan.features.map(f => <li key={f} style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 3 }}>{f}</li>)}
                </ul>
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>{t('sub.downloadApp')}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: '16px 20px', background: 'linear-gradient(135deg,#0D3D22,#1B5E3B)', borderRadius: 12, color: 'white' }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{t('sub.cantPay')}</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 14, lineHeight: 1.5 }}>{t('sub.bankDesc')}</div>
            <Link to="/manual-payment" style={{ display: 'inline-block', padding: '8px 18px', borderRadius: 8, background: 'white', color: '#0D3D22', fontWeight: 700, fontSize: 13 }}>
              {t('sub.bankCta')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAYMENT HISTORY SECTION ───────────────────────────────────────────────────

function PaymentHistorySection({ payments, manualPayments, loading, mpLoading }) {
  const { t } = useLang();
  const pending = manualPayments.filter(p => p.status === 'PENDING');
  const allDone = manualPayments.filter(p => p.status !== 'PENDING');

  const MP_STATUS = {
    PENDING:  { color: '#b45309', bg: '#fef3c7', border: '#fcd34d', Icon: Clock,       label: t('payments.pending')  },
    APPROVED: { color: '#047857', bg: '#d1fae5', border: '#6ee7b7', Icon: CheckCircle, label: t('payments.approved') },
    REJECTED: { color: '#b91c1c', bg: '#fee2e2', border: '#fca5a5', Icon: AlertCircle, label: t('payments.rejected') },
  };

  const isEmpty = !loading && !mpLoading && payments.length === 0 && manualPayments.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Pending manual payments at top */}
      {(mpLoading || pending.length > 0) && (
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{t('payments.manual')}</h2>
          {mpLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
              <Loader size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--green)' }} />
            </div>
          ) : (
            <>
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: '12px 14px', marginBottom: 10, display: 'flex', gap: 10, fontSize: 13 }}>
                <Clock size={15} color="#b45309" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ color: '#78350f' }}>
                  <strong>{t('payments.pending')}:</strong> {t('payments.pendingNote')}
                </div>
              </div>
              {pending.map(p => {
                const s = MP_STATUS[p.status] ?? MP_STATUS.PENDING;
                return (
                  <div key={p.id} style={{ background: 'var(--surface)', border: `1px solid ${s.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ height: 3, background: s.color, opacity: .7 }} />
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: 'var(--green)', letterSpacing: 1 }}>{p.txRef}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                          <s.Icon size={11} /> {s.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {p.plan?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())} · <strong style={{ color: 'var(--text)' }}>{p.currency} {Number(p.amount).toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* History */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>{t('payments.history') ?? 'History'}</h2>
          <Link to="/manual-payment" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--green)', textDecoration: 'none' }}>
            <Upload size={12} /> {t('payments.submitReceipt')}
          </Link>
        </div>

        {(loading || mpLoading) ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--green)' }} />
          </div>
        ) : isEmpty ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <CreditCard size={32} style={{ margin: '0 auto 10px', opacity: .4 }} />
            <div style={{ marginBottom: 12 }}>{t('payments.empty')}</div>
            <Link to="/manual-payment" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--green)', color: '#fff', fontWeight: 700, fontSize: 13 }}>
              <Upload size={13} /> {t('payments.submitReceipt')}
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {allDone.map(p => {
              const s = MP_STATUS[p.status] ?? MP_STATUS.APPROVED;
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <s.Icon size={17} style={{ color: s.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{t('payments.manual')} · <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.txRef}</span></div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: s.color, fontSize: 13 }}>{p.currency} {Number(p.amount).toLocaleString()}</div>
                </div>
              );
            })}
            {payments.map((p, i) => (
              <div key={p.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CreditCard size={17} style={{ color: 'var(--green)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.plan ?? p.description ?? t('payments.subscription')}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''}</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--green)' }}>{p.currency ?? '$'}{p.amount ?? p.amountUsd ?? '—'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────

export default function Payments() {
  const { t } = useLang();
  const [tab, setTab] = useState('subscription');

  const [payments, setPayments]             = useState([]);
  const [manualPayments, setManualPayments] = useState([]);
  const [sub, setSub]                       = useState(null);
  const [loading, setLoading]               = useState(true);
  const [mpLoading, setMpLoading]           = useState(true);
  const [subLoading, setSubLoading]         = useState(true);

  useEffect(() => {
    paymentsApi.myHistory()
      .then(d => {
        const list = d?.payments ?? d?.data ?? d?.history ?? d;
        setPayments(Array.isArray(list) ? list : []);
      })
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));

    manualPaymentsApi.my()
      .then(d => {
        const list = d?.payments ?? d?.data ?? d;
        setManualPayments(Array.isArray(list) ? list : []);
      })
      .catch(() => {})
      .finally(() => setMpLoading(false));

    subscriptionsApi.getStatus()
      .then(d => setSub(d?.subscription ?? d))
      .catch(() => {})
      .finally(() => setSubLoading(false));
  }, []);

  const TABS = [
    { id: 'subscription',  label: t('profile.tabSub') },
    { id: 'payments',      label: t('payments.title') },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{t('nav.payments')}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
          {t('payments.title')} & {t('profile.tabSub').toLowerCase()}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 18, borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t_ => (
          <button key={t_.id} onClick={() => setTab(t_.id)}
            style={{
              padding: '8px 16px', border: 'none', background: 'none',
              fontWeight: tab === t_.id ? 700 : 500, fontSize: 13,
              color: tab === t_.id ? 'var(--green)' : 'var(--muted)',
              borderBottom: tab === t_.id ? '2px solid var(--green)' : '2px solid transparent',
              cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap', transition: 'color .15s',
            }}>
            {t_.label}
          </button>
        ))}
      </div>

      {tab === 'payments' && (
        <PaymentHistorySection
          payments={payments}
          manualPayments={manualPayments}
          loading={loading}
          mpLoading={mpLoading}
        />
      )}
      {tab === 'subscription' && (
        <SubscriptionSection sub={sub} loading={subLoading} />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
