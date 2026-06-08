// UGC Video Studio mini-app frontend

const els = {
  health: document.getElementById('health'),
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

async function checkHealth() {
  try {
    const r = await fetch('/api/health');
    const j = await r.json();
    if (j.key === 'present') { els.health.textContent = 'fal.ai bağlı ✓'; els.health.className = 'health ok'; }
    else { els.health.textContent = 'API key eksik — .env\'i kontrol et'; els.health.className = 'health bad'; }
  } catch {
    els.health.textContent = 'sunucu yanıt vermiyor';
    els.health.className = 'health bad';
  }
}

async function updateCost() {
  const level = els.level.value;
  const duration = els.duration.value;
  const r = await fetch(`/api/cost?level=${level}&duration=${duration}`);
  const j = await r.json();
  els.costTotal.textContent = `$${j.total.toFixed(2)}`;
  els.costBreakdown.textContent = `video $${j.video.toFixed(2)} + altyazı $${j.subtitle.toFixed(3)}`;
}

['change', 'input'].forEach(ev => {
  els.level.addEventListener(ev, updateCost);
  els.duration.addEventListener(ev, updateCost);
});

els.image.addEventListener('change', async () => {
  const f = els.image.files[0];
  if (!f) { uploadedImageUrl = null; els.imageStatus.textContent = ''; return; }
  els.imageStatus.textContent = 'Yükleniyor…';
  const fd = new FormData();
  fd.append('file', f);
  try {
    const r = await fetch('/api/upload', { method: 'POST', body: fd });
    const j = await r.json();
    if (j.url) { uploadedImageUrl = j.url; els.imageStatus.textContent = 'Yüklendi ✓ (image-to-video kullanılacak)'; }
    else { els.imageStatus.textContent = 'Yükleme hatası: ' + (j.error || 'bilinmeyen'); }
  } catch (e) { els.imageStatus.textContent = 'Yükleme hatası: ' + e.message; }
});

els.produceBtn.addEventListener('click', async () => {
  els.produceMsg.textContent = '';
  els.produceMsg.className = 'msg';
  const product = els.product.value.trim();
  if (!product) { els.produceMsg.className = 'msg error'; els.produceMsg.textContent = 'Ürün/marka zorunlu.'; return; }

  if (!confirm(`${els.costTotal.textContent} maliyetinde bir üretim başlatacaksın. Onaylıyor musun?`)) return;

  els.produceBtn.disabled = true;
  els.produceBtn.textContent = 'Gönderiliyor…';
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
    const r = await fetch('/api/produce', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (j.jobId) {
      els.produceMsg.className = 'msg success';
      els.produceMsg.textContent = `Üretim kuyruğa alındı (id: ${j.jobId.slice(0,6)}). Sağ panelde takip et.`;
      await refreshJobs();
    } else {
      els.produceMsg.className = 'msg error';
      els.produceMsg.textContent = j.error || 'Bilinmeyen hata';
    }
  } catch (e) {
    els.produceMsg.className = 'msg error';
    els.produceMsg.textContent = e.message;
  } finally {
    els.produceBtn.disabled = false;
    els.produceBtn.textContent = 'Üret';
  }
});

const STATUS_LABELS = {
  queued: 'Kuyrukta',
  generating: 'Üretiliyor',
  subtitling: 'Altyazı ekleniyor',
  completed: 'Hazır',
  partial: 'Kısmi (altyazısız)',
  rejected: 'Reddedildi (para kesilmedi)',
  mcp_error: 'fal hazır, sunucu hatası',
  error: 'Hata'
};

function renderJobs(jobs) {
  if (!jobs.length) { els.jobs.innerHTML = '<div class="empty">Henüz üretim yok. Sol taraftan başla.</div>'; return; }
  els.jobs.innerHTML = jobs.map(j => {
    const videoUrl = j.subtitledUrl || j.videoUrl;
    const videoBlock = videoUrl
      ? `<div class="job-video"><video src="${videoUrl}" controls preload="metadata"></video></div>`
      : `<div class="job-video">${j.status === 'generating' ? '⏳ üretiliyor…' : j.status === 'subtitling' ? '✍️ altyazı…' : (STATUS_LABELS[j.status] || j.status)}</div>`;
    const errorBlock = j.error ? `<div class="job-error">${j.error}</div>` : '';
    const downloadBtn = videoUrl ? `<a href="${videoUrl}" download="${j.product || 'video'}-${j.id.slice(0,6)}.mp4">İndir</a>` : '';
    const openBtn = videoUrl ? `<a href="${videoUrl}" target="_blank">Aç</a>` : '';
    return `
      <div class="job-card">
        ${videoBlock}
        <div class="job-meta">
          <div class="title">${escapeHtml(j.product || 'Ürün')}</div>
          <span class="status ${j.status}">${STATUS_LABELS[j.status] || j.status}</span>
          <div class="tags">
            <span class="tag">${j.style}</span>
            <span class="tag">${j.duration}${/^\d+$/.test(j.duration) ? 's' : ''}</span>
            <span class="tag">${j.level}</span>
            <span class="tag">$${(j.cost?.total || 0).toFixed(2)}</span>
          </div>
        </div>
        ${errorBlock}
        <div class="job-actions">
          ${openBtn}${downloadBtn}
          <button class="delete" data-id="${j.id}">Sil</button>
        </div>
      </div>`;
  }).join('');
  els.jobs.querySelectorAll('button.delete').forEach(b => {
    b.addEventListener('click', async () => {
      if (!confirm('Bu üretimi listeden silmek istiyor musun? (fal CDN\'deki video kalır)')) return;
      await fetch(`/api/jobs/${b.dataset.id}`, { method: 'DELETE' });
      refreshJobs();
    });
  });
}

async function refreshJobs() {
  try {
    const r = await fetch('/api/jobs');
    const jobs = await r.json();
    renderJobs(jobs);
  } catch {}
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]));
}

checkHealth();
updateCost();
refreshJobs();
setInterval(refreshJobs, 5000);
