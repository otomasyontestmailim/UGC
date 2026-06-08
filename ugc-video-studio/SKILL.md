---
name: ugc-video-studio
description: Türkçe konuşan, profesyonel altyazılı, çeşitli tarzlarda UGC (kullanıcı tarzı içerik) reklam videoları üretir. fal.ai MCP üzerinden çalışır; sahne tipine göre doğru video modelini (Veo 3.1 / Seedance 2.0 / Kling 3.0) otomatik seçer, altyazıyı ayrı profesyonel modelle ekler, isteğe bağlı görsel→video onaylı akış sunar. Kullanıcı "UGC videosu", "tanıtım/reklam videosu", "TikTok/Reels videosu", "ürün videosu", "influencer videosu" isterse ya da bir ürün görseli yükleyip "buna video yap" derse MUTLAKA bu skill'i kullan — "skill" kelimesi geçmese bile.
---

# UGC Video Studio

fal.ai MCP üzerinden Türkçe konuşan, profesyonel altyazılı, çok tarzlı UGC reklam videoları üreten bir prodüksiyon orkestratörü. Kullanıcı teknik hiçbir şey bilmeden, sadece ne istediğini söyleyerek satışa hazır video alır. Bu skill, düz bir arayüzden farklı olarak: sahne tipine göre model yönlendirir, zengin prompt yazar, altyazıyı ayrı modelle profesyonelce ekler, görsel→video onaylı akış ve çok sahne/varyasyon orkestrasyonu sunar.

## Çalışmadan önce — ZORUNLU kontrol

fal.ai MCP bağlı olmalı. fal araçları (model çalıştırma, şema, upload, kuyruk) görünmüyorsa üretime BAŞLAMA; kullanıcıya: "fal.ai MCP bağlı görünmüyor. Kurulum kılavuzundaki adımları tamamladın mı? Tamamladıysan Claude Code'u yeniden başlatman gerekebilir." Kurulum: paketteki `KURULUM-KILAVUZU.md`.

## Temel ilke: Model SABİT HAVUZDAN seçilir, serbest arama YOK

fal kataloğunda 1000+ model var. Serbest bırakılırsa her seferinde farklı, tutarsız, pahalı veya İngilizce sonuç çıkar. Bunu engellemek için model seçimi **yalnızca `references/model-ve-maliyet.md` dosyasındaki izinli havuzdan ve oradaki karar ağacına göre** yapılır. Katalog araması, "daha iyisi var mı" taraması YASAK.

İzinli havuz (2026-05 itibariyle doğrulandı):
- **Veo 3.1 Fast** (varsayılan, ≤8 sn, Türkçe ses güvenli)
- **Veo 3.1 Lite** (ekonomik, ≤8 sn)
- **Veo 3.1** (premium, ≤8 sn)
- **Seedance 2.0 / Fast** (9-15 sn veya multi-referans için)
- **nano-banana** (görsel ön-üretim)
- **auto-subtitle** (Türkçe altyazı)

❌ Kling 3.0 Pro havuzdan ÇIKARILDI çünkü "Other languages are automatically translated to English" — Türkçe sesli UGC için kullanılamaz.

Hangi işte hangi model: `references/model-ve-maliyet.md` karar ağacına bak. Üretimden önce seçili modelin parametre şemasını `get_model_schema` ile bir kez doğrulamak serbesttir (model arama sayılmaz). Veo ailesi MAX 8 sn — 9 sn+ istek geldiyse Seedance 2.0'a yönel.

## Akış (her zaman bu sırayla)

### 1. Brifing'i topla

Kullanıcı ürünü/sahneyi yazdıysa, eksik kritik bilgileri TEK seferde sor (soru yağmuru yok):

- **Ürün/hizmet nedir?** (zorunlu)
- **Tarz** — belirtilmediyse `references/ugc-tarzlari.md` menüsünden seçtir. Varsayılan: "Samimi İtiraf".
- **Ürün/influencer görseli var mı?** Varsa görsel→video akışını değerlendir (aşağıda).
- **Süre** — varsayılan 8 sn. Daha uzunsa "çok sahneli üretim".
- **Akış tercihi** — kullanıcı "önce görseli göreyim onaylayayım" tipi kontrol isterse görsel→video akışı; yoksa doğrudan video.

"Sen karar ver / fark etmez" derse varsayılanlarla ilerle, takılma.

### 2. Sahne tipine göre MODELİ seç

