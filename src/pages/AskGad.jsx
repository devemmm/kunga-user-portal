import { useEffect, useState, useRef, useCallback } from 'react';
import { askGadApi } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useLang } from '../lib/i18n.jsx';
import {
  MessageCircle, Send, Clock, CheckCircle, AlertCircle,
  Loader, Lock, Paperclip, X, Video, Image, Play,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG_KEYS = {
  PENDING:   { tKey: 'askGad.statusPending',   color: '#d97706', bg: '#fef3c7', icon: Clock },
  IN_REVIEW: { tKey: 'askGad.statusInReview',  color: '#7c3aed', bg: '#ede9fe', icon: Clock },
  ANSWERED:  { tKey: 'askGad.statusAnswered',  color: '#16a34a', bg: '#dcfce7', icon: CheckCircle },
  RESPONDED: { tKey: 'askGad.statusAnswered',  color: '#16a34a', bg: '#dcfce7', icon: CheckCircle },
  ESCALATED: { tKey: 'askGad.statusEscalated', color: '#dc2626', bg: '#fee2e2', icon: AlertCircle },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function childAgeFromDob(dob) {
  if (!dob) return '';
  const birth = new Date(dob);
  if (isNaN(birth)) return '';
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  const age = months < 0 || (months === 0 && now.getDate() < birth.getDate()) ? years - 1 : years;
  return age > 0 ? `${age} year${age !== 1 ? 's' : ''}` : '';
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function isVideo(file) { return file?.type?.startsWith('video/'); }
function isImage(file) { return file?.type?.startsWith('image/'); }

// ── Media preview ─────────────────────────────────────────────────────────────
function MediaPreview({ file, previewUrl, onRemove, onReplace, uploading, uploadProgress }) {
  const video = isVideo(file);
  const image = isImage(file);

  return (
    <div style={{
      border: '1.5px solid var(--border)', borderRadius: 12,
      overflow: 'hidden', background: 'var(--bg)', marginBottom: 14,
    }}>
      {/* Preview area */}
      {image && previewUrl && (
        <div style={{ position: 'relative', maxHeight: 220, overflow: 'hidden', background: '#000' }}>
          <img src={previewUrl} alt="preview" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', display: 'block' }} />
        </div>
      )}
      {video && previewUrl && (
        <div style={{ position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140 }}>
          <video src={previewUrl} style={{ maxHeight: 140, maxWidth: '100%' }} />
          <div style={{ position: 'absolute', width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play size={20} fill="#fff" color="#fff" />
          </div>
        </div>
      )}

      {/* Upload progress bar */}
      {uploading && (
        <div style={{ height: 3, background: 'var(--border)' }}>
          <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--green)', transition: 'width .2s' }} />
        </div>
      )}

      {/* File info row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: video ? '#ede9fe' : '#e0f2fe',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {video ? <Video size={18} style={{ color: '#7c3aed' }} /> : <Image size={18} style={{ color: '#0284c7' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
            {formatFileSize(file.size)}
            {uploading && <span style={{ marginLeft: 8, color: 'var(--green)', fontWeight: 600 }}>Uploading {uploadProgress}%…</span>}
            {!uploading && uploadProgress === 100 && <span style={{ marginLeft: 8, color: 'var(--green)', fontWeight: 600 }}>✓ Ready</span>}
          </div>
        </div>
        {!uploading && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button type="button" onClick={onReplace}
              style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', background: 'var(--border-light)', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
              Change
            </button>
            <button type="button" onClick={onRemove}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 4, display: 'flex', alignItems: 'center' }}>
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AskGad() {
  const { user, childProfile } = useAuth();
  const { t } = useLang();
  const fileInputRef = useRef(null);

  const [questions,      setQuestions]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [submitting,     setSubmitting]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading,      setUploading]      = useState(false);

  const [questionText, setQuestionText] = useState('');
  const [mediaFile,    setMediaFile]    = useState(null);   // File object
  const [previewUrl,   setPreviewUrl]   = useState(null);   // local blob URL
  const [uploadedKey,  setUploadedKey]  = useState(null);   // R2 key after upload

  const [showForm, setShowForm] = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const isPremium = ['ACTIVE', 'TRIAL', 'active', 'trial'].includes(user?.subscriptionStatus);

  const childName = childProfile?.name ?? childProfile?.fullName ?? childProfile?.childName ?? '';
  const childAge  = childProfile?.age
    ? `${childProfile.age} year${childProfile.age !== 1 ? 's' : ''}`
    : childAgeFromDob(childProfile?.dateOfBirth ?? childProfile?.dob);

  useEffect(() => {
    if (!isPremium) { setLoading(false); return; }
    askGadApi.list()
      .then(d => setQuestions(Array.isArray(d) ? d : (d?.questions ?? d?.submissions ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isPremium]);

  // Cleanup blob URLs on unmount
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const resetForm = () => {
    setQuestionText('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setMediaFile(null);
    setPreviewUrl(null);
    setUploadedKey(null);
    setUploadProgress(0);
    setError('');
  };

  // Upload the file immediately when selected
  const handleFileSelect = useCallback(async (file) => {
    if (!file) return;

    // Basic validation
    const MAX_VIDEO = 100 * 1024 * 1024; // 100 MB
    const MAX_IMAGE = 10  * 1024 * 1024; // 10 MB
    if (isVideo(file) && file.size > MAX_VIDEO) { setError('Video must be under 100 MB'); return; }
    if (isImage(file) && file.size > MAX_IMAGE) { setError('Image must be under 10 MB');  return; }

    // Reset previous
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setMediaFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadedKey(null);
    setUploadProgress(0);
    setError('');

    // Proxy upload: browser → API → MinIO (no CORS issues)
    setUploading(true);
    try {
      const { key } = await askGadApi.uploadMedia(file, (pct) => setUploadProgress(pct));
      setUploadedKey(key);
      setUploadProgress(100);
    } catch (err) {
      setError(`Media upload failed: ${err.message}`);
      setMediaFile(null);
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }, [previewUrl]);

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = ''; // reset so same file can be re-selected
  };

  const removeMedia = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setMediaFile(null);
    setPreviewUrl(null);
    setUploadedKey(null);
    setUploadProgress(0);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    if (mediaFile && uploading) { setError('Please wait for the upload to finish.'); return; }
    if (mediaFile && !uploadedKey) { setError('Media upload failed — please remove and try again.'); return; }

    setError('');
    setSubmitting(true);
    try {
      const payload = { questionText: questionText.trim() };
      if (uploadedKey) payload.videoR2Key = uploadedKey;

      const q = await askGadApi.submit(payload);
      setQuestions(prev => [q?.submission ?? q, ...prev]);
      resetForm();
      setShowForm(false);
      setSuccess('Your question has been submitted! Dr. Gad will respond soon.');
      setTimeout(() => setSuccess(''), 6000);
    } catch (err) {
      setError(err?.data?.message ?? err.message ?? 'Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Paywall ──────────────────────────────────────────────────────────────────
  if (!isPremium) return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{t('askGad.title')}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{t('askGad.subtitle')}</p>
      </div>
      <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <Lock size={36} style={{ color: 'var(--muted)', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t('askGad.locked')}</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 300, margin: '0 auto 20px' }}>{t('askGad.lockedDesc')}</p>
        <Link to="/payments" style={{ display: 'inline-block', background: 'var(--green)', color: '#fff', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
          {t('askGad.upgrade')}
        </Link>
      </div>
    </div>
  );

  // ── Main ─────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*"
        style={{ display: 'none' }}
        onChange={onFileInputChange}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{t('askGad.title')}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{t('askGad.subtitle')}</p>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); if (showForm) resetForm(); }}
          style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
        >
          <Send size={14} /> {t('askGad.newQuestion')}
        </button>
      </div>

      {/* Success banner */}
      {success && (
        <div style={{ background: 'var(--green-light)', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', color: 'var(--green-dark)', fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
          {success}
        </div>
      )}

      {/* ── Form ── */}
      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{t('askGad.formTitle')}</h2>
          <form onSubmit={submit}>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}

            {/* Child info */}
            {(childName || childAge) && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--green-light)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 22 }}>👶</div>
                <div>
                  {childName && <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{childName}</div>}
                  {childAge  && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{childAge}</div>}
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>from profile</div>
              </div>
            )}

            {/* Question textarea */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                {t('askGad.question')} *
              </label>
              <textarea
                required
                value={questionText}
                onChange={e => setQuestionText(e.target.value)}
                placeholder={t('askGad.placeholder')}
                rows={5}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* Media attachment */}
            {mediaFile ? (
              <MediaPreview
                file={mediaFile}
                previewUrl={previewUrl}
                uploading={uploading}
                uploadProgress={uploadProgress}
                onRemove={removeMedia}
                onReplace={() => fileInputRef.current?.click()}
              />
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px', marginBottom: 16,
                  border: '1.5px dashed var(--border)', borderRadius: 10,
                  background: 'var(--bg)', color: 'var(--muted)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'border-color .15s, color .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.color = 'var(--green)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
              >
                <Paperclip size={15} />
                Attach video or image <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 4 }}>(optional)</span>
              </button>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="submit"
                disabled={submitting || uploading || !questionText.trim()}
                style={{
                  background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8,
                  padding: '10px 20px', fontWeight: 600, fontSize: 14,
                  display: 'flex', alignItems: 'center', gap: 6,
                  opacity: (submitting || uploading || !questionText.trim()) ? .6 : 1,
                  cursor: (submitting || uploading || !questionText.trim()) ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting
                  ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> {t('askGad.sending')}</>
                  : uploading
                    ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Uploading…</>
                    : <><Send size={14} /> {t('askGad.submitBtn')}</>}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 20px', fontWeight: 600, fontSize: 14, color: 'var(--text)', cursor: 'pointer' }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Questions list ── */}
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
            const hasMedia = q.videoR2Key || q.fileUrl || q.mediaUrl;
            return (
              <div key={q.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
                      <StatusIcon size={11} /> {t(cfg.tKey)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {hasMedia && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--muted)' }}>
                          <Paperclip size={11} /> media
                        </span>
                      )}
                      {q.createdAt && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(q.createdAt).toLocaleDateString()}</div>}
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.55, margin: 0 }}>{q.questionText ?? q.body}</p>
                </div>
                {(q.responseText || q.response) && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px', background: 'var(--green-light)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>{t('askGad.response')}</div>
                    <p style={{ fontSize: 13, margin: 0, lineHeight: 1.55 }}>{q.responseText ?? q.response}</p>
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
  color: 'var(--text)', boxSizing: 'border-box',
};
