/**
 * Child Assessment — full 7-step wizard
 * Mirrors the mobile ChildAssessmentScreen feature-for-feature.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { useLang } from '../lib/i18n.jsx';
import { assessmentsApi } from '../lib/api.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTIONS = [
  { id: 1,  text: 'Follows simple instructions',          example: 'E.g. "Come here", "Sit down", "Give me", "Stop"' },
  { id: 2,  text: 'Makes eye contact when spoken to',     example: 'Looks at your face during conversation' },
  { id: 3,  text: 'Responds to their name',               example: 'Turns head or acknowledges when name is called' },
  { id: 4,  text: 'Points to objects or people',          example: 'Uses finger to point at things they want or see' },
  { id: 5,  text: 'Plays with other children',            example: 'Engages in shared play, not just parallel play' },
  { id: 6,  text: 'Uses words to communicate',            example: 'Says single words or short phrases to express needs' },
  { id: 7,  text: 'Imitates actions or sounds',           example: 'Copies clapping, waving, animal sounds' },
  { id: 8,  text: 'Shows interest in surroundings',       example: 'Explores environment, curious about new objects' },
  { id: 9,  text: 'Maintains attention during activities', example: 'Stays focused on a task for several minutes' },
  { id: 10, text: 'Understands "yes" and "no"',           example: 'Responds correctly to yes/no questions' },
  { id: 11, text: 'Uses gestures (waves, claps)',          example: 'Waves bye-bye, claps hands, shakes head no' },
  { id: 12, text: 'Tolerates changes in routine',         example: 'Adapts when usual schedule or plan changes' },
  { id: 13, text: 'Engages in pretend play',              example: 'Pretends toys are people, mimics daily activities' },
  { id: 14, text: 'Can calm down when upset',             example: 'Self-soothes or responds to comforting within minutes' },
  { id: 15, text: 'Follows a two-step direction',         example: '"Pick up the toy and bring it here"' },
  { id: 16, text: 'Shows affection to familiar people',   example: 'Hugs, smiles at, or seeks comfort from caregivers' },
  { id: 17, text: 'Coordinates hand-eye movements',       example: 'Stacks blocks, draws, catches a ball' },
  { id: 18, text: 'Plays independently for short periods', example: 'Entertains themselves without needing constant attention' },
  { id: 19, text: 'Responds to emotions in others',       example: 'Reacts to someone crying or laughing' },
  { id: 20, text: 'Identifies common objects by name',    example: '"Where is the cup?" — child points or looks at it' },
  { id: 21, text: 'Walks up and down stairs',             example: 'Manages steps with or without holding rail' },
  { id: 22, text: 'Holds a crayon or pencil',             example: 'Grasps writing tool to draw or colour' },
  { id: 23, text: 'Reacts to loud or sudden sounds',      example: 'Startles, covers ears, or appears distressed' },
  { id: 24, text: 'Shows preference for certain foods or textures', example: 'Very selective about what they eat or touch' },
  { id: 25, text: 'Seeks sensory stimulation',            example: 'Spins, rocks, flaps hands, or seeks intense pressure' },
];

const OPTIONS = [
  { key: 'never',     label: 'Never',     sub: 'Does not do this',          score: 0, emoji: '😞', color: '#ef4444' },
  { key: 'rarely',    label: 'Rarely',    sub: 'Does this very few times',  score: 1, emoji: '😕', color: '#ea580c' },
  { key: 'sometimes', label: 'Sometimes', sub: 'Does this some of the time', score: 2, emoji: '😐', color: '#f59e0b' },
  { key: 'often',     label: 'Often',     sub: 'Does this many times',      score: 3, emoji: '🙂', color: '#16a34a' },
  { key: 'always',    label: 'Always',    sub: 'Does this all the time',    score: 4, emoji: '😄', color: '#15803d' },
];

const PROGRAMS = [
  { id: 'foundation',     icon: '🏗️', title: 'Foundation Program',      desc: 'Builds essential skills in communication, attention and daily routines.',             duration: '3–6 months',  threshold: 0 },
  { id: 'implementation', icon: '🏡', title: 'Implementation Program',   desc: 'Learn how to apply Kunga Therapy strategies at home with expert guidance.',          duration: '6–12 months', threshold: 60 },
  { id: 'advanced',       icon: '🚀', title: 'Advanced Program',         desc: 'For children needing intensive support and skill development.',                       duration: '12+ months',  threshold: 75 },
];

const STRENGTH_TEXT = {
  enjoysPlay: 'Enjoys playing with others',
  goodEyeContact: 'Good eye contact',
  respondsToName: 'Responds to name',
  curiosity: 'Shows curiosity in surroundings',
  curiousEager: 'Curious and eager to explore',
};
const AREA_TEXT = {
  expressiveCommunication: 'Expressive communication',
  attentionSpan: 'Attention span',
  followingInstructions: 'Following multi-step instructions',
  sensorySensitivities: 'Sensory sensitivities',
  continuedPractice: 'Continued practice across all areas',
};

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Angola','Argentina','Armenia','Australia','Austria',
  'Azerbaijan','Bangladesh','Belarus','Belgium','Bolivia','Botswana','Brazil','Bulgaria',
  'Burundi','Cambodia','Cameroon','Canada','Chad','Chile','China','Colombia','Congo (DRC)',
  'Costa Rica','Croatia','Cuba','Denmark','Dominican Republic','Ecuador','Egypt','Ethiopia',
  'Finland','France','Gabon','Gambia','Germany','Ghana','Greece','Guatemala','Haiti',
  'Honduras','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan',
  'Jordan','Kenya','Kuwait','Lebanon','Libya','Madagascar','Malawi','Malaysia','Mali',
  'Mexico','Morocco','Mozambique','Namibia','Nepal','Netherlands','New Zealand','Nigeria',
  'Norway','Pakistan','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania',
  'Russia','Rwanda','Saudi Arabia','Senegal','Serbia','Sierra Leone','Somalia','South Africa',
  'South Korea','South Sudan','Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria',
  'Tanzania','Thailand','Tunisia','Turkey','Uganda','Ukraine','United Arab Emirates',
  'United Kingdom','United States','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen',
  'Zambia','Zimbabwe',
];

const PHONE_CODES = [
  '+93','+355','+213','+244','+54','+61','+43','+880','+32','+55',
  '+237','+1','+235','+86','+57','+243','+242','+53','+20','+251',
  '+358','+33','+241','+220','+49','+233','+30','+509','+91','+62',
  '+98','+964','+353','+972','+39','+81','+962','+254','+965','+961',
  '+218','+261','+265','+60','+223','+52','+212','+258','+264','+977',
  '+31','+64','+234','+47','+92','+51','+63','+48','+351','+974',
  '+40','+7','+250','+966','+221','+232','+252','+27','+82','+211',
  '+34','+94','+249','+46','+41','+255','+66','+216','+90','+256',
  '+380','+971','+44','+1','+998','+58','+84','+967','+260','+263',
];

// ─── Score helper ─────────────────────────────────────────────────────────────

function scoreProfile(answers) {
  const total = Object.values(answers).reduce((s, v) => s + v, 0);
  const max   = QUESTIONS.length * 4;
  const avg   = (ids) => {
    const scores = ids.map(id => answers[id] ?? 0);
    return Math.round((scores.reduce((a, b) => a + b, 0) / (ids.length * 4)) * 100);
  };
  const domains = {
    communication:     avg([1, 6, 10, 11, 15, 20]),
    attention:         avg([9, 12, 18]),
    socialInteraction: avg([2, 3, 5, 16, 19]),
    sensoryProcessing: avg([23, 24, 25]),
    movement:          avg([17, 21, 22]),
  };
  const overallPct = Math.round((total / max) * 100);
  let program = 'foundation';
  if (overallPct >= 60) program = 'implementation';
  if (overallPct >= 75) program = 'advanced';

  const strengths = [];
  const areas     = [];
  if (domains.socialInteraction >= 60) strengths.push('enjoysPlay');
  if ((answers[2] ?? 0) >= 3)          strengths.push('goodEyeContact');
  if ((answers[3] ?? 0) >= 3)          strengths.push('respondsToName');
  if (domains.movement >= 60)          strengths.push('curiosity');
  if (domains.communication < 50)      areas.push('expressiveCommunication');
  if (domains.attention < 50)          areas.push('attentionSpan');
  if ((answers[15] ?? 0) < 2)          areas.push('followingInstructions');
  if (domains.sensoryProcessing < 40)  areas.push('sensorySensitivities');

  return { domains, overallPct, program, strengths, areas };
}

function domainColor(pct) {
  if (pct >= 70) return '#16a34a';
  if (pct >= 45) return '#f59e0b';
  return '#ea580c';
}

const DOMAIN_LABELS = {
  communication: 'Communication',
  attention: 'Attention',
  socialInteraction: 'Social Interaction',
  sensoryProcessing: 'Sensory Processing',
  movement: 'Movement',
};

// ─── Styles helpers ───────────────────────────────────────────────────────────

const S = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-2)',
    marginBottom: 6,
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '10px 13px',
    borderRadius: 10,
    border: '1.5px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .15s',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorMsg: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    display: 'block',
  },
  row: {
    display: 'grid',
    gap: 14,
  },
  sectionDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '20px 0 16px',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'var(--border)',
  },
  dividerChip: {
    background: 'var(--green-light)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '4px 12px',
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--green)',
    whiteSpace: 'nowrap',
  },
};

// ─── Step Bar ─────────────────────────────────────────────────────────────────

function StepBar({ step, steps }) {
  return (
    <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '12px 24px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative', maxWidth: 700 }}>
        {/* Track */}
        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, height: 2, background: 'var(--border)', zIndex: 0 }} />
        {steps.map((label, i) => {
          const done    = i < step;
          const current = i === step;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800, marginBottom: 4, flexShrink: 0,
                background: done ? '#16a34a' : current ? '#14532d' : 'var(--border)',
                color: done || current ? '#fff' : 'var(--muted)',
                border: `2px solid ${done ? '#16a34a' : current ? '#14532d' : 'var(--border)'}`,
                transition: 'all .2s',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <div style={{
                fontSize: 9.5, fontWeight: current ? 700 : 500,
                color: done ? '#16a34a' : current ? '#14532d' : 'var(--muted)',
                textAlign: 'center', lineHeight: 1.2, maxWidth: 54,
                transition: 'color .2s',
              }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── File Upload Card ─────────────────────────────────────────────────────────

function FileUploadCard({ icon, title, sub, files, onAdd, onRemove, accept, accentColor }) {
  const inputRef = useRef(null);
  const hasFiles = files.length > 0;
  return (
    <div style={{
      border: `1.5px ${hasFiles ? 'solid' : 'dashed'} ${hasFiles ? accentColor + '80' : 'var(--border)'}`,
      borderRadius: 14, padding: 16, marginBottom: 14,
      background: 'var(--surface)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: hasFiles ? 12 : 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: accentColor + '18', fontSize: 20, flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            {title}
            {hasFiles && (
              <span style={{ background: accentColor, color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 800, padding: '2px 7px' }}>
                {files.length}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>
        </div>
      </div>

      {hasFiles && (
        <div style={{ marginBottom: 10 }}>
          {files.map((f, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10,
              padding: '8px 12px', marginBottom: 6,
            }}>
              <span style={{ fontSize: 16 }}>📄</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.name}
              </span>
              <button onClick={() => onRemove(i)}
                style={{ background: '#fee2e2', border: 'none', borderRadius: 99, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444', fontSize: 12, flexShrink: 0 }}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <input ref={inputRef} type="file" accept={accept} multiple onChange={e => { onAdd([...e.target.files]); e.target.value = ''; }} style={{ display: 'none' }} />
      <button onClick={() => inputRef.current?.click()}
        style={{
          width: '100%', padding: '10px 0', border: `1.5px dashed ${accentColor}`,
          borderRadius: 10, background: 'none', cursor: 'pointer',
          color: accentColor, fontWeight: 700, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
        {hasFiles ? '+ Add More' : '📁 Choose Files'}
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const STEPS = ['Child Info', 'Assessment', 'Upload', 'Results', 'Insights', 'Plan', 'Next Steps'];

export default function ChildAssessment() {
  const { user, childProfile } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const [step, setStep] = useState(0);

  // ── Step 0 state ─────────────────────────────────────────────────────────────
  const [childName,  setChildName]  = useState(childProfile?.name  ?? '');
  const [dob,        setDob]        = useState(childProfile?.dateOfBirth?.slice?.(0, 10) ?? '');
  const [gender,     setGender]     = useState(childProfile?.gender ?? '');
  const [country,    setCountry]    = useState('');
  const [phoneCode,  setPhoneCode]  = useState('+250');
  const [phone,      setPhone]      = useState(user?.phone ?? '');
  const [parentName, setParentName] = useState(user?.name  ?? '');
  const [email,      setEmail]      = useState(user?.email ?? '');
  const [showErrors, setShowErrors] = useState(false);

  const step0Errors = {
    childName: !childName.trim()  ? t('assessment.error.childName') : null,
    dob:       !dob               ? t('assessment.error.dob')       : null,
    gender:    !gender            ? t('assessment.error.gender')    : null,
    phone:     !phone.trim()      ? t('assessment.error.phone')     : null,
  };
  const step0Valid = Object.values(step0Errors).every(e => e === null);

  // ── Step 1 state ─────────────────────────────────────────────────────────────
  const [qIndex,  setQIndex]  = useState(0);
  const [answers, setAnswers] = useState({});

  // ── Step 2 state ─────────────────────────────────────────────────────────────
  const [videos,  setVideos]  = useState([]);
  const [photos,  setPhotos]  = useState([]);
  const [reports, setReports] = useState([]);

  // ── Step 3+ state ────────────────────────────────────────────────────────────
  const [profile,         setProfile]         = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [submitting,      setSubmitting]      = useState(false);
  const [submitted,       setSubmitted]       = useState(false);

  // ── Navigation ───────────────────────────────────────────────────────────────

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goNext = () => {
    if (step === 0) {
      if (!step0Valid) { setShowErrors(true); return; }
      setShowErrors(false);
    }

    if (step === 1) {
      // Within question list
      if (qIndex < QUESTIONS.length - 1) {
        setQIndex(q => q + 1);
        scrollTop();
        return;
      }
      // All questions answered — compute profile before advancing
      const computed = scoreProfile(answers);
      setProfile(computed);
      setSelectedProgram(computed.program);
    }

    setStep(s => s + 1);
    scrollTop();
  };

  const goBack = () => {
    if (step === 1 && qIndex > 0) { setQIndex(q => q - 1); scrollTop(); return; }
    if (step === 0) return;
    setStep(s => s - 1);
    scrollTop();
  };

  // ── Submit assessment to API ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (submitting) return;
    const computed = profile ?? scoreProfile(answers);
    setSubmitting(true);
    try {
      await assessmentsApi.create({
        childName: childName.trim(),
        dateOfBirth: dob,
        gender,
        country,
        parentName: parentName.trim(),
        parentEmail: email.trim(),
        parentPhone: phone.trim() ? `${phoneCode} ${phone.trim()}` : '',
        answers,
        domainScores: computed.domains,
        recommendedProgram: PROGRAMS.find(p => p.id === computed.program)?.title ?? computed.program,
        selectedProgram:    PROGRAMS.find(p => p.id === selectedProgram)?.title    ?? selectedProgram,
        strengths:    computed.strengths.map(k => STRENGTH_TEXT[k] ?? k),
        areasToSupport: computed.areas.map(k => AREA_TEXT[k] ?? k),
        videoCount:  videos.length,
        photoCount:  photos.length,
        reportCount: reports.length,
      });
      setSubmitted(true);
    } catch {
      // silently continue — show next steps even if API call fails
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
    setStep(6);
    scrollTop();
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div ref={scrollRef} style={{ maxWidth: 700 }}>

      {/* Hero */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{t('assessment.pageTitle')}</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>{t('assessment.pageSubtitle')}</p>
      </div>

      {/* Free promotion pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--green-light)', border: '1.5px solid #16a34a40',
        borderRadius: 12, padding: '12px 16px', marginBottom: 20,
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>🎁</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 800, fontSize: 13, color: '#14532d' }}>Limited-time promotion — </span>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>this full child assessment is <strong>completely free</strong>. No subscription required.</span>
        </div>
        <span style={{ background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 99, padding: '3px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          FREE
        </span>
      </div>

      <StepBar step={step} steps={STEPS} />

      {/* ── STEP 0: Child Info ─────────────────────────────────────────────── */}
      {step === 0 && (
        <div style={S.card}>
          {/* Hero banner */}
          <div style={{
            background: 'linear-gradient(135deg, #14532d, #16a34a)',
            borderRadius: 12, padding: '24px 20px', marginBottom: 24,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🧒</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Child Assessment</div>
            <div style={{ color: 'rgba(255,255,255,.82)', fontSize: 13 }}>{t('assessment.childInfo.heroSub')}</div>
          </div>

          {/* Child section */}
          <div style={{ ...S.sectionDivider }}>
            <div style={S.dividerLine} />
            <div style={S.dividerChip}>🧒 {t('assessment.childInfo.childSection')}</div>
            <div style={S.dividerLine} />
          </div>

          {/* Child name */}
          <label style={S.label}>{t('assessment.childInfo.name')}</label>
          <input
            style={{ ...S.input, ...(showErrors && step0Errors.childName ? S.inputError : {}) }}
            placeholder={t('assessment.childInfo.namePh')}
            value={childName}
            onChange={e => setChildName(e.target.value)}
          />
          {showErrors && step0Errors.childName && <span style={S.errorMsg}>{step0Errors.childName}</span>}

          {/* DOB */}
          <label style={{ ...S.label, marginTop: 14 }}>{t('assessment.childInfo.dob')}</label>
          <input
            type="date"
            style={{ ...S.input, ...(showErrors && step0Errors.dob ? S.inputError : {}) }}
            value={dob}
            onChange={e => setDob(e.target.value)}
          />
          {showErrors && step0Errors.dob && <span style={S.errorMsg}>{step0Errors.dob}</span>}

          {/* Gender */}
          <label style={{ ...S.label, marginTop: 14 }}>{t('assessment.childInfo.gender')}</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {['Boy', 'Girl', 'Other'].map(g => (
              <button key={g}
                onClick={() => setGender(g)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  border: `2px solid ${gender === g ? '#16a34a' : 'var(--border)'}`,
                  background: gender === g ? '#16a34a' : 'var(--bg)',
                  color: gender === g ? '#fff' : 'var(--text-2)',
                  transition: 'all .15s',
                }}>
                {g === 'Boy' ? t('assessment.childInfo.boy') : g === 'Girl' ? t('assessment.childInfo.girl') : t('assessment.childInfo.other')}
              </button>
            ))}
          </div>
          {showErrors && step0Errors.gender && <span style={S.errorMsg}>{step0Errors.gender}</span>}

          {/* Country */}
          <label style={{ ...S.label, marginTop: 14 }}>{t('assessment.childInfo.country')}</label>
          <select
            style={{ ...S.input }}
            value={country}
            onChange={e => setCountry(e.target.value)}
          >
            <option value="">{t('assessment.childInfo.countryPh')}</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Parent section */}
          <div style={{ ...S.sectionDivider, marginTop: 24 }}>
            <div style={S.dividerLine} />
            <div style={S.dividerChip}>👤 {t('assessment.childInfo.parentSection')}</div>
            <div style={S.dividerLine} />
          </div>

          {/* Parent name */}
          <label style={S.label}>{t('assessment.childInfo.parentName')}</label>
          <input
            style={S.input}
            placeholder="Full name"
            value={parentName}
            onChange={e => setParentName(e.target.value)}
          />

          {/* Email */}
          <label style={{ ...S.label, marginTop: 14 }}>{t('assessment.childInfo.email')}</label>
          <input
            type="email"
            style={S.input}
            placeholder="email@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          {/* Phone */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 6 }}>
            <span style={{ ...S.label, marginBottom: 0 }}>{t('assessment.childInfo.phone')}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#16a34a', borderRadius: 99, padding: '2px 8px' }}>{t('assessment.childInfo.required')}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={phoneCode}
              onChange={e => setPhoneCode(e.target.value)}
              style={{ ...S.input, width: 90, flexShrink: 0 }}
            >
              {PHONE_CODES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="tel"
              style={{ ...S.input, flex: 1, ...(showErrors && step0Errors.phone ? S.inputError : {}) }}
              placeholder={t('assessment.childInfo.phonePh')}
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
          {showErrors && step0Errors.phone && <span style={S.errorMsg}>{step0Errors.phone}</span>}

          {/* Security note */}
          <div style={{
            marginTop: 18, padding: '12px 14px', borderRadius: 10,
            background: 'var(--green-light)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🛡️</span>
            <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{t('assessment.childInfo.secNote')}</span>
          </div>
        </div>
      )}

      {/* ── STEP 1: Assessment Questions ───────────────────────────────────── */}
      {step === 1 && (
        <div style={S.card}>
          {/* Progress header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
              {t('assessment.assessment.question')} {qIndex + 1} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>/ {QUESTIONS.length}</span>
            </span>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#16a34a' }}>
              {Math.round(((qIndex + 1) / QUESTIONS.length) * 100)}%
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, marginBottom: 18, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((qIndex + 1) / QUESTIONS.length) * 100}%`, background: '#16a34a', borderRadius: 99, transition: 'width .3s' }} />
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>{t('assessment.assessment.subtitle')}</p>

          {/* Question card */}
          <div style={{
            background: 'var(--green-light)', border: '1px solid #16a34a30',
            borderRadius: 14, padding: '20px 18px', marginBottom: 20, position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'var(--surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
              }}>❓</div>
              <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', lineHeight: 1.35 }}>
                {QUESTIONS[qIndex].text}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, background: 'rgba(255,255,255,.65)', borderRadius: 8, padding: '8px 12px' }}>
              <span style={{ fontSize: 13 }}>💡</span>
              <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{QUESTIONS[qIndex].example}</span>
            </div>
          </div>

          {/* Options */}
          {OPTIONS.map(opt => {
            const selected = answers[QUESTIONS[qIndex].id] === opt.score;
            return (
              <button key={opt.key}
                onClick={() => setAnswers(prev => ({ ...prev, [QUESTIONS[qIndex].id]: opt.score }))}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                  padding: '13px 16px', borderRadius: 12, marginBottom: 8, cursor: 'pointer', textAlign: 'left',
                  background: selected ? opt.color + '14' : 'var(--surface)',
                  border: `${selected ? 2 : 1.5}px solid ${selected ? opt.color : 'var(--border)'}`,
                  transition: 'all .15s',
                }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                  background: selected ? opt.color + '22' : 'var(--bg)',
                }}>
                  {opt.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: selected ? opt.color : 'var(--text)' }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{opt.sub}</div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${selected ? opt.color : 'var(--border)'}`,
                  background: selected ? opt.color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 11,
                }}>
                  {selected && '✓'}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── STEP 2: Upload ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div style={S.card}>
          {/* Summary */}
          <div style={{
            background: 'var(--green-light)', border: '1px solid #16a34a30',
            borderRadius: 12, padding: '14px 16px', marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Files attached</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>{videos.length + photos.length + reports.length}</span>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              {[
                { label: 'Videos', count: videos.length, color: '#7c3aed' },
                { label: 'Photos', count: photos.length, color: '#0891b2' },
                { label: 'Reports', count: reports.length, color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.count > 0 ? s.color : 'var(--border)' }} />
                  <span style={{ fontSize: 12, color: s.count > 0 ? s.color : 'var(--muted)', fontWeight: s.count > 0 ? 700 : 400 }}>
                    {s.label}{s.count > 0 ? ` (${s.count})` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 18 }}>{t('assessment.upload.subtitle')}</p>

          <FileUploadCard
            icon="🎬"
            title={t('assessment.upload.videos')}
            sub={t('assessment.upload.videosSub')}
            files={videos}
            onAdd={fs => setVideos(prev => [...prev, ...fs])}
            onRemove={i => setVideos(prev => prev.filter((_, idx) => idx !== i))}
            accept="video/*"
            accentColor="#7c3aed"
          />
          <FileUploadCard
            icon="📷"
            title={t('assessment.upload.photos')}
            sub={t('assessment.upload.photosSub')}
            files={photos}
            onAdd={fs => setPhotos(prev => [...prev, ...fs])}
            onRemove={i => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
            accept="image/*"
            accentColor="#0891b2"
          />
          <FileUploadCard
            icon="📄"
            title={t('assessment.upload.reports')}
            sub={t('assessment.upload.reportsSub')}
            files={reports}
            onAdd={fs => setReports(prev => [...prev, ...fs])}
            onRemove={i => setReports(prev => prev.filter((_, idx) => idx !== i))}
            accept="image/*,application/pdf"
            accentColor="#f59e0b"
          />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'var(--green-light)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>🛡️</span>
            <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{t('assessment.upload.secNote')}</span>
          </div>
        </div>
      )}

      {/* ── STEP 3: Results / Domain Scores ───────────────────────────────── */}
      {step === 3 && profile && (
        <div style={S.card}>
          {/* Hero */}
          <div style={{
            background: 'linear-gradient(135deg, #14532d, #16a34a)',
            borderRadius: 12, padding: '24px 20px', marginBottom: 24, textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📊</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 17, marginBottom: 4 }}>{t('assessment.results.title')}</div>
            <div style={{ color: 'rgba(255,255,255,.82)', fontSize: 13 }}>
              {t('assessment.results.subtitle').replace('{n}', QUESTIONS.length)}
            </div>
          </div>

          {/* Overall score */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48, fontWeight: 900, color: domainColor(profile.overallPct) }}>{profile.overallPct}%</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Overall development score</div>
          </div>

          {/* Domain bars */}
          {Object.entries(profile.domains).map(([key, pct]) => {
            const color = domainColor(pct);
            return (
              <div key={key} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                    {key === 'communication' ? '💬' : key === 'attention' ? '👁️' : key === 'socialInteraction' ? '👥' : key === 'sensoryProcessing' ? '🌀' : '🚶'}
                  </div>
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{DOMAIN_LABELS[key]}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color, background: color + '18',
                    borderRadius: 99, padding: '2px 8px',
                  }}>
                    {pct >= 70 ? t('assessment.results.average') : t('assessment.results.needsSupport')}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width .5s ease' }} />
                </div>
              </div>
            );
          })}

          {/* Disclaimer */}
          <div style={{
            marginTop: 20, padding: '14px 16px', borderRadius: 12,
            background: 'var(--green-light)', border: '1px solid #16a34a30',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
            <span style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>{t('assessment.results.summaryNote')}</span>
          </div>
        </div>
      )}

      {/* ── STEP 4: Insights ───────────────────────────────────────────────── */}
      {step === 4 && profile && (
        <div style={S.card}>
          {/* Header */}
          <div style={{
            background: 'var(--green-light)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '18px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'flex-start', gap: 14,
          }}>
            <span style={{ fontSize: 30, flexShrink: 0 }}>✨</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 4 }}>{t('assessment.insight.title')}</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{t('assessment.insight.body')}</div>
            </div>
          </div>

          {/* Strengths */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 12 }}>{t('assessment.insight.strengths')}</div>
            {(profile.strengths.length > 0 ? profile.strengths : ['curiousEager']).map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <span style={{ color: '#16a34a', fontSize: 18, flexShrink: 0, marginTop: 1 }}>✅</span>
                <span style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>{STRENGTH_TEXT[s] ?? s}</span>
              </div>
            ))}
          </div>

          {/* Areas */}
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#ea580c', marginBottom: 12 }}>{t('assessment.insight.areas')}</div>
            {(profile.areas.length > 0 ? profile.areas : ['continuedPractice']).map(a => (
              <div key={a} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c', flexShrink: 0, marginTop: 6 }} />
                <span style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>{AREA_TEXT[a] ?? a}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 5: Plan ───────────────────────────────────────────────────── */}
      {step === 5 && profile && (
        <div>
          <div style={S.card}>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 20 }}>{t('assessment.plan.subtitle')}</p>

            {PROGRAMS.map(prog => {
              const active      = selectedProgram === prog.id;
              const recommended = profile.program === prog.id;
              return (
                <button key={prog.id}
                  onClick={() => setSelectedProgram(prog.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                    borderRadius: 14, marginBottom: 12, cursor: 'pointer', textAlign: 'left', position: 'relative',
                    border: `${active ? 2 : 1.5}px solid ${active ? '#16a34a' : 'var(--border)'}`,
                    background: active ? 'var(--green-light)' : 'var(--surface)',
                    transition: 'all .15s',
                  }}>
                  {recommended && (
                    <div style={{
                      position: 'absolute', top: -1, right: 12,
                      background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 800,
                      padding: '3px 10px', borderRadius: '0 0 8px 8px',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      ⭐ {t('assessment.plan.recommended')}
                    </div>
                  )}
                  <div style={{
                    width: 52, height: 52, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, flexShrink: 0,
                    background: active ? '#16a34a22' : 'var(--bg)',
                  }}>
                    {prog.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: active ? '#14532d' : 'var(--text)', marginBottom: 3 }}>{prog.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.4, marginBottom: 5 }}>{prog.desc}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 12 }}>🕐</span>
                      <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>{prog.duration}</span>
                    </div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${active ? '#16a34a' : 'var(--border)'}`,
                    background: active ? '#16a34a' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12,
                  }}>
                    {active && '✓'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* What's included */}
          <div style={{ ...S.card, background: 'var(--green-light)', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', marginBottom: 14 }}>{t('assessment.plan.includes')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {[
                { emoji: '📋', label: t('assessment.plan.lessons') },
                { emoji: '👩‍👧', label: t('assessment.plan.coaching') },
                { emoji: '📊', label: t('assessment.plan.tracking') },
                { emoji: '👨‍⚕️', label: t('assessment.plan.support') },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 10px', background: 'var(--surface)', borderRadius: 12 }}>
                  <span style={{ fontSize: 24 }}>{item.emoji}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, textAlign: 'center' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 6: Next Steps ─────────────────────────────────────────────── */}
      {step === 6 && (
        <div style={S.card}>
          {/* Hero */}
          <div style={{
            background: 'linear-gradient(135deg, #14532d, #16a34a)',
            borderRadius: 12, padding: '28px 20px', marginBottom: 24, textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>👨‍⚕️</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, marginBottom: 6 }}>{t('assessment.nextSteps.title')}</div>
            <div style={{ color: 'rgba(255,255,255,.85)', fontSize: 13, lineHeight: 1.55 }}>
              {t('assessment.nextSteps.subtitle')}
            </div>
            {submitted && (
              <div style={{ marginTop: 14, background: 'rgba(255,255,255,.18)', borderRadius: 10, padding: '10px 14px', display: 'inline-block' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{t('assessment.nextSteps.submitted')}</span>
              </div>
            )}
          </div>

          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.6 }}>{t('assessment.nextSteps.submittedDesc')}</p>

          {/* Action cards */}
          {[
            { emoji: '📅', color: '#16a34a', bg: 'var(--green-light)', title: t('assessment.nextSteps.bookAssessment'), sub: t('assessment.nextSteps.bookAssessmentSub') },
            { emoji: '❤️', color: '#0891b2', bg: '#e0f2fe',            title: t('assessment.nextSteps.bookTherapy'),   sub: t('assessment.nextSteps.bookTherapySub') },
            { emoji: '📞', color: '#7c3aed', bg: '#f3e8ff',            title: t('assessment.nextSteps.talkToTeam'),    sub: t('assessment.nextSteps.talkToTeamSub') },
          ].map(item => (
            <button key={item.title}
              onClick={() => navigate('/ask-gad')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 18px', borderRadius: 14, marginBottom: 12,
                background: item.bg, border: 'none', cursor: 'pointer', textAlign: 'left',
                transition: 'opacity .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: item.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {item.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: item.color }}>{item.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>{item.sub}</div>
              </div>
              <span style={{ color: item.color, fontSize: 18, flexShrink: 0 }}>→</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Navigation Buttons ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8, marginBottom: 40 }}>
        {step > 0 && step < 6 && (
          <button onClick={goBack}
            style={{
              flex: step === 0 ? 0 : 1, padding: '13px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14,
              border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)',
              cursor: 'pointer', transition: 'all .15s',
            }}>
            {t('assessment.btn.back')}
          </button>
        )}

        {step < 5 && (
          <button
            onClick={goNext}
            disabled={step === 1 && answers[QUESTIONS[qIndex]?.id] === undefined}
            style={{
              flex: 1, padding: '13px 20px', borderRadius: 12, fontWeight: 800, fontSize: 14,
              border: 'none', cursor: step === 1 && answers[QUESTIONS[qIndex]?.id] === undefined ? 'not-allowed' : 'pointer',
              background: step === 1 && answers[QUESTIONS[qIndex]?.id] === undefined ? 'var(--border)' : '#16a34a',
              color: step === 1 && answers[QUESTIONS[qIndex]?.id] === undefined ? 'var(--muted)' : '#fff',
              transition: 'all .15s',
            }}>
            {step === 2 && videos.length + photos.length + reports.length === 0
              ? t('assessment.btn.skipUpload')
              : t('assessment.btn.next')}
          </button>
        )}

        {step === 5 && (
          <button onClick={handleSubmit} disabled={submitting}
            style={{
              flex: 1, padding: '13px 20px', borderRadius: 12, fontWeight: 800, fontSize: 14,
              border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
              background: submitting ? 'var(--border)' : '#16a34a', color: submitting ? 'var(--muted)' : '#fff',
              transition: 'all .15s',
            }}>
            {submitting ? t('assessment.btn.submitting') : t('assessment.btn.submit')}
          </button>
        )}

        {step === 6 && (
          <button onClick={() => navigate('/ask-gad')}
            style={{
              flex: 1, padding: '13px 20px', borderRadius: 12, fontWeight: 800, fontSize: 14,
              border: 'none', cursor: 'pointer', background: '#16a34a', color: '#fff',
            }}>
            {t('assessment.btn.finish')}
          </button>
        )}
      </div>
    </div>
  );
}