`references/model-ve-maliyet.md` içindeki karar ağacını uygula. Kullanıcıya model adını sorma; "ne tür video" olduğunu anla, modeli ağaç seçsin. Seçtiğin modeli kullanıcıya kısaca bilgi olarak söyle ("Bu iş için Seedance 2.0 uygun çünkü ürün+ortam tutarlılığı önemli").

### 3. Sabit teknik ayarlar (sorma, uygula)

- En-boy: `9:16` dikey (varsayılan). Kullanıcı "yatay/YouTube/16:9" derse `16:9`.
- Çözünürlük: mümkün olan en yüksek (genelde `1080p`).
- Ses: AÇIK ve **Türkçe** (diyalog Türkçe yazılır + "native Turkish accent").
- Altyazı: video prompt'una KOYULMAZ. Video üretildikten sonra AYRI altyazı modeliyle eklenir (Adım 6).

### 4. Profesyonel prompt'u oluştur

`references/prompt-rehberi.md`'ye göre 15-25 satırlık zengin İngilizce sahne + Türkçe diyalog yaz. **Prompt'a altyazı/on-screen text İSTEME**; tersine "no on-screen text, clean realistic image" ekle. Üretmeden önce prompt'un Türkçe özetini ve seçilen tarzı+modeli kullanıcıya kısaca göster.

### 5. Maliyeti söyle ve onay al — ZORUNLU

`references/model-ve-maliyet.md`'deki şablonla, **video + altyazı toplam** tahmini maliyeti söyle, açık onay iste. Onay ("üret"/"evet") gelmeden hiçbir üretim çağrısı yapma. Çok sahnede tüm sahne+altyazı toplamını TEK onayda sun.

### 6. Üret — İKİ AŞAMALI PIPELINE

**Aşama A — Video (altyazısız, temiz):**
Seçili modeli kuyrukla çağır: `submit_job` → `check_job` döngüsü (video birkaç dakika sürer; kullanıcıya "üretiliyor, bekliyorum" de). `check_job action=status` ile bekle, `COMPLETED` olunca `action=result` ile video URL'i al.

**KRİTİK — fal/MCP iki başarısızlık modu:**

- **`Unprocessable Entity` (422):** status COMPLETED olsa bile prompt **REDDEDİLDİ** (içerik/format), dashboard "Check Error", **para kesilmedi**. Prompt'u sadeleştir → `auto_fix: true` + `safety_tolerance: "5"` → yeniden dene → 3 denemeden fazla yapma.
- **`Internal Server Error` (500):** Video **üretildi**, fal'de hazır, **faturalandı**, dashboard "Success" gösterir, ama MCP payload'ı döndüremiyor (özellikle 1080p Veo i2v). Kullanıcıdan `https://fal.ai/dashboard/requests` üzerinden video URL'ini istemesini söyle ve altyazı adımına o URL ile devam et. **Asla yeniden submit etme** — para tekrar gider.

Detay ve karar matrisi: `references/model-ve-maliyet.md` "MCP / fal davranış uyarıları" bölümü.

**Aşama B — Altyazı (ayrı model):**
Aşama A'nın video URL'ini `fal-ai/workflow-utilities/auto-subtitle` modeline gönder. `language: "tr"` zorunlu. Stil parametreleri (`font_size`, `highlight_color`, vb.) varsa: göndermeden önce `get_model_schema` ile **mutlaka** doğrula — şemada olmayan parametre 422 hatası verir. Çıktı: altyazılı final MP4.

Bu iş bölümü kalitenin anahtarıdır: video modeli görüntü+sese odaklanır, altyazı modeli yazıya. Modelin video içine bozuk yazı gömme riski ortadan kalkar.

### 7. Teslim ve sonraki adım

Final (altyazılı) videoyu paylaş, ne ürettiğini bir cümleyle özetle. İyileştirme teklif et: "Tarz/ton/süre/altyazı stilini değiştirip yeniden üretebilirim." Altyazı sorunluysa SADECE Aşama B'yi tekrarla (videoyu yeniden üretme — maliyet ve zaman tasarrufu). Kullanıcı A/B isterse aynı brief'ten 2-3 farklı kanca üret.

## Görsel → Video onaylı akış (kontrol katmanı)

Kullanıcı "önce görseli göreyim", "sahneyi onaylayayım", "kör üretim istemiyorum" tarzı bir kontrol isterse veya pahalı bir üretim öncesi riski azaltmak mantıklıysa:

