// UGC Video Studio - Mini App (Supabase + auth, Vercel-ready)
// Express + fal.ai REST + Supabase storage + admin auth + STATELESS polling.
// Background worker YOK — frontend her işi /api/jobs/:id/refresh ile ilerletir (serverless uyumlu).

require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 3000;
const FAL_KEY = process.env.FAL_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const AUTH_SECRET = process.env.AUTH_SECRET || '';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const SESSION_HOURS = 12;

const missing = [];
if (!FAL_KEY) missing.push('FAL_KEY');
if (!SUPABASE_URL) missing.push('SUPABASE_URL');
if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
if (!AUTH_SECRET) missing.push('AUTH_SECRET');
if (missing.length) {
  console.error(`\n[ERROR] Eksik ortam değişkenleri: ${missing.join(', ')}. .env dosyasını kontrol et.\n`);
  // Vercel'de process.exit yerine route'lar 500 döndürür; local'de erken çık.
  if (require.main === module) process.exit(1);
}

// SUPABASE_URL'i normalize et: çevredeki tırnak/boşlukları at, şema yoksa https:// ekle.
// (Geçersiz URL createClient'i throw ettirir ve tüm serverless fonksiyonu çökertir → 500.)
function normalizeSupabaseUrl(u) {
  let s = String(u || '').trim().replace(/^['"]+|['"]+$/g, '').trim();
  if (s && !/^https?:\/\//i.test(s)) s = 'https://' + s;
  return s;
}

let supabaseConfigError = null;
let supabase;
try {
  supabase = createClient(normalizeSupabaseUrl(SUPABASE_URL) || 'http://localhost', SUPABASE_SERVICE_ROLE_KEY || 'none', {
    auth: { persistSession: false, autoRefreshToken: false }
  });
} catch (e) {
  // Modül yüklemesini çökertme; route'lar net bir hata döndürsün.
  supabaseConfigError = e.message;
  console.error('[supabase] createClient hatası:', e.message);
  supabase = createClient('http://localhost', 'none', { auth: { persistSession: false, autoRefreshToken: false } });
}

// === Şifre hashleme (scrypt, ek paket yok) ===
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(pw, stored) {
  try {
    const [salt, hash] = String(stored).split(':');
    const test = crypto.scryptSync(pw, salt, 64).toString('hex');
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(test, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch { return false; }
}

// === İmzalı oturum çerezi (HMAC, stateless — Vercel uyumlu) ===
function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}
function verifyToken(token) {
  if (!token) return null;
  const [data, sig] = String(token).split('.');
  if (!data || !sig) return null;
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch { return null; }
}
function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  const part = raw.split(';').map(s => s.trim()).find(s => s.startsWith(name + '='));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : null;
}

// Bootstrap: .env'deki admin'i DB'de yoksa oluştur (ilk kurulum kolaylığı)
let bootstrapDone = false;
async function ensureAdmin() {
  if (bootstrapDone || !ADMIN_USERNAME || !ADMIN_PASSWORD) return;
  bootstrapDone = true;
  try {
    const { data } = await supabase.from('ugc_admin_users').select('id').eq('username', ADMIN_USERNAME).maybeSingle();
    if (!data) {
      await supabase.from('ugc_admin_users').insert({ username: ADMIN_USERNAME, password_hash: hashPassword(ADMIN_PASSWORD) });
      console.log(`[auth] admin kullanıcısı '${ADMIN_USERNAME}' oluşturuldu.`);
    }
  } catch (e) {
    console.error('[auth] ensureAdmin hatası:', e.message);
  }
}

// === Model seçimi (SKILL.md karar ağacının aynısı) ===
const MODELS = {
  ekonomik:  { endpoint: 'fal-ai/veo3.1/lite/image-to-video', pricePerSec: 0.05, family: 'veo' },
  standart:  { endpoint: 'fal-ai/veo3.1/fast/image-to-video', pricePerSec: 0.15, family: 'veo' },
  premium:   { endpoint: 'fal-ai/veo3.1/image-to-video',      pricePerSec: 0.40, family: 'veo' },
  uzun:      { endpoint: 'bytedance/seedance-2.0/fast/image-to-video', pricePerSec: 0.10, family: 'seedance' }
};
const MODELS_T2V = {
  ekonomik:  { endpoint: 'fal-ai/veo3.1/fast', pricePerSec: 0.15, family: 'veo' },
  standart:  { endpoint: 'fal-ai/veo3.1/fast', pricePerSec: 0.15, family: 'veo' },
  premium:   { endpoint: 'fal-ai/veo3.1',      pricePerSec: 0.40, family: 'veo' },
  uzun:      { endpoint: 'bytedance/seedance-2.0/fast/text-to-video', pricePerSec: 0.10, family: 'seedance' }
};
const SUBTITLE_ENDPOINT = 'fal-ai/workflow-utilities/auto-subtitle';

function pickModel(level, hasImage, duration) {
  const dur = parseInt(String(duration).replace('s', ''), 10);
  if (dur > 8) level = 'uzun';
  const table = hasImage ? MODELS : MODELS_T2V;
  return { level, ...table[level] };
}
function estimateCost(level, duration) {
  const dur = parseInt(String(duration).replace('s', ''), 10);
  const m = pickModel(level, true, duration);
  const video = m.pricePerSec * dur;
  const subtitle = 0.03 * (dur / 60);
  return { video: +video.toFixed(2), subtitle: +subtitle.toFixed(3), total: +(video + subtitle).toFixed(2) };
}

// === fal.ai REST yardımcıları ===
async function falSubmit(endpoint, body) {
  const res = await fetch(`https://queue.fal.run/${endpoint}`, {
    method: 'POST',
    headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal submit ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}
async function falStatus(endpoint, requestId) {
  const base = endpoint.split('/').slice(0, 2).join('/');
  const res = await fetch(`https://queue.fal.run/${base}/requests/${requestId}/status`, {
    headers: { 'Authorization': `Key ${FAL_KEY}` }
  });
  if (!res.ok) throw new Error(`fal status ${res.status}`);
  return res.json();
}
async function falResult(endpoint, requestId) {
  const base = endpoint.split('/').slice(0, 2).join('/');
  const res = await fetch(`https://queue.fal.run/${base}/requests/${requestId}`, {
    headers: { 'Authorization': `Key ${FAL_KEY}` }
  });
  return { ok: res.ok, status: res.status, body: res.ok ? await res.json() : await res.text() };
}
async function falUpload(filePath, mimeType, fileName) {
  const initRes = await fetch('https://rest.alpha.fal.ai/storage/upload/initiate', {
    method: 'POST',
    headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_name: fileName, content_type: mimeType })
  });
  if (!initRes.ok) throw new Error(`fal upload initiate ${initRes.status}`);
  const { upload_url, file_url } = await initRes.json();
  const buffer = fs.readFileSync(filePath);
  const putRes = await fetch(upload_url, { method: 'PUT', headers: { 'Content-Type': mimeType }, body: buffer });
  if (!putRes.ok) throw new Error(`fal upload PUT ${putRes.status}`);
  return file_url;
}

// === Prompt üretici ===
const STYLE_PRESETS = {
  'samimi-itiraf': 'Vertical handheld selfie-style video. A relatable woman in her late 20s in a soft home setting, talking to camera with a warm sincere casual tone. Natural daylight, slight handheld shake. First 2 seconds: an honest attention-grabbing opener. Authentic, unpolished, trustworthy mood.',
  'heyecanli-kesif': 'Vertical handheld video, energetic and bright. A person excitedly opens packaging, quick close-ups, genuine surprise on their face. Dynamic but smooth camera, vibrant lighting. First 2 seconds: the box with an excited reaction.',
  'problem-cozum': 'Vertical video. Opens on a relatable everyday frustration shown in first 2 seconds with slightly annoyed expression. Then product appears and mood shifts to relief and satisfaction. Handheld, natural light, expressive face.',
  'sokak-roportaji': 'Vertical street-interview style on a busy sidewalk. Casual candid mood. A passerby answers naturally and positively, authentic reactions. Handheld documentary feel, natural outdoor light, blurred city background.',
  'luks-estetik': 'Vertical cinematic video, premium aesthetic. Slow elegant camera movement. Macro detail shots, soft directional lighting, refined color grading, shallow depth of field. Minimal sophisticated mood. Luxurious aspirational atmosphere with subtle ambient sound.',
  'komik-eglenceli': 'Vertical video, comedic and exaggerated. An over-the-top funny scenario, expressive acting, playful timing, bright energetic look. First 2 seconds: an unexpected humorous hook. Light, funny, shareable mood.',
  'uzman-tavsiyesi': 'Vertical video, credible and clean look. A knowledgeable trustworthy person in a professional-but-approachable setting, steady camera, soft professional lighting, confident posture. First 2 seconds: an authority-building opener.',
  'once-sonra': 'Vertical video showing a clear before-and-after transformation. First 2 seconds: the "before" state with a hook line. Then product is introduced, transitioning to the improved "after" state. Handheld, natural light, honest framing. Convincing results-driven mood.'
};
function buildPrompt({ product, benefit, style, dialog, image }) {
  const styleBlock = STYLE_PRESETS[style] || STYLE_PRESETS['samimi-itiraf'];
  // Görsel varsa: prompt görseli EZMESİN — referans görseli ana özne yap.
  const refLine = image
    ? 'IMPORTANT: Use the provided reference image as the exact subject and first frame. Keep the product, clothing, colors and scene from the reference image faithfully; only add natural motion and the spoken line. Do not invent a different product or person.'
    : '';
  const productLine = product ? `The video promotes ${product}.` : '';
  const benefitLine = benefit ? `Key message: ${benefit}.` : '';
  const dialogLine = dialog
    ? `Spoken softly in Turkish (native Turkish accent, warm natural tone, clear pronunciation):\n"${dialog}"`
    : 'A single short authentic line is spoken softly in Turkish with a warm natural tone about the product.';
  return [refLine, styleBlock, productLine, benefitLine, dialogLine,
    'Subtle natural ambient sound, no background music. Photorealistic. No on-screen text, no captions, no subtitles.'
  ].filter(Boolean).join('\n\n');
}

// === Express ===
const app = express();
app.use(express.json({ limit: '2mb' }));

const upload = multer({ dest: os.tmpdir(), limits: { fileSize: 25 * 1024 * 1024 } });

// --- Auth middleware: /api/* (login & health hariç) korumalı ---
function requireAuth(req, res, next) {
  const payload = verifyToken(getCookie(req, 'ugc_session'));
  if (!payload) return res.status(401).json({ error: 'unauthorized' });
  req.user = payload;
  next();
}

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    fal: FAL_KEY ? 'present' : 'missing',
    supabase: SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing',
    supabaseUrl: SUPABASE_URL ? 'present' : 'missing',
    authSecret: AUTH_SECRET ? 'present' : 'missing',
    configError: supabaseConfigError || null
  });
});

