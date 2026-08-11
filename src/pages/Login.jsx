import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { authApi } from '../lib/api.js';
import { Eye, EyeOff, Loader, ArrowLeft, CheckCircle, Shield } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  sage:    '#1B5E3B',
  sageMid: '#2D7A52',
  mint:    '#52B788',
  pale:    '#D4EDE0',
  fog:     '#F3F6F3',
  bark:    '#192019',
  muted:   '#6B7D6B',
  border:  '#CDD9CD',
};

// ── Botanical Canvas ──────────────────────────────────────────────────────────
function BotanicalCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf, t = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const LEAVES = [
      { px:.07,  py:.10, len:140, a:-.25, c:'#3A8A5C', op:.30, sp:.40, ph:0   },
      { px:.84,  py:.06, len: 95, a: .90, c:'#4FAF78', op:.22, sp:.50, ph:1   },
      { px:-.02, py:.62, len:160, a: .50, c:'#2D7A52', op:.20, sp:.30, ph:2   },
      { px:.88,  py:.55, len:110, a:-.70, c:'#52B788', op:.24, sp:.60, ph:.5  },
      { px:.44,  py:-.02,len: 80, a:1.30, c:'#3A8A5C', op:.18, sp:.40, ph:1.5 },
      { px:.54,  py:.94, len:118, a:-1.0, c:'#4FAF78', op:.22, sp:.35, ph:.8  },
      { px:.20,  py:.44, len: 68, a: .70, c:'#74C69D', op:.13, sp:.50, ph:2.2 },
      { px:.93,  py:.30, len: 88, a:-.30, c:'#52B788', op:.20, sp:.45, ph:1.2 },
      { px:.34,  py:.80, len:102, a:1.00, c:'#3A8A5C', op:.17, sp:.30, ph:.3  },
      { px:.64,  py:.42, len:138, a:1.10, c:'#2D7A52', op:.14, sp:.25, ph:.6  },
      { px:.28,  py:.08, len: 72, a:-1.2, c:'#52B788', op:.17, sp:.50, ph:1.1 },
      { px:.76,  py:.74, len: 90, a: .40, c:'#74C69D', op:.15, sp:.40, ph:1.7 },
    ];

    function leaf(cx, cy, len, angle, color, alpha) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(len*.25, -len*.20, len*.75, -len*.20, len, 0);
      ctx.bezierCurveTo(len*.75,  len*.20, len*.25,  len*.20, 0,   0);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.12)';
      ctx.lineWidth = .8;
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(len - 4, 0);
      ctx.stroke();
      ctx.restore();
    }

    const DOTS = [[.24,.34],[.70,.20],[.14,.83],[.80,.77],[.50,.56],[.60,.15],[.38,.62]];

    function draw() {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      LEAVES.forEach(({ px, py, len, a, c, op, sp, ph }) => {
        leaf(px*w, py*h + Math.sin(t*sp*.6+ph)*3.5, len, a + Math.sin(t*sp+ph)*.07, c, op);
      });
      DOTS.forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(dx*w, dy*h, 2.2, 0, Math.PI*2);
        ctx.fillStyle = '#95D5B2';
        ctx.globalAlpha = .08 + Math.sin(t*.5 + dx*10)*.03;
        ctx.fill();
      });
      t += .006;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position:'absolute', inset:0, width:'100%', height:'100%', display:'block' }} />;
}

