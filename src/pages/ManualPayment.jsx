import { useState, useEffect, useRef } from "react";
import {
  Upload, CheckCircle, Clock, XCircle, ChevronRight,
  AlertCircle, FileText, X, Banknote, ArrowLeft,
  Smartphone, Building2, Copy, Check,
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

function token() { return localStorage.getItem("kb_token"); }

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token()}`, ...opts.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.status === 204 ? null : res.json();
}

const CURRENCIES = ["RWF", "USD", "KES", "UGX", "TZS", "EUR", "GBP"];

const STATUS = {
  PENDING:  { Icon: Clock,       color: "#b45309", bg: "#fef3c7", border: "#fcd34d", label: "Under review" },
  APPROVED: { Icon: CheckCircle, color: "#047857", bg: "#d1fae5", border: "#6ee7b7", label: "Approved" },
  REJECTED: { Icon: XCircle,     color: "#b91c1c", bg: "#fee2e2", border: "#fca5a5", label: "Rejected" },
};

function StatusPill({ status }) {
  const s = STATUS[status] ?? STATUS.PENDING;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 11px", borderRadius: 99, fontSize: 12, fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      <s.Icon size={12} /> {s.label}
    </span>
  );
}

function fmt(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── COPY BUTTON ──────────────────────────────────────────────────────────────

function CopyBtn({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{
      background: "none", border: "none", cursor: "pointer",
      color: copied ? "#059669" : "var(--muted)", padding: "2px 4px",
      display: "inline-flex", alignItems: "center",
    }}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

// ─── BANK DETAILS CARD ────────────────────────────────────────────────────────

function BankDetails() {
  const rows = [
    { label: "Bank",           value: "Bank of Kigali",        copy: false },
    { label: "Account name",   value: "Kunga Basics Ltd",       copy: true  },
    { label: "Account no.",    value: "00040-01234567-01",       copy: true  },
    { label: "SWIFT / BIC",    value: "BKIGRWRW",               copy: true  },
  ];
  const mobile = [
    { icon: "📱", label: "MTN MoMo",   value: "*182*8*1*0787000000#" },
    { icon: "📱", label: "Airtel",     value: "*185*1*1*0730000000#" },
  ];

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0D3D22, #1B5E3B)",
        padding: "14px 18px", display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Building2 size={17} color="white" />
        </div>
        <div>
          <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Bank transfer details</div>
          <div style={{ color: "rgba(255,255,255,.65)", fontSize: 12 }}>Send your payment to this account</div>
        </div>
      </div>

      {/* Bank rows */}
      <div style={{ background: "var(--surface)" }}>
        {rows.map((r, i) => (
          <div key={r.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "11px 18px", fontSize: 13,
            borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : undefined,
          }}>
            <span style={{ color: "var(--muted)" }}>{r.label}</span>
            <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              {r.value}
              {r.copy && <CopyBtn value={r.value} />}
            </span>
          </div>
        ))}
      </div>

      {/* Mobile money divider */}
      <div style={{
        background: "#f0fdf4", borderTop: "1px solid #bbf7d0",
        padding: "10px 18px",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <Smartphone size={14} color="#059669" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#065f46" }}>Mobile money</span>
      </div>
      {mobile.map(m => (
        <div key={m.label} style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 18px", fontSize: 13, background: "#f0fdf4",
          borderTop: "1px solid #bbf7d0",
        }}>
          <span style={{ color: "#065f46" }}>{m.icon} {m.label}</span>
          <span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 12, display: "flex", alignItems: "center", gap: 4, color: "#065f46" }}>
            {m.value} <CopyBtn value={m.value} />
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyState({ onNew }) {
  const steps = [
    { n: "1", icon: <Building2 size={16} color="#0D3D22" />, title: "Transfer the fee", desc: "Send payment to our bank account or mobile money number above" },
    { n: "2", icon: <Upload    size={16} color="#0D3D22" />, title: "Upload your receipt", desc: "Take a photo or screenshot of your transfer confirmation" },
    { n: "3", icon: <CheckCircle size={16} color="#0D3D22" />, title: "Get activated",    desc: "We verify and activate your account within 24 hours" },
  ];

  return (
    <div>
      <BankDetails />

      {/* Steps */}
      <div style={{ margin: "24px 0 8px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 14 }}>
          How it works
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              {/* Timeline */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(135deg,#0D3D22,#2D7A52)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: 800, fontSize: 13,
                }}>
                  {s.n}
                </div>
                {i < steps.length - 1 && (
                  <div style={{ width: 2, flex: 1, background: "#d1fae5", minHeight: 28, margin: "4px 0" }} />
                )}
              </div>
              <div style={{ paddingBottom: i < steps.length - 1 ? 20 : 0, paddingTop: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onNew}
        style={{
          width: "100%", marginTop: 8, padding: "14px",
          background: "linear-gradient(135deg, #0D3D22, #1B5E3B)",
          color: "white", border: "none", borderRadius: 14,
          fontWeight: 700, fontSize: 15, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        <Upload size={17} /> Submit a receipt
      </button>
    </div>
  );
}

// ─── HISTORY LIST ─────────────────────────────────────────────────────────────

function History({ onNew }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/manual-payments/my")
      .then(d => setItems(d.payments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        border: "3px solid #0D3D22", borderTopColor: "transparent",
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );

  if (items.length === 0) return <EmptyState onNew={onNew} />;

  const hasPending = items.some(p => p.status === "PENDING");

  return (
    <div>
      {/* Pending banner */}
      {hasPending && (
        <div style={{
          background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 12,
          padding: "12px 16px", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 10, fontSize: 13,
        }}>
          <Clock size={16} color="#b45309" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ color: "#b45309" }}>Receipt under review</strong>
            <div style={{ color: "#78350f", marginTop: 1 }}>We'll email you once it's processed — usually within 24 hours.</div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map(p => {
          const s = STATUS[p.status] ?? STATUS.PENDING;
          return (
            <div key={p.id} style={{
              background: "var(--surface)", border: `1px solid ${s.border}`,
              borderRadius: 14, overflow: "hidden",
            }}>
              {/* Status stripe */}
              <div style={{ height: 4, background: s.color, opacity: 0.7 }} />
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                  <div style={{
                    fontFamily: "monospace", fontSize: 13, fontWeight: 800,
                    color: "#0D3D22", letterSpacing: 1,
                  }}>
                    {p.txRef}
                  </div>
                  <StatusPill status={p.status} />
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--muted)" }}>
                  <span>{p.plan.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
                  <span style={{ color: "var(--border)" }}>·</span>
                  <span style={{ fontWeight: 700, color: "var(--text)" }}>{p.currency} {Number(p.amount).toLocaleString()}</span>
                  <span style={{ color: "var(--border)" }}>·</span>
                  <span>{fmt(p.createdAt)}</span>
                </div>
                {p.status === "REJECTED" && p.rejectionReason && (
                  <div style={{
                    marginTop: 10, padding: "9px 12px", borderRadius: 8,
                    background: "#fee2e2", color: "#991b1b", fontSize: 12, lineHeight: 1.5,
                  }}>
                    <strong>Rejected:</strong> {p.rejectionReason}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!hasPending && (
        <button
          onClick={onNew}
          style={{
            width: "100%", marginTop: 16, padding: "13px",
            background: "linear-gradient(135deg,#0D3D22,#1B5E3B)",
            color: "white", border: "none", borderRadius: 14,
            fontWeight: 700, fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <Upload size={16} /> Submit another receipt
        </button>
      )}
    </div>
  );
}

// ─── SUBMIT FORM ──────────────────────────────────────────────────────────────

function SubmitForm({ onSuccess }) {
  const [plans, setPlans]         = useState([]);
  const [plan, setPlan]           = useState("");
  const [amount, setAmount]       = useState("");
  const [currency, setCurrency]   = useState("RWF");
  const [notes, setNotes]         = useState("");
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");
  const fileRef                   = useRef();

  // Hardcoded fallback so form works even if the plans endpoint is down
  const FALLBACK_PLANS = [
    { value: "gold_monthly",      label: "Gold – Monthly",      days: 30  },
    { value: "gold_quarterly",    label: "Gold – Quarterly",    days: 90  },
    { value: "gold_annual",       label: "Gold – Annual",       days: 365 },
    { value: "premium_monthly",   label: "Premium – Monthly",   days: 30  },
    { value: "premium_quarterly", label: "Premium – Quarterly", days: 90  },
    { value: "premium_annual",    label: "Premium – Annual",    days: 365 },
  ];

  useEffect(() => {
    // Pre-fill with fallback immediately so the button is never stuck
    setPlans(FALLBACK_PLANS);
    setPlan(FALLBACK_PLANS[0].value);
    // Then try to fetch live plans (may override with server data)
    api("/manual-payments/plans")
      .then(d => { if (d.plans?.length) { setPlans(d.plans); setPlan(d.plans[0].value); } })
      .catch(() => {}); // fallback already set, so swallow silently
  }, []);

  const onFile = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setError("File too large — max 10 MB"); return; }
    setFile(f); setError("");
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = ev => setPreview(ev.target.result);
      reader.readAsDataURL(f);
    } else { setPreview("pdf"); }
  };

  const removeFile = () => {
    setFile(null); setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    setError("");
    if (!plan)                      { setError("Please select a plan"); return; }
    if (!amount || Number(amount) <= 0) { setError("Please enter a valid amount"); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("plan", plan); fd.append("amount", amount);
      fd.append("currency", currency); fd.append("notes", notes);
      if (file) fd.append("receipt", file);
      const result = await fetch(`${BASE}/manual-payments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      if (!result.ok) {
        const err = await result.json().catch(() => ({}));
        throw new Error(err.message || err.error || `Server error ${result.status} — please try again`);
      }
      onSuccess(await result.json());
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const selectedPlan = plans.find(p => p.value === plan);
  const canSubmit = plan && Number(amount) > 0 && !submitting;

  const labelStyle = { display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "var(--text)" };
  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14,
    border: "1.5px solid var(--border)", background: "var(--bg)",
    color: "var(--text)", boxSizing: "border-box", outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Plan selector */}
      <div>
        <label style={labelStyle}>Subscription plan</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {plans.map(p => (
            <button
              key={p.value}
              onClick={() => setPlan(p.value)}
              style={{
                padding: "11px 12px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                border: `2px solid ${plan === p.value ? "#0D3D22" : "var(--border)"}`,
                background: plan === p.value ? "#f0fdf4" : "var(--surface)",
                transition: "all .15s",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: plan === p.value ? "#0D3D22" : "var(--text)" }}>
                {p.label}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                {p.days} days access
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label style={labelStyle}>Amount paid</label>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={currency} onChange={e => setCurrency(e.target.value)}
            style={{ ...inputStyle, width: "auto", paddingRight: 10 }}
          >
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input
            type="number" min="1" step="any"
            value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0"
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label style={labelStyle}>
          Transfer reference&nbsp;
          <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span>
        </label>
        <input
          type="text" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Bank ref, MTN TxID, or any note"
          style={inputStyle}
        />
      </div>

      {/* Receipt upload */}
      <div>
        <label style={labelStyle}>Payment receipt</label>
        {!file ? (
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: "2px dashed var(--border)", borderRadius: 14, padding: "28px 20px",
              textAlign: "center", cursor: "pointer", background: "var(--surface)",
              transition: "border-color .15s, background .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="#0D3D22"; e.currentTarget.style.background="#f0fdf4"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.background="var(--surface)"; }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: "linear-gradient(135deg,#0D3D22,#1B5E3B)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
            }}>
              <Upload size={20} color="white" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Tap to upload receipt</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>JPG, PNG or PDF · max 10 MB</div>
          </div>
        ) : (
          <div style={{ border: "1.5px solid #6ee7b7", borderRadius: 14, overflow: "hidden", position: "relative", background: "#f0fdf4" }}>
            {preview === "pdf" ? (
              <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={20} color="#047857" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{file.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{(file.size/1024).toFixed(1)} KB</div>
                </div>
                <CheckCircle size={18} color="#059669" style={{ marginLeft: "auto" }} />
              </div>
            ) : (
              <img src={preview} alt="Receipt" style={{ width: "100%", maxHeight: 260, objectFit: "contain", display: "block" }} />
            )}
            <button
              onClick={removeFile}
              style={{
                position: "absolute", top: 8, right: 8,
                background: "rgba(0,0,0,.55)", border: "none", borderRadius: "50%",
                width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "white",
              }}
            >
              <X size={13} />
            </button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={onFile} />
      </div>

      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "11px 14px",
          background: "#fee2e2", borderRadius: 10, color: "#991b1b", fontSize: 13,
        }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={!canSubmit}
        style={{
          width: "100%", padding: "14px",
          background: canSubmit ? "linear-gradient(135deg,#0D3D22,#1B5E3B)" : "var(--border)",
          color: canSubmit ? "white" : "var(--muted)",
          border: "none", borderRadius: 14,
          fontWeight: 700, fontSize: 15, cursor: canSubmit ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "opacity .15s",
        }}
      >
        {submitting
          ? <><span style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,.4)", borderTopColor: "white", animation: "spin .8s linear infinite", display: "inline-block" }} /> Submitting…</>
          : <><Upload size={17} /> Submit for review</>
        }
      </button>
    </div>
  );
}

