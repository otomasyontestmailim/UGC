// UGC Video Studio mini-app frontend
// - Akıllı polling: sadece aktif iş varken /api/jobs sorgular, bitince durur.
// - Artımsal (reconcile) render: kartları sıfırdan kurmaz; videolar yeniden indirilmez.
// - Videoyu tıklayınca yükle (bant genişliği tasarrufu).
// - Görsel önizleme + aktif işlerde geçen süre.
// - İş tamamlanınca toast bildirimi.

const els = {
  health: document.getElementById('health'),
  who: document.getElementById('who'),
  logoutBtn: document.getElementById('logoutBtn'),
  product: document.getElementById('product'),
  benefit: document.getElementById('benefit'),
  style: document.getElementById('style'),
  duration: document.getElementById('duration'),
  level: document.getElementById('level'),
  image: document.getElementById('image'),
  imageStatus: document.getElementById('imageStatus'),
  imagePreview: document.getElementById('imagePreview'),
  dialog: document.getElementById('dialog'),
  costTotal: document.getElementById('costTotal'),
  costBreakdown: document.getElementById('costBreakdown'),
  produceBtn: document.getElementById('produceBtn'),
  produceMsg: document.getElementById('produceMsg'),
  jobs: document.getElementById('jobs')
};

let uploadedImageUrl = null;
let uploading = false;
let submitting = false;
let previewUrl = null;              // object URL — bellek sızıntısını önlemek için revoke edilir
const refreshing = new Set();      // aynı işe çift refresh çağrısını önle

const cardEls = new Map();         // job.id -> kart DOM elemanı
const lastStatus = new Map();      // job.id -> önceki durum (toast için)

// 401 gelirse login sayfasına at
function guard(r) {
  if (r.status === 401) { location.href = '/login.html'; throw new Error('unauthorized'); }
  return r;
}

async function init() {
  // Oturum kontrolü
  const me = await fetch('/api/me');
  if (!me.ok) { location.href = '/login.html'; return; }
  const meJson = await me.json();
  els.who.textContent = meJson.username || '';

  checkHealth();
  updateCost();
  const hasActive = await refreshJobs();
  if (hasActive) ensurePolling();
}

els.logoutBtn.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  location.href = '/login.html';
});

async function checkHealth() {
  try {
    const r = await fetch('/api/health');
    const j = await r.json();
    if (j.fal === 'present' && j.supabase === 'present') { els.health.textContent = 'bağlı ✓'; els.health.className = 'health ok'; }
    else { els.health.textContent = 'yapılandırma eksik'; els.health.className = 'health bad'; }
  } catch { els.health.textContent = 'sunucu yok'; els.health.className = 'health bad'; }
}

async function updateCost() {
  try {
    const r = await fetch(`/api/cost?level=${els.level.value}&duration=${els.duration.value}`).then(guard);
    const j = await r.json();
    els.costTotal.textContent = `$${j.total.toFixed(2)}`;
    els.costBreakdown.textContent = `video $${j.video.toFixed(2)} + altyazı $${j.subtitle.toFixed(3)}`;
  } catch {}
}

['change', 'input'].forEach(ev => {
  els.level.addEventListener(ev, updateCost);
  els.duration.addEventListener(ev, updateCost);
});

// Görsel seçilince HEMEN yükle + önizleme göster; bitene kadar Üret kilitli.
els.image.addEventListener('change', async () => {
  const f = els.image.files[0];
  setPreview(f);
  if (!f) { uploadedImageUrl = null; els.imageStatus.textContent = ''; return; }
  uploading = true;
  uploadedImageUrl = null;
  els.imageStatus.textContent = 'Yükleniyor…';
  syncProduceBtn();
  // Görseli beyaz zemine düzleştirip JPEG'e çevir: saydam (alfa kanallı) PNG'ler
  // Veo image-to-video tarafından reddediliyor ("did not generate the expected output").
  let uploadFile = f, uploadName = f.name;
  try {
    const jpg = await fileToJpegBlob(f);
    if (jpg) { uploadFile = jpg; uploadName = (f.name.replace(/\.[^.]+$/, '') || 'gorsel') + '.jpg'; }
  } catch {}
  const fd = new FormData();
  fd.append('file', uploadFile, uploadName);
  try {
    const r = await fetch('/api/upload', { method: 'POST', body: fd }).then(guard);
    const j = await r.json();
    if (j.url) { uploadedImageUrl = j.url; els.imageStatus.textContent = 'Yüklendi ✓ (görselle üretilecek)'; }
    else { els.imageStatus.textContent = 'Yükleme hatası: ' + (j.error || 'bilinmeyen'); }
  } catch (e) {
    if (e.message !== 'unauthorized') els.imageStatus.textContent = 'Yükleme hatası: ' + e.message;
  } finally {
    uploading = false;
    syncProduceBtn();
  }
});

