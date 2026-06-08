# Model ve Maliyet Referansı (Doğrulanmış Havuz — 2026-05)

Bu dosya, fal MCP üzerinden hangi işte hangi modelin kullanılacağını, parametrelerini ve maliyeti içerir. **Model seçimi sahne tipine göre AŞAĞIDAKİ tablodan yapılır — katalogda serbest arama YAPMA.** İzin verilen modeller bu dosyadakilerle sınırlıdır; bu, hem tutarlılık hem maliyet kontrolü sağlar.

> Tüm endpoint ID'leri, duration sınırları ve fiyatlar fal kataloğunda canlı doğrulandı (2026-05). Üretim öncesi `get_model_schema` ile bir kez doğrulamak yine de zorunludur — fal model adlarını/parametrelerini revize edebilir.

## İzin verilen model havuzu

| Senaryo | Endpoint ID | Süre | Türkçe Ses | 8 sn fiyat (yaklaşık) |
|---|---|---|---|---|
| **VARSAYILAN** — Türkçe UGC, ≤8 sn | `fal-ai/veo3.1/fast` (t2v) / `fal-ai/veo3.1/fast/image-to-video` (i2v) | 4 / 6 / 8 sn | ✓ Güvenli, kanıtlı | ~$1.20 ($0.15/sn) |
| **Ekonomik** — düşük bütçe, ≤8 sn | `fal-ai/veo3.1/lite/image-to-video` | 4 / 6 / 8 sn | ✓ (Veo ailesi) | ~$0.40 ($0.05/sn) |
| **Premium** — en yüksek kalite, ≤8 sn | `fal-ai/veo3.1` (t2v) / `fal-ai/veo3.1/image-to-video` (i2v) | 4 / 6 / 8 sn | ✓ | ~$3.20 ($0.40/sn) |
| **Uzun video (9–15 sn)** — tek üretim 8 sn'den uzun olmalıysa | `bytedance/seedance-2.0/fast/text-to-video` (t2v) / `bytedance/seedance-2.0/fast/image-to-video` (i2v) | 4 – 15 sn | ✓ Test edildi (basit prompt) | ~$1.10 (12 sn 1080p civarı) |
| **Ürün + ortam + influencer multi-referans** — birden fazla görsel/video/ses referansını tek çağrıda birleştir | `bytedance/seedance-2.0/reference-to-video` veya `bytedance/seedance-2.0/fast/reference-to-video` | 4 – 15 sn | ✓ | Seedance ile aynı mertebe |
| **Görsel (sahne ön-üretimi)** | `fal-ai/nano-banana` | tek kare | — | ~$0.04 / görsel |
| **Altyazı** (her zaman ayrı çağrı) | `fal-ai/workflow-utilities/auto-subtitle` | süreye bağlı | — | ~$0.03 / dakika |

### Havuzdan ÇIKARILAN model

- ❌ **Kling 3.0 Pro** — Resmi şema `generate_audio` açıklaması: *"Supports Chinese and English voice output. Other languages are automatically translated to English."* Yani Türkçe diyalog yazsanız bile İngilizce'ye çevirir. **Türkçe konuşan UGC için kullanılamaz.** Multi-shot için bile kullanma — diyalog yine İngilizce'ye çevrilir.

## Model seçim karar ağacı (sırayla, ilk eşleşende dur)

1. Kullanıcı "premium / en iyi kalite / sinematik" mi dedi ve süre ≤ 8 sn? → `fal-ai/veo3.1` (görsel varsa `/image-to-video`)
2. Süre **9–15 sn** mi VE/VEYA ürün+ortam+influencer multi-referans gerekli mi? → `bytedance/seedance-2.0/fast/image-to-video` (görsel var) veya `bytedance/seedance-2.0/fast/text-to-video` (görsel yok). Multi-referans için: `bytedance/seedance-2.0/reference-to-video`.
3. Kullanıcı "ucuz / bütçe / öğrenme amaçlı" mı dedi ve süre ≤ 8 sn? → `fal-ai/veo3.1/lite/image-to-video`
4. Hiçbiri değil (standart konuşan UGC ≤ 8 sn) → `fal-ai/veo3.1/fast` (VARSAYILAN). Görsel varsa `fal-ai/veo3.1/fast/image-to-video`.