1. **Görsel üret:** Sahneyi (influencer + ürün + ortam) önce bir görsel olarak üret. Görsel modeli için izinli seçenek: `fal-ai/nano-banana` veya `fal-ai/flux/dev` (sadece bu ikisi; başka görsel modeli arama). Prompt'u `prompt-rehberi.md`'deki zenginlikte yaz (hareket/ses olmadan; kompozisyon, ışık, ürün, ortam, karakter).
2. **Onaylat:** Görseli kullanıcıya göster. "Bu sahne uygun mu? Değişiklik ister misin?" Onay gelene kadar videoya geçme. Görsel üretimi ucuzdur; pahalı video öncesi sahneyi kilitlemek hem maliyet hem kalite kazandırır.
3. **Videoya çevir:** Onaylı görseli image-to-video referansı olarak ver (Veo 3.1 Fast `image_url` veya Seedance 2.0 referans pipeline — sahneye göre `model-ve-maliyet.md`'den seç). Sonra normal Aşama A + Aşama B (altyazı).

Bu akış, "düz arayüzden tek tık üretim"den temel farktır: kullanıcı sonucu kör almaz, sahneyi görüp yönlendirir.

## Ürün görseli ile üretim (image-to-video)

Kullanıcı ürün/influencer görseli yüklediyse: görseli fal CDN'e upload et, dönen URL'i image-to-video parametresine ver. Ürün+ortam+influencer birlikte tutarlılık kritikse Seedance 2.0 referans pipeline'ı kullan (çoklu referans). Detay: `model-ve-maliyet.md`.

## Çok sahneli / uzun video

**Tek üretim sınırları:**
- Veo 3.1 ailesi (Fast/Lite/standart): **MAX 8 sn**.
- Seedance 2.0 / Fast: **4-15 sn**.

**9-15 sn istek geldiyse** → tek Seedance üretimi (basit, tek sahne, ses dahil).

**15 sn'den uzun istek geldiyse** → senaryoyu 8-15 sn'lik sahnelere böl (kanca → tanıtım → fayda → çağrı), karakter+ortam tanımını sahneler arası BİREBİR koru. Her sahneyi ayrı Veo veya Seedance çağrısı olarak üret. Tüm sahne+altyazı toplam maliyetini TEK onayda sun. Her sahneye ayrı altyazı (Aşama B) uygula. Birleştirme bu skill'in kapsamı dışında; kullanıcıya sahne linklerini ver ve birleştirme notu düş (yerel `ffmpeg` veya CapCut tavsiye et).

> Kling 3.0 Pro multi-shot havuzdan çıkarıldı (Türkçe ses desteklemiyor). Türkçe sesli çok sahneli ihtiyaç için yukarıdaki yöntem kullanılır.

## Tarz seçenekleri

Detaylar `references/ugc-tarzlari.md`'de: Samimi İtiraf, Heyecanlı Keşif, Problem-Çözüm, Sokak Röportajı, Lüks/Estetik, Komik/Eğlenceli, Uzman Tavsiyesi, Önce-Sonra. Kullanıcı seçmediyse o dosyadan kısa menü sun; tarz uygulamadan önce o dosyayı oku.

## App'e / müşteri hizmetine dönüştürme

Kullanıcı sistemi uygulamaya çevirip satmak isterse `dokumanlar/APP-YOL-HARITASI.md`'ye yönlendir. Skill'in mantığı (model yönlendirme, ayrı altyazı pipeline, tarz şablonları, görsel→video onayı, maliyet onayı) bir API/uygulama katmanına birebir taşınabilir.

## Asla yapma

- Onay almadan üretim çağrısı yapma.
- İzinli havuz dışında model kullanma / katalog arama.
- Kling 3.0 Pro kullanma — Türkçe ses desteği yok (havuzdan çıkarıldı).
- Veo ailesinde 8 sn'den uzun süre isteme — şema sadece 4/6/8 saniye kabul eder, hata verir.
- Video prompt'una altyazı/on-screen text isteme (ayrı model yapar).
- İngilizce konuşan video üretme (ses her zaman Türkçe).
- Ham kullanıcı cümlesini modele gönderme (her zaman zengin prompt).
- Maliyeti gizleme veya tahminsiz üretme.
- Altyazı bozuksa tüm videoyu yeniden üretme (sadece altyazı adımını tekrarla).
- Telifli marka/ünlü/karakter içeren içerik (sadece kullanıcının kendi ürünü/markası).
- `Unprocessable Entity` hatasında aynı prompt'la 3'ten fazla yeniden submit etme — prompt'u revize et.
- `auto-subtitle`'a şemada olmayan stil parametresi gönderme (422 verir).