app.post('/api/login', async (req, res) => {
  try {
    await ensureAdmin();
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    const { data, error } = await supabase.from('ugc_admin_users').select('username, password_hash').eq('username', username).maybeSingle();
    if (error) return res.status(500).json({ error: 'DB hatası: ' + error.message });
    if (!data || !verifyPassword(password, data.password_hash)) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
    }
    const token = signToken({ u: username, exp: Date.now() + SESSION_HOURS * 3600 * 1000 });
    const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `ugc_session=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${SESSION_HOURS * 3600}; SameSite=Lax${secure}`);
    res.json({ ok: true, username });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'ugc_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  const payload = verifyToken(getCookie(req, 'ugc_session'));
  if (!payload) return res.status(401).json({ error: 'unauthorized' });
  res.json({ username: payload.u });
});

app.get('/api/cost', requireAuth, (req, res) => {
  const { level = 'standart', duration = '8s' } = req.query;
  res.json(estimateCost(level, duration));
});

app.post('/api/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Dosya yok' });
    const url = await falUpload(req.file.path, req.file.mimetype, req.file.originalname);
    fs.unlinkSync(req.file.path);
    res.json({ url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/produce', requireAuth, async (req, res) => {
  try {
    const { product, benefit, style = 'samimi-itiraf', level = 'standart', duration = '8s', dialog = '', imageUrl = '' } = req.body || {};
    if (!product) return res.status(400).json({ error: 'Ürün/marka zorunlu' });

    const model = pickModel(level, !!imageUrl, duration);
    const isSeedance = model.family === 'seedance';
    const prompt = buildPrompt({ product, benefit, style, dialog, image: imageUrl });

    let endpoint, payload;
    if (imageUrl) {
      endpoint = model.endpoint;
      if (isSeedance) {
        payload = { image_url: imageUrl, prompt, aspect_ratio: '9:16', duration: String(parseInt(duration, 10)), resolution: '1080p', generate_audio: true };
      } else {
        payload = { image_url: imageUrl, prompt, aspect_ratio: '9:16', resolution: '1080p', duration: duration.endsWith('s') ? duration : duration + 's', generate_audio: true, negative_prompt: 'on-screen text, captions, subtitles, watermark', safety_tolerance: '4', auto_fix: true };
      }
    } else {
      endpoint = MODELS_T2V[isSeedance ? 'uzun' : level].endpoint;
      if (isSeedance) {
        payload = { prompt, aspect_ratio: '9:16', duration: String(parseInt(duration, 10)), resolution: '720p', generate_audio: true };
      } else {
        payload = { prompt, aspect_ratio: '9:16', resolution: '1080p', duration: duration.endsWith('s') ? duration : duration + 's', generate_audio: true, negative_prompt: 'on-screen text, captions, subtitles', safety_tolerance: '4', auto_fix: true };
      }
    }

    const submitRes = await falSubmit(endpoint, payload);
    const jobId = crypto.randomBytes(8).toString('hex');
    const job = {
      id: jobId,
      product, benefit, style, level, duration, dialog,
      image_url: imageUrl || null,
      endpoint,
      request_id: submitRes.request_id,
      status: 'generating',
      cost: estimateCost(level, duration)
    };
    const { error } = await supabase.from('ugc_jobs').insert(job);
    if (error) return res.status(500).json({ error: 'DB insert: ' + error.message });
    res.json({ jobId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/jobs', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('ugc_jobs').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.delete('/api/jobs/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('ugc_jobs').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// STATELESS ilerletme: frontend bitmemiş işler için periyodik çağırır.
// Her çağrı tek bir adım ilerletir (video bekle → altyazı başlat → altyazı bekle → bitir).
app.post('/api/jobs/:id/refresh', requireAuth, async (req, res) => {
  try {
    const { data: job, error } = await supabase.from('ugc_jobs').select('*').eq('id', req.params.id).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!job) return res.status(404).json({ error: 'not found' });

    async function patch(fields) {
      await supabase.from('ugc_jobs').update(fields).eq('id', job.id);
      return { ...job, ...fields };
    }

    // 1) Video aşaması
    if (job.status === 'queued' || job.status === 'generating') {
      const st = await falStatus(job.endpoint, job.request_id);
      if (st.status === 'IN_PROGRESS' || st.status === 'IN_QUEUE') {
        return res.json(await patch({ status: 'generating' }));
      }
      if (st.status === 'COMPLETED') {
        const r = await falResult(job.endpoint, job.request_id);
        if (!r.ok) {
          if (r.status === 422) {
            // fal'ın gerçek ret sebebini çıkar (içerik moderasyonu / format hatası).
            let detail = '';
            try {
              const j = JSON.parse(String(r.body));
              detail = typeof j.detail === 'string' ? j.detail
                : Array.isArray(j.detail) ? j.detail.map(d => d.msg || d.type || '').filter(Boolean).join('; ')
                : JSON.stringify(j);
            } catch { detail = String(r.body); }
            return res.json(await patch({ status: 'rejected', error: `İçerik/format reddedildi (para kesilmedi). fal: ${String(detail).slice(0, 240) || 'detay yok'}` }));
          }
          if (r.status === 500) return res.json(await patch({ status: 'mcp_error', error: 'Video üretildi ama sonuç alınamadı. fal.ai/dashboard/requests adresinden kontrol et.' }));
          return res.json(await patch({ status: 'error', error: `Sonuç ${r.status}: ${String(r.body).slice(0, 150)}` }));
        }
        const videoUrl = r.body?.video?.url;
        if (!videoUrl) return res.json(await patch({ status: 'error', error: 'Sonuçta video URL yok' }));
        // Altyazı işini başlat
        const sub = await falSubmit(SUBTITLE_ENDPOINT, {
          video_url: videoUrl, language: 'tr', font_name: 'Montserrat', font_size: 90,
          font_weight: 'bold', font_color: 'white', highlight_color: 'yellow',
          stroke_width: 3, stroke_color: 'black', position: 'bottom', words_per_subtitle: 2, enable_animation: true
        });
        return res.json(await patch({ status: 'subtitling', video_url: videoUrl, subtitle_request_id: sub.request_id }));
      }
      return res.json(await patch({ status: 'error', error: `Beklenmeyen durum: ${st.status}` }));
    }

    // 2) Altyazı aşaması
    if (job.status === 'subtitling') {
      const st = await falStatus(SUBTITLE_ENDPOINT, job.subtitle_request_id);
      if (st.status === 'IN_PROGRESS' || st.status === 'IN_QUEUE') return res.json(job);
      if (st.status === 'COMPLETED') {
        const r = await falResult(SUBTITLE_ENDPOINT, job.subtitle_request_id);
        if (r.ok && r.body?.video?.url) {
          return res.json(await patch({ status: 'completed', subtitled_url: r.body.video.url, transcription: r.body.transcription || null }));
        }
        return res.json(await patch({ status: 'partial', error: 'Altyazı eklenemedi; video altyazısız hazır.' }));
      }
      return res.json(await patch({ status: 'partial', error: `Altyazı durumu ${st.status}; video altyazısız.` }));
    }

    // Bitmiş işler: olduğu gibi dön
    res.json(job);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Statik dosyalar (local dev). Vercel'de public/ otomatik servis edilir.
app.use(express.static(path.join(__dirname, 'public')));

// Local geliştirme sunucusu (Vercel'de bu blok çalışmaz; api/index.js app'i import eder)
if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`\nUGC Video Studio (Supabase) http://localhost:${PORT}\n`);
    await ensureAdmin();
  });
}

module.exports = app;