// ── Floating-label input ──────────────────────────────────────────────────────
function Field({ label, type='text', value, onChange, required, minLength, autoFocus, suffix }) {
  const [focused, setFocused] = useState(false);
  const up = focused || !!value;
  return (
    <div style={{ position:'relative', marginBottom:12 }}>
      <label style={{
        position:'absolute', left:14, zIndex:1, pointerEvents:'none',
        top: up ? 8 : '50%',
        transform: up ? 'none' : 'translateY(-50%)',
        fontSize: up ? 10 : 14,
        fontWeight: up ? 700 : 400,
        color: focused ? C.sage : C.muted,
        letterSpacing: up ? .5 : 0,
        textTransform: up ? 'uppercase' : 'none',
        transition: 'all .14s cubic-bezier(.4,0,.2,1)',
      }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        required={required} minLength={minLength} autoFocus={autoFocus}
        style={{
          width:'100%', boxSizing:'border-box',
          padding: up ? '22px 14px 8px' : '14px 14px',
          paddingRight: suffix ? 46 : 14,
          border: `1.5px solid ${focused ? C.sage : C.border}`,
          borderRadius:10, fontSize:14, outline:'none',
          fontFamily:'inherit', lineHeight:1.4,
          background: focused ? '#fff' : C.fog,
          transition:'border-color .14s, background .14s',
          color: C.bark,
        }}
      />
      {suffix && <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', zIndex:1 }}>{suffix}</div>}
    </div>
  );
}

// ── Google SVG ────────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

// ── Google button ─────────────────────────────────────────────────────────────
function GoogleBtn({ onToken, loading }) {
  const [ready, setReady] = useState(false);
  const noKey = !GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('your-google');

  useEffect(() => {
    if (noKey) return;
    const init = () => {
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: r => onToken(r.credential), ux_mode:'popup' });
      setReady(true);
    };
    if (window.google?.accounts?.id) { init(); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true; s.onload = init;
    document.head.appendChild(s);
  }, []);

  if (noKey) return (
    <div style={{ textAlign:'center', fontSize:12, color:C.muted, padding:'10px 12px', background:C.fog, borderRadius:8, border:`1px dashed ${C.border}` }}>
      Google Sign-In — add VITE_GOOGLE_CLIENT_ID to .env
    </div>
  );

  return (
    <button type="button" onClick={() => ready && window.google.accounts.id.prompt()} disabled={loading || !ready}
      className="google-btn"
      style={{
        width:'100%', padding:'12px 18px', border:`1.5px solid #DADCE0`, borderRadius:10,
        background:'#fff', fontSize:14, fontWeight:600,
        display:'flex', alignItems:'center', justifyContent:'center', gap:0,
        cursor: (loading||!ready) ? 'not-allowed':'pointer', fontFamily:'inherit', color:'#3C4043',
        opacity:(loading||!ready)?.6:1,
        boxShadow:'0 1px 4px rgba(0,0,0,.08), 0 0 0 0 rgba(66,133,244,0)',
        transition:'box-shadow .18s, border-color .18s',
        letterSpacing:.15,
      }}>
      <span style={{ display:'flex', alignItems:'center', marginRight:12 }}><GoogleIcon /></span>
      <span style={{ width:1, height:18, background:'#DADCE0', marginRight:12, flexShrink:0 }} />
      <span>Continue with Google</span>
    </button>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
const Or = () => (
  <div style={{ display:'flex', alignItems:'center', gap:12, margin:'16px 0' }}>
    <div style={{ flex:1, height:1, background:C.border }} />
    <span style={{ fontSize:12, color:C.muted, fontWeight:500 }}>or</span>
    <div style={{ flex:1, height:1, background:C.border }} />
  </div>
);

// ── Error box ─────────────────────────────────────────────────────────────────
const Err = ({ msg }) => msg ? (
  <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 14px', color:'#DC2626', fontSize:13, marginBottom:14, lineHeight:1.4 }}>
    {msg}
  </div>
) : null;

// ── Primary button ────────────────────────────────────────────────────────────
const PrimaryBtn = ({ children, loading, disabled, type='submit' }) => (
  <button type={type} disabled={loading || disabled}
    style={{
      width:'100%', padding:'13px', background:C.sage, color:'#fff', border:'none', borderRadius:10,
      fontWeight:700, fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
      cursor:(loading||disabled)?'not-allowed':'pointer', opacity:(loading||disabled)?.7:1,
      fontFamily:'inherit', letterSpacing:.2, transition:'opacity .15s',
    }}>
    {children}
  </button>
);

// ── MFA CHALLENGE ─────────────────────────────────────────────────────────────
function MfaChallenge({ mfaToken, email, onBack, navigate }) {
  const { completeMfaLogin } = useAuth();
  const [otp, setOtp]         = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent]   = useState(false);
  const [error, setError]     = useState('');

  const verify = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await authApi.mfaVerify(mfaToken, otp.trim());
      await completeMfaLogin(data);
      navigate('/');
    } catch (e) { setError(e.message ?? 'Invalid code'); }
    finally { setLoading(false); }
  };

  const resend = async () => {
    setResending(true); setError('');
    try { await authApi.mfaResend(mfaToken); setResent(true); setTimeout(() => setResent(false), 3000); }
    catch (e) { setError(e.message ?? 'Failed to resend'); }
    finally { setResending(false); }
  };

  return (
    <div className="auth-view">
      <div style={{ width:48, height:48, borderRadius:12, background:'#DCFCE7', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
        <Shield size={24} style={{ color:C.sage }} />
      </div>
      <div style={{ fontWeight:700, fontSize:20, marginBottom:6, color:C.bark }}>Two-step verification</div>
      <p style={{ color:C.muted, fontSize:14, marginBottom:22, lineHeight:1.5 }}>
        We sent a 6-digit code to <strong style={{ color:C.bark }}>{email}</strong>
      </p>
      <form onSubmit={verify}>
        <Err msg={error} />
        <Field label="Verification code" value={otp} onChange={e => setOtp(e.target.value)} required autoFocus />
        <div style={{ height:6 }} />
        <PrimaryBtn loading={loading}>{loading ? <><Loader size={15} style={{ animation:'spin 1s linear infinite' }}/> Verifying…</> : 'Verify →'}</PrimaryBtn>
      </form>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:16 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', color:C.muted, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:5, padding:0 }}>
          <ArrowLeft size={13}/> Back
        </button>
        <button onClick={resend} disabled={resending} style={{ background:'none', border:'none', color:C.sageMid, fontSize:13, fontWeight:600, cursor:'pointer', padding:0 }}>
          {resent ? '✓ Code resent' : resending ? 'Resending…' : 'Resend code'}
        </button>
      </div>
    </div>
  );
}

// ── SIGN IN ───────────────────────────────────────────────────────────────────
function SignIn({ onForgot, navigate }) {
  const { login, googleSignIn } = useAuth();
  const [form, setForm]   = useState({ email:'', password:'' });
  const [show, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mfa, setMfa]     = useState(null); // { mfaToken, email }
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const go = async (fn) => {
    setError(''); setLoading(true);
    try { const r = await fn(); if (r?.mfaRequired) { setMfa({ mfaToken: r.mfaToken, email: form.email }); } else { navigate('/'); } }
    catch(e) { setError(e.message ?? 'Something went wrong'); }
    finally { setLoading(false); }
  };

  if (mfa) return <MfaChallenge mfaToken={mfa.mfaToken} email={mfa.email} onBack={() => setMfa(null)} navigate={navigate} />;

  return (
    <div className="auth-view">
      <GoogleBtn onToken={t => go(() => googleSignIn(t))} loading={loading} />
      <Or />
      <form onSubmit={e => { e.preventDefault(); go(() => login(form.email, form.password)); }}>
        <Err msg={error} />
        <Field label="Email address" type="email" value={form.email} onChange={set('email')} required />
        <Field label="Password" type={show?'text':'password'} value={form.password} onChange={set('password')} required
          suffix={<button type="button" onClick={() => setShow(s=>!s)} style={{ background:'none', border:'none', color:C.muted, display:'flex', cursor:'pointer', padding:2 }}>{show ? <EyeOff size={16}/> : <Eye size={16}/>}</button>}
        />
        <div style={{ textAlign:'right', marginBottom:18, marginTop:4 }}>
          <button type="button" onClick={onForgot} style={{ background:'none', border:'none', color:C.sageMid, fontSize:13, fontWeight:600, cursor:'pointer', padding:0 }}>
            Forgot password?
          </button>
        </div>
        <PrimaryBtn loading={loading}>{loading ? <><Loader size={15} style={{ animation:'spin 1s linear infinite' }}/> Signing in…</> : 'Sign in'}</PrimaryBtn>
      </form>
    </div>
  );
}

// ── SIGN UP ───────────────────────────────────────────────────────────────────
function SignUp({ navigate }) {
  const { register, googleSignIn } = useAuth();
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const go = async (fn) => { setError(''); setLoading(true); try { await fn(); navigate('/'); } catch(e) { setError(e.message??'Something went wrong'); } finally { setLoading(false); } };

  const submit = e => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    go(() => register(form.name, form.email, form.password));
  };

  return (
    <div className="auth-view">
      <GoogleBtn onToken={t => go(() => googleSignIn(t))} loading={loading} />
      <Or />
      <form onSubmit={submit}>
        <Err msg={error} />
        <Field label="Full name" value={form.name} onChange={set('name')} required minLength={2} autoFocus />
        <Field label="Email address" type="email" value={form.email} onChange={set('email')} required />
        <Field label="Password" type={show?'text':'password'} value={form.password} onChange={set('password')} required minLength={8}
          suffix={<button type="button" onClick={() => setShow(s=>!s)} style={{ background:'none', border:'none', color:C.muted, display:'flex', cursor:'pointer', padding:2 }}>{show ? <EyeOff size={16}/> : <Eye size={16}/>}</button>}
        />
        <Field label="Confirm password" type={show?'text':'password'} value={form.confirm} onChange={set('confirm')} required />
        <div style={{ height:6 }} />
        <PrimaryBtn loading={loading}>{loading ? <><Loader size={15} style={{ animation:'spin 1s linear infinite' }}/> Creating account…</> : 'Create account'}</PrimaryBtn>
      </form>
    </div>
  );
}

// ── FORGOT PASSWORD ───────────────────────────────────────────────────────────
function Forgot({ onBack }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await authApi.forgotPassword(email); setSent(true); }
    catch(e) { setError(e.message??'Failed to send reset email'); }
    finally { setLoading(false); }
  };

  if (sent) return (
    <div className="auth-view" style={{ textAlign:'center', padding:'16px 0' }}>
      <div style={{ width:56, height:56, borderRadius:'50%', background:'#DCFCE7', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
        <CheckCircle size={28} style={{ color:C.sage }} />
      </div>
      <div style={{ fontWeight:700, fontSize:18, marginBottom:8, color:C.bark }}>Check your inbox</div>
      <p style={{ color:C.muted, fontSize:14, lineHeight:1.6, maxWidth:280, margin:'0 auto 24px' }}>
        We sent a reset link to <strong style={{ color:C.bark }}>{email}</strong>. It expires in 30 minutes.
      </p>
      <button onClick={onBack} style={{ background:'none', border:'none', color:C.sageMid, fontWeight:600, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:6, margin:'0 auto' }}>
        <ArrowLeft size={14}/> Back to sign in
      </button>
    </div>
  );

  return (
    <div className="auth-view">
      <button onClick={onBack} style={{ background:'none', border:'none', color:C.muted, fontSize:13, display:'flex', alignItems:'center', gap:5, cursor:'pointer', marginBottom:20, padding:0, fontFamily:'inherit' }}>
        <ArrowLeft size={14}/> Back
      </button>
      <div style={{ width:44, height:44, borderRadius:10, background:'#DCFCE7', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
        <span style={{ fontSize:22 }}>🔑</span>
      </div>
      <div style={{ fontWeight:700, fontSize:20, marginBottom:6, color:C.bark }}>Forgot password?</div>
      <p style={{ color:C.muted, fontSize:14, marginBottom:22, lineHeight:1.5 }}>Enter your email and we'll send you a reset link.</p>
      <form onSubmit={submit}>
        <Err msg={error} />
        <Field label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
        <div style={{ height:6 }} />
        <PrimaryBtn loading={loading}>{loading ? <><Loader size={15} style={{ animation:'spin 1s linear infinite' }}/> Sending…</> : 'Send reset link'}</PrimaryBtn>
      </form>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Login() {
  const navigate  = useNavigate();
  const [view, setView] = useState('signin');

  const FEATURES = [
    { icon:'🎓', text:'Expert-led learning modules' },
    { icon:'📈', text:'Track your child\'s progress' },
    { icon:'💬', text:'Ask Dr. Gad directly' },
  ];

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .auth-view { animation: fadeUp .22s ease; }
        .auth-tab { transition: background .15s, color .15s, box-shadow .15s; }
        .auth-shell { display:flex; min-height:100vh; }
        .auth-brand { width:420px; flex-shrink:0; position:relative; overflow:hidden;
          background:linear-gradient(160deg,#1B5E3B 0%,#0F3A22 100%);
          display:flex; flex-direction:column; justify-content:center; padding:48px 40px; }
        .auth-form-wrap { flex:1; display:flex; align-items:center; justify-content:center;
          background:#F3F6F3; padding:32px 20px; overflow-y:auto; }
        .auth-card { width:100%; max-width:390px; }
        .auth-tabs { display:flex; background:#E4EDE4; border-radius:10px; padding:4px; margin-bottom:24px; }
        .google-btn:hover:not(:disabled) { box-shadow:0 2px 8px rgba(0,0,0,.14); border-color:#BDBDBD; }
        .google-btn:active:not(:disabled) { box-shadow:0 1px 2px rgba(0,0,0,.08); }
        @media (max-width:780px) {
          .auth-shell { flex-direction:column; }
          .auth-brand { width:100% !important; padding:28px 24px; min-height:0 !important; }
          .auth-brand-features { display:none !important; }
          .auth-brand-tagline { display:none !important; }
          .auth-brand-logo-text { font-size:20px !important; }
          .auth-form-wrap { padding:28px 16px; }
        }
      `}</style>

      <div className="auth-shell">

        {/* ── Brand panel ── */}
        <div className="auth-brand">
          <BotanicalCanvas />
          <div style={{ position:'relative', zIndex:1 }}>
            {/* Logo */}
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:36 }}>
              <img src="/logo.png" alt="Kunga Basics"
                style={{ width:46, height:46, borderRadius:12, flexShrink:0, boxShadow:'0 2px 12px rgba(0,0,0,.25)' }}
                onError={e => { e.target.style.display='none'; }} />
              <div>
                <div className="auth-brand-logo-text" style={{ color:'#fff', fontWeight:800, fontSize:22, lineHeight:1.1, letterSpacing:-.3 }}>Kunga Basics</div>
                <div style={{ color:'rgba(255,255,255,.55)', fontSize:12, marginTop:2, fontWeight:500 }}>Learning Portal</div>
              </div>
            </div>

            {/* Headline */}
            <div className="auth-brand-tagline" style={{ marginBottom:36 }}>
              <div style={{ color:'#fff', fontWeight:800, fontSize:28, lineHeight:1.25, letterSpacing:-.4, marginBottom:12, textWrap:'balance' }}>
                Nurturing every<br/>milestone, together.
              </div>
              <div style={{ color:'rgba(255,255,255,.60)', fontSize:14, lineHeight:1.6 }}>
                A learning platform built for parents who want expert guidance, not guesswork.
              </div>
            </div>

            {/* Feature list */}
            <div className="auth-brand-features">
              {FEATURES.map(({ icon, text }) => (
                <div key={text} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ width:36, height:36, borderRadius:9, background:'rgba(255,255,255,.13)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                    {icon}
                  </div>
                  <span style={{ color:'rgba(255,255,255,.82)', fontSize:14, fontWeight:500 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Form panel ── */}
        <div className="auth-form-wrap">
          <div className="auth-card">

            {/* Heading */}
            <div style={{ marginBottom:24 }}>
              {view === 'forgot' ? null : (
                <>
                  <div style={{ fontWeight:800, fontSize:24, color:C.bark, letterSpacing:-.4, marginBottom:4 }}>
                    {view === 'signin' ? 'Welcome back' : 'Create account'}
                  </div>
                  <div style={{ color:C.muted, fontSize:14 }}>
                    {view === 'signin' ? 'Sign in to continue your learning journey.' : 'Join thousands of families on Kunga Basics.'}
                  </div>
                </>
              )}
            </div>

            {/* Tab switcher (only for signin/signup) */}
            {view !== 'forgot' && (
              <div className="auth-tabs">
                {[['signin','Sign in'],['signup','Create account']].map(([v, label]) => (
                  <button key={v} className="auth-tab" onClick={() => setView(v)}
                    style={{
                      flex:1, padding:'8px 0', border:'none', borderRadius:8, cursor:'pointer',
                      background: view===v ? '#fff' : 'transparent',
                      fontWeight: view===v ? 700 : 500,
                      fontSize:13, color: view===v ? C.sage : C.muted,
                      boxShadow: view===v ? '0 1px 3px rgba(0,0,0,.09)' : 'none',
                      fontFamily:'inherit',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Views */}
            {view === 'signin' && <SignIn onForgot={() => setView('forgot')} navigate={navigate} />}
            {view === 'signup' && <SignUp navigate={navigate} />}
            {view === 'forgot' && <Forgot onBack={() => setView('signin')} />}

            {/* Footer */}
            <div style={{ marginTop:28, paddingTop:20, borderTop:`1px solid ${C.border}`, textAlign:'center', fontSize:12, color:C.muted, lineHeight:1.6 }}>
              By continuing, you agree to Kunga Basics'{' '}
              <a href="https://kungabasics.com/terms" style={{ color:C.sageMid, fontWeight:600 }}>Terms</a>
              {' '}and{' '}
              <a href="https://kungabasics.com/privacy" style={{ color:C.sageMid, fontWeight:600 }}>Privacy Policy</a>.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
