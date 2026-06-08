// UGC Video Studio mini-app frontend (auth + stateless frontend polling)

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
const refreshing = new Set();      // aynı işe çift refresh çağrısını önle

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
  refreshJobs();
  setInterval(refreshJobs, 5000);
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

// Görsel seçilince HEMEN yükle; bitene kadar Üret kilitli (yarış durumunu önler)
els.image.addEventListener('change', async () => {
  const f = els.image.files[0];
  if (!f) { uploadedImageUrl = null; els.imageStatus.textContent = ''; return; }
  uploading = true;
  uploadedImageUrl = null;
  els.imageStatus.textContent = 'Yükleniyor…';
  syncProduceBtn();
  const fd = new FormData();
  fd.append('file', f);
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

function renderJobs(jobs) {
  if (!jobs.length) { els.jobs.innerHTML = '<div class="empty">Henüz üretim yok. Sol taraftan başla.</div>'; return; }
  els.jobs.innerHTML = jobs.map(j => {
    const videoUrl = j.subtitled_url || j.video_url;
    const videoBlock = videoUrl
      ? `<div class="job-video"><video src="${videoUrl}" controls preload="metadata"></video></div>`
      : `<div class="job-video">${j.status === 'generating' ? '⏳ üretiliyor…' : j.status === 'subtitling' ? '✍️ altyazı…' : (STATUS_LABELS[j.status] || j.status)}</div>`;
    const errorBlock = j.error ? `<div class="job-error">${escapeHtml(j.error)}</div>` : '';
    const dl = videoUrl ? `<a href="${videoUrl}" download="${escapeHtml(j.product || 'video')}-${j.id.slice(0, 6)}.mp4">İndir</a>` : '';
    const open = videoUrl ? `<a href="${videoUrl}" target="_blank">Aç</a>` : '';
    const dur = `${j.duration}${/^\d+$/.test(String(j.duration)) ? 's' : ''}`;
    return `
      <div class="job-card">
        ${videoBlock}
        <div class="job-meta">
          <div class="title">${escapeHtml(j.product || 'Ürün')}</div>
          <span class="status ${j.status}">${STATUS_LABELS[j.status] || j.status}</span>
          <div class="tags">
            <span class="tag">${escapeHtml(j.style)}</span>
            <span class="tag">${dur}</span>
            <span class="tag">${escapeHtml(j.level)}</span>
            <span class="tag">$${(j.cost?.total || 0).toFixed(2)}</span>
            ${j.image_url ? '<span class="tag">görselli</span>' : ''}
          </div>
        </div>
        ${errorBlock}
        <div class="job-actions">
          ${open}${dl}
          <button class="delete" data-id="${j.id}">Sil</button>
        </div>
      </div>`;
  }).join('');
  els.jobs.querySelectorAll('button.delete').forEach(b => {
    b.addEventListener('click', async () => {
      if (!confirm('Bu üretimi listeden silmek istiyor musun? (fal CDN\'deki video kalır)')) return;
      await fetch(`/api/jobs/${b.dataset.id}`, { method: 'DELETE' }).then(guard).catch(() => {});
      refreshJobs();
    });
  });
}

async function refreshJobs() {
  try {
    const r = await fetch('/api/jobs').then(guard);
    const jobs = await r.json();
    renderJobs(jobs);
    // Bitmemiş işleri ilerlet (stateless: backend her çağrıda bir adım atar)
    for (const j of jobs) {
      if (ACTIVE.has(j.status) && !refreshing.has(j.id)) {
        refreshing.add(j.id);
        fetch(`/api/jobs/${j.id}/refresh`, { method: 'POST' })
          .then(guard).then(r => r.json())
          .catch(() => {})
          .finally(() => refreshing.delete(j.id));
      }
    }
  } catch {}
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

init();