// Görseli beyaz zemin üzerine çizip JPEG blob'una çevirir (alfa/saydamlık kaldırılır).
function fileToJpegBlob(file) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) return resolve(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob(b => resolve(b), 'image/jpeg', 0.92);
      } catch { URL.revokeObjectURL(url); resolve(null); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

function setPreview(file) {
  if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
  if (!els.imagePreview) return;
  if (file) {
    previewUrl = URL.createObjectURL(file);
    els.imagePreview.src = previewUrl;
    els.imagePreview.hidden = false;
  } else {
    els.imagePreview.removeAttribute('src');
    els.imagePreview.hidden = true;
  }
}

function syncProduceBtn() {
  const busy = uploading || submitting;
  els.produceBtn.disabled = busy;
  els.produceBtn.textContent = uploading ? 'Görsel yükleniyor…' : submitting ? 'Gönderiliyor…' : 'Üret';
}

els.produceBtn.addEventListener('click', async () => {
  els.produceMsg.textContent = ''; els.produceMsg.className = 'msg';
  const product = els.product.value.trim();
  if (!product) { els.produceMsg.className = 'msg error'; els.produceMsg.textContent = 'Ürün/marka zorunlu.'; return; }
  if (uploading) { els.produceMsg.className = 'msg error'; els.produceMsg.textContent = 'Görsel hâlâ yükleniyor, bekle.'; return; }
  // Görsel seçilmiş ama URL yoksa (yükleme başarısız) uyar
  if (els.image.files[0] && !uploadedImageUrl) {
    els.produceMsg.className = 'msg error';
    els.produceMsg.textContent = 'Görsel yüklenemedi. Tekrar seç ya da görseli kaldır.';
    return;
  }
  if (submitting) return;
  if (!confirm(`${els.costTotal.textContent} maliyetinde bir üretim başlatacaksın. Onaylıyor musun?`)) return;

  submitting = true; syncProduceBtn();
  try {
    const body = {
      product,
      benefit: els.benefit.value.trim(),
      style: els.style.value,
      level: els.level.value,
      duration: els.duration.value,
      dialog: els.dialog.value.trim(),
      imageUrl: uploadedImageUrl
    };
    const r = await fetch('/api/produce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(guard);
    const j = await r.json();
    if (j.jobId) {
      els.produceMsg.className = 'msg success';
      els.produceMsg.textContent = `Üretim başladı (id: ${j.jobId.slice(0, 6)}). Sağ panelde takip et.`;
      await refreshJobs();
      ensurePolling();              // yeni aktif iş için polling'i yeniden başlat
    } else {
      els.produceMsg.className = 'msg error';
      els.produceMsg.textContent = j.error || 'Bilinmeyen hata';
    }
  } catch (e) {
    if (e.message !== 'unauthorized') { els.produceMsg.className = 'msg error'; els.produceMsg.textContent = e.message; }
  } finally {
    submitting = false; syncProduceBtn();
  }
});

const STATUS_LABELS = {
  queued: 'Kuyrukta', generating: 'Üretiliyor', subtitling: 'Altyazı ekleniyor',
  completed: 'Hazır', partial: 'Kısmi (altyazısız)', rejected: 'Reddedildi (para kesilmedi)',
  mcp_error: 'fal hazır, sonuç alınamadı', error: 'Hata'
};
const ACTIVE = new Set(['queued', 'generating', 'subtitling']);

// === Akıllı polling ===
let pollTimer = null;
function ensurePolling() {
  if (pollTimer) return;
  pollTimer = setInterval(tick, 5000);
}
function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}
async function tick() {
  const hasActive = await refreshJobs();
  if (!hasActive) stopPolling();
}

async function refreshJobs() {
  let jobs;
  try {
    const r = await fetch('/api/jobs').then(guard);
    jobs = await r.json();
  } catch { return !!pollTimer; }   // hata: polling'i koru
  reconcileJobs(jobs);

  // Bitmemiş işleri ilerlet (stateless: backend her çağrıda bir adım atar)
  let hasActive = false;
  for (const j of jobs) {
    if (ACTIVE.has(j.status)) {
      hasActive = true;
      if (!refreshing.has(j.id)) {
        refreshing.add(j.id);
        fetch(`/api/jobs/${j.id}/refresh`, { method: 'POST' })
          .then(guard).then(r => r.json())
          .catch(() => {})
          .finally(() => refreshing.delete(j.id));
      }
    }
  }
  return hasActive;
}

// === Artımsal render ===
function reconcileJobs(jobs) {
  if (!jobs.length) {
    cardEls.clear();
    lastStatus.clear();
    els.jobs.innerHTML = '<div class="empty">Henüz üretim yok. Sol taraftan başla.</div>';
    return;
  }
  // boş durum düğümünü kaldır
  const emptyEl = els.jobs.querySelector('.empty');
  if (emptyEl) emptyEl.remove();

  const seen = new Set();
  for (const j of jobs) {
    seen.add(j.id);
    let el = cardEls.get(j.id);
    if (!el) { el = buildCard(j); cardEls.set(j.id, el); }
    updateCard(el, j);
    els.jobs.appendChild(el);       // mevcut düğümü taşır → video yeniden YÜKLENMEZ
    maybeToast(j);
    lastStatus.set(j.id, j.status);
  }
  // listede olmayan kartları kaldır
  for (const [id, el] of cardEls) {
    if (!seen.has(id)) { el.remove(); cardEls.delete(id); lastStatus.delete(id); }
  }
}

function buildCard(j) {
  const el = document.createElement('div');
  el.className = 'job-card';
  el.dataset.id = j.id;
  const dur = `${j.duration}${/^\d+$/.test(String(j.duration)) ? 's' : ''}`;
  el.innerHTML = `
    <div class="job-video" data-media="none"></div>
    <div class="job-meta">
      <div class="title">${escapeHtml(j.product || 'Ürün')}</div>
      <span class="status"></span>
      <div class="tags">
        <span class="tag">${escapeHtml(j.style)}</span>
        <span class="tag">${dur}</span>
        <span class="tag">${escapeHtml(j.level)}</span>
        <span class="tag">$${(j.cost?.total || 0).toFixed(2)}</span>
        ${j.image_url ? '<span class="tag">görselli</span>' : ''}
      </div>
    </div>
    <div class="job-error" hidden></div>
    <div class="job-actions">
      <a class="open" target="_blank" hidden>Aç</a>
      <a class="dl" hidden>İndir</a>
      <button class="delete">Sil</button>
    </div>`;
  el.querySelector('button.delete').addEventListener('click', async () => {
    if (!confirm('Bu üretimi listeden silmek istiyor musun? (fal CDN\'deki video kalır)')) return;
    await fetch(`/api/jobs/${j.id}`, { method: 'DELETE' }).then(guard).catch(() => {});
    refreshJobs();
  });
  return el;
}

function updateCard(el, j) {
  // Durum rozeti
  const status = el.querySelector('.status');
  status.textContent = STATUS_LABELS[j.status] || j.status;
  status.className = 'status ' + j.status + (ACTIVE.has(j.status) ? ' active' : '');

  // Hata bloğu
  const err = el.querySelector('.job-error');
  if (j.error) { err.textContent = j.error; err.hidden = false; }
  else { err.textContent = ''; err.hidden = true; }

  // Medya alanı (videoyu tıklayınca yükle)
  updateMedia(el.querySelector('.job-video'), j);

  // Aksiyonlar
  const url = j.subtitled_url || j.video_url;
  const open = el.querySelector('a.open');
  const dl = el.querySelector('a.dl');
  if (url) {
    open.href = url; open.hidden = false;
    dl.href = url; dl.download = `${(j.product || 'video')}-${j.id.slice(0, 6)}.mp4`; dl.hidden = false;
  } else {
    open.hidden = true; dl.hidden = true;
  }
}

function updateMedia(slot, j) {
  if (slot.dataset.media === 'video') return;   // kullanıcı yükledi → asla dokunma
  const url = j.subtitled_url || j.video_url;
  if (url) {
    if (slot.dataset.media === 'overlay' && slot.dataset.url === url) return;  // değişmedi
    slot.dataset.media = 'overlay';
    slot.dataset.url = url;
    slot.innerHTML = '<button type="button" class="play-overlay"><span class="play-icon">▶</span><span>Videoyu yükle</span></button>';
    slot.querySelector('.play-overlay').addEventListener('click', () => {
      slot.dataset.media = 'video';
      slot.innerHTML = '';
      const v = document.createElement('video');
      v.src = url; v.controls = true; v.autoplay = true; v.preload = 'metadata';
      slot.appendChild(v);
    });
  } else {
    // aktif/url yok: durum metni + geçen süre
    slot.dataset.media = 'none';
    slot.removeAttribute('data-url');
    let label = j.status === 'generating' ? '⏳ üretiliyor…'
      : j.status === 'subtitling' ? '✍️ altyazı ekleniyor…'
      : (STATUS_LABELS[j.status] || j.status);
    if (ACTIVE.has(j.status)) { const e = elapsed(j.created_at); if (e) label += `  ${e}`; }
    slot.textContent = label;
  }
}

function elapsed(createdAt) {
  if (!createdAt) return '';
  const ms = Date.now() - new Date(createdAt).getTime();
  if (!isFinite(ms) || ms < 0) return '';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function maybeToast(j) {
  const prev = lastStatus.get(j.id);
  if (prev === undefined || !ACTIVE.has(prev)) return;   // ilk yüklemede / zaten bitmişse sustur
  if (j.status === 'completed') showToast(`✅ "${j.product || 'Video'}" hazır`, 'success');
  else if (j.status === 'partial') showToast(`⚠️ "${j.product || 'Video'}" altyazısız hazır`, 'warn');
  else if (j.status === 'rejected' || j.status === 'error' || j.status === 'mcp_error') showToast(`❌ "${j.product || 'Video'}" başarısız`, 'error');
}

// === Toast ===
function showToast(msg, type) {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id = 'toast-container'; c.className = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = 'toast ' + (type || '');
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('hide'); setTimeout(() => t.remove(), 300); }, 4500);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

init();