**Önemli kısıtlamalar:**
- Veo 3.1 ailesinin tüm üyeleri (Lite, Fast, standart) **maksimum 8 sn**. 12 sn istek geldiyse seçenek: ya Seedance 2.0'a yönel, ya senaryoyu 8 sn'ye sığdır, ya çok sahneli üret (her sahne 8 sn).
- Veo 3.1 Fast t2v aspect ratio sadece **16:9** veya **9:16** (auto yok).
- Seedance text-to-video sadece **480p / 720p** destekler; 1080p için image-to-video kullan.
- Seedance prompt'ları **kısa ve sade** tut — uzun, içerik-yoğun (özellikle "AI / satış / chatbot / marka adı" gibi vurgulu) prompt'lar fal'in content moderation tarafından reddediliyor (bkz. "MCP / fal davranış uyarısı" bölümü).

## Sabit teknik parametreler (her zaman uygulanır)

- `aspect_ratio`: `9:16` (varsayılan dikey). 16:9 sadece kullanıcı yatay isterse.
- `resolution`: mümkün olan en yüksek. Veo'da `1080p`. Seedance i2v'de `1080p`, Seedance t2v'de `720p` max.
- `generate_audio`: `true` (parametre adı şemada her zaman doğrulanır).
- `negative_prompt` (sadece Veo ailesinde var, Seedance'de yok): `"on-screen text, captions, subtitles, watermark, logo overlay, blur, distortion, low quality"`.
- `safety_tolerance` (Veo ailesinde var): `"4"` (varsayılan). Prompt sürekli reddedilirse `"5"` denenebilir.
- `auto_fix` (Veo ailesinde var): `true` — prompt content policy'ye takılırsa fal otomatik yeniden yazsın.

## Maliyet onay şablonu

> "[X] sn, Türkçe sesli, dikey video + profesyonel altyazı üreteceğim.
> Model: [seçilen model] (sahne tipine göre seçildi).
> Tahmini: video ~$[A] + altyazı ~$[B] = **~$[toplam]**.
> Onaylıyor musun? ('üret' / ayar değiştir / iptal)"

Çok sahnede TÜM sahneler + altyazının toplamını TEK onayda sun. Görsel ön-üretim varsa onu da topla.

## Çağrı parametreleri (doğrulanan endpoint'lerle)

Video uzun sürer → her zaman kuyruk: `submit_job` → `check_job` döngüsü.

### Veo 3.1 / Fast / Lite — image-to-video (Türkçe UGC ana yol)
```json
{
  "image_url": "<fal CDN url>",
  "prompt": "<zengin İngilizce sahne + Türkçe diyalog çift tırnak içinde>",
  "aspect_ratio": "9:16",
  "resolution": "1080p",
  "duration": "8s",
  "generate_audio": true,
  "negative_prompt": "on-screen text, captions, subtitles, watermark",
  "safety_tolerance": "4",
  "auto_fix": true
}
```
Endpoint: `fal-ai/veo3.1/fast/image-to-video` (varsayılan) / `fal-ai/veo3.1/lite/image-to-video` (ekonomik) / `fal-ai/veo3.1/image-to-video` (premium).

### Veo 3.1 / Fast — text-to-video (görsel yoksa)
```json
{
  "prompt": "<zengin İngilizce sahne + Türkçe diyalog>",
  "aspect_ratio": "9:16",
  "resolution": "1080p",
  "duration": "8s",
  "generate_audio": true,
  "negative_prompt": "on-screen text, captions, subtitles",
  "safety_tolerance": "4",
  "auto_fix": true
}
```
Endpoint: `fal-ai/veo3.1/fast` veya `fal-ai/veo3.1`.

### Seedance 2.0 Fast — image-to-video (uzun video, ≥ 9 sn)
```json
{
  "image_url": "<fal CDN url>",
  "prompt": "<KISA sahne hareketi + Türkçe diyalog çift tırnak içinde>",
  "aspect_ratio": "9:16",
  "resolution": "1080p",
  "duration": "12",
  "generate_audio": true
}
```
- Endpoint: `bytedance/seedance-2.0/fast/image-to-video` (Fast — varsayılan) / `bytedance/seedance-2.0/image-to-video` (standart).
- **Seedance prompt kuralları** (uzun karmaşık prompt reject riskine karşı):
  - Sahne yönergesini **8-12 satıra sığdır** (Veo'da 15-25 satır kabul).
  - Marka adını **sahnenin doğal bir parçası** olarak yumuşat (örn. "the laptop screen shows an AI dashboard" → marka adını cümlenin ana özne yapma).
  - Türkçe diyalogu **çift tırnak** (`"..."`) içinde ver, tek tırnak değil.
  - "Sales / chatbot / convert customers / AI" gibi yüksek-vurgulu pazarlama kelimelerinden kaçın (bunları sahnenin doğal context'ine sakla).
  - `negative_prompt` parametresi YOKtur — geçirme, 422 hatası verir.

### Seedance 2.0 — reference-to-video (ürün + ortam + influencer)
```json
{
  "prompt": "Sahne: [Image1] gösterilen ürünü [Image2] ortamında [Image3] influencer kullanıyor. Türkçe diyalog: \"...\"",
  "reference_image_urls": ["<ürün>", "<ortam>", "<influencer>"],
  "aspect_ratio": "9:16",
  "duration": "10",
  "generate_audio": true
}
```
- Referans parametresinin tam adı endpoint'e göre değişebilir — `get_model_schema` ile **mutlaka** doğrula. Bilinen alternatifler: `reference_image_urls`, `reference_images`, `image_urls`.
- Max 9 image + 3 video + 3 audio referans destekler.
- Prompt'ta referansları `[Image1]`, `[Image2]`, vb. ile yer-değiştir.

### Altyazı modeli — AYRI ÇAĞRI (kalite için kritik)

Video üretildikten SONRA, çıkan video URL'ini şu modele gönder:

Endpoint: `fal-ai/workflow-utilities/auto-subtitle`

```json
{
  "video_url": "<önceki adımda üretilen video URL>",
  "language": "tr"
}
```

> Şemada başka stil parametreleri de (`font_name`, `font_size`, `highlight_color` vb.) yer alıyor olabilir. Üretim öncesi `get_model_schema` ile **mutlaka** doğrula ve sadece şemada gerçekten bulunan parametreleri gönder. Olmayan parametreyi göndermek 422 hatası verir.

Bu ayrı çağrı, videonun sesini Türkçe transkribe edip kelime-vurgulu, doğru zamanlı, stillendirilmiş altyazıyı AYRI ve temiz şekilde gömer. Çıktı: altyazısı gömülü yeni MP4.

**ÖNEMLİ İŞ BÖLÜMÜ:** Video üretim prompt'unda "burned-in subtitles" İSTEME — tersine `no on-screen text` ekle (Veo'da `negative_prompt`'a yaz). Video modeli temiz görüntü+ses üretsin; altyazıyı bu ayrı model halletsin. Bu ayrım, modelin video içine bozuk yazı gömme riskini sıfırlar.

## MCP / fal davranış uyarıları — KRİTİK

fal MCP'sinin `check_job action=result` çağrısı iki farklı hata moduyla karşılaşabilir. İkisi de gerçek bir bug değil, sırasıyla fal queue API'sinin ve MCP payload'ının davranışlarıdır. Tanımı bilmek, yanlış teşhisi engeller.

### Durum 1 — `Unprocessable Entity` (422) — PROMPT REDDEDİLDİ

`check_job action=status` sahte "COMPLETED" döner ama `action=result` 422 verir. fal.ai dashboard'unda iş **"Check Error"** olarak görünür ve **para kesilmez** (başarısız işler ücretsiz). Nedeni: fal'in içerik moderation / format reddi.

**Yapılacak:**

1. **Kullanıcıyı bilgilendir:** "Üretim reddedildi (içerik/format), para kesilmedi."
2. **Yeniden üretmeden önce prompt'u revize et:**
   - Uzunluğu yarıya indir.
   - Marka/AI/satış vurgulu kelimeleri sahnenin doğal parçası yap.
   - Türkçe diyalogu çift tırnak içinde tek satıra al.
   - İngilizce sahne yönergelerini koru.
3. **Veo modelinde** `auto_fix: true` ve `safety_tolerance: "5"` ekle, yeniden submit et.
4. **Hala reddederse** modeli değiştir (Veo 3.1 Fast en güvenilir).
5. Aynı prompt'la **3 defadan fazla** yeniden submit etme.

### Durum 2 — `Internal Server Error` (500) — VİDEO ÜRETİLDİ ama MCP DÖNDÜREMİYOR

`check_job action=status` "COMPLETED" döner ve fal sunucusu **gerçekten videoyu üretti, faturalandı**, ancak `action=result` çağrısı `Internal Server Error` veriyor. fal.ai dashboard'unda iş **"Completed / Success"** olarak görünür, video URL'i orada vardır.

Bu fal MCP server'ın yüksek-payload bazı endpoint'lerinde (özellikle Veo 3.1 Fast 1080p image-to-video çıktısı) yaşanan bilinen bir parse sorunu. MCP eninde sonunda düzeltir, ama bu sürede:

**Yapılacak:**

1. **Kullanıcıyı bilgilendir:** "Video başarıyla üretildi (fal sunucusunda hazır) ama MCP geçici hata veriyor. Senin müdahalen lazım."
2. **Kullanıcıdan dashboard'dan URL alması iste:**
   - `https://fal.ai/dashboard/requests` adresine gitsin.
   - İlgili request_id'yi bul, "video" alanından URL'i kopyala.
   - URL'i sohbete yapıştır.
3. **URL geldikten sonra** altyazı adımına (Aşama B) URL'i ileterek devam et.
4. Asla yeniden submit etme — para tekrar gider, sorun çözülmez.

> Bu davranış MCP server'ın geçici durumudur; saat/gün geçince düzelmiş olabilir. Üretim öncesi `check_job action=result` çalışıyor mu kısa bir test yapmak gerekmez — submit et, bekleneni dene, hata görünce yukarıdaki akışa uy.

## Diğer hatalar
- **Zaman aşımı:** Normal, `check_job` ile bekle. Fast modeller 30-90 sn, standart Veo 2-4 dk sürer. Seedance Fast t2v ~30-60 sn.
- **Parametre hatası (`Unprocessable Entity` ama status FAILED veya prompt küçük):** Şemayı `get_model_schema` ile tekrar çek, parametre adlarını düzelt. Model DEĞİŞTİRME.
- **401 Unauthorized:** API key süresi dolmuş veya yanlış. Kurulum kılavuzu Adım 5'i tekrarla.
- **Türkçe telaffuz kötü:** Diyalogu kısalt (8 sn'ye 2-3 kısa cümle), aynı modelle yeniden üret. Veo 3.1 Fast en temiz Türkçe veriyor.
- **Altyazı zamanlaması kötü:** Sadece altyazı çağrısını tekrarla (videoyu yeniden üretme).

## Tarihi notlar (paket sürüm günlüğü)

- 2026-05: Veo 3.1 Lite tier'ı eklendi ($0.05/sn ekonomik seçenek).
- 2026-05: Kling 3.0 Pro Türkçe ses desteklemediği için havuzdan çıkarıldı.
- 2026-05: Seedance endpoint prefix'i `bytedance/seedance-2.0/...` olarak doğrulandı (önceki paket `fal-ai/seedance/v2` yazıyordu).
- 2026-05: MCP queue API'nin "FAILED → COMPLETED status + 422 result" davranışı dokümante edildi.
- 2026-05: Seedance prompt content moderation hassasiyeti tespit edildi (uzun karmaşık prompt + AI/satış vurgulu kelimeler reject ediyor).