// ─── SUCCESS ──────────────────────────────────────────────────────────────────

function SuccessScreen({ payment, onViewHistory }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 0 24px" }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "linear-gradient(135deg,#0D3D22,#1B5E3B)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px",
        boxShadow: "0 8px 24px rgba(13,61,34,.3)",
      }}>
        <CheckCircle size={34} color="white" />
      </div>

      <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 8 }}>Receipt submitted!</div>
      <div style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
        We'll review your receipt and activate your<br />account within 24 hours. Check your email.
      </div>

      {/* Reference number */}
      <div style={{
        background: "linear-gradient(135deg,#0D3D22,#1B5E3B)",
        borderRadius: 16, padding: "20px",
        marginBottom: 24, textAlign: "center",
      }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          Your reference number
        </div>
        <div style={{
          fontFamily: "monospace", fontSize: 26, fontWeight: 900,
          color: "white", letterSpacing: 3, marginBottom: 8,
        }}>
          {payment.txRef}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)" }}>
          Save this — quote it if you need to contact support
        </div>
      </div>

      <button
        onClick={onViewHistory}
        style={{
          width: "100%", padding: "13px",
          background: "transparent",
          border: "2px solid #0D3D22",
          color: "#0D3D22", fontWeight: 700,
          fontSize: 14, borderRadius: 14, cursor: "pointer",
        }}
      >
        View my submissions
      </button>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ManualPaymentPage() {
  const [view, setView]         = useState("history"); // "history" | "form" | "success"
  const [submitted, setSubmitted] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Top bar */}
      <div style={{
        background: "linear-gradient(135deg,#0D3D22,#1B5E3B)",
        padding: "20px 20px 28px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 2 }}>
          {view === "form" && (
            <button
              onClick={() => setView("history")}
              style={{
                background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8,
                width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "white", flexShrink: 0,
              }}
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <div style={{ color: "rgba(255,255,255,.65)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".6px" }}>
              {view === "form" ? "Step 2 of 2" : view === "success" ? "Done" : "Payment"}
            </div>
            <div style={{ color: "white", fontWeight: 800, fontSize: 20 }}>
              {view === "form"    ? "Upload your receipt"
               : view === "success" ? "Submitted!"
               : "Bank transfer"}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: 520, margin: "0 auto",
        padding: "0 16px 48px",
        marginTop: -12,
      }}>
        <div style={{
          background: "var(--bg)", borderRadius: "20px 20px 0 0",
          padding: "24px 0 0", minHeight: 400,
        }}>
          {view === "history" && <History onNew={() => setView("form")} />}
          {view === "form"    && <SubmitForm onSuccess={p => { setSubmitted(p); setView("success"); }} />}
          {view === "success" && <SuccessScreen payment={submitted} onViewHistory={() => setView("history")} />}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
