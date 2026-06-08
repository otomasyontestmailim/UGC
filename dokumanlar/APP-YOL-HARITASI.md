# UGC Sistemini App'e Dönüştürme ve Müşteriye Satma Yol Haritası

Bu doküman, skill'i kişisel kullanımdan çıkarıp müşterilere satılabilir bir UGC üretim hizmetine/uygulamasına dönüştürmek isteyenler içindir. Topluluğa "bunu nasıl paraya çevirirsin" diye gösterebileceğin bölüm.

## Önce mantığı anla

Skill aslında bir **iş kuralları katmanı**: "şu modeli kullan, Türkçe sesli yap, şu tarzlar olsun, maliyeti onayla". Bu kuralların hiçbiri Claude Code'a özel değil — aynı mantık bir web/mobil uygulamada da çalışır. App'e dönüştürmek, bu kuralları bir arayüz + fal.ai API'si etrafına sarmaktır.

Üç olgunluk seviyesi var. Çoğu kişi 1'den başlayıp para kazandıkça 3'e ilerler.

---

## Seviye 1 — Hizmet olarak sat (kod yok, en hızlı para)

App yazmadan, bugün başlayabilirsin. Sen "operatör"sün, müşteri brief verir, sen Claude Code + skill ile üretip teslim edersin.

- **Model:** Müşteriden sabit ücret al (örn. haftalık X video paketi), sen üret, teslim et.
- **Maliyet/kâr:** Senin maliyetin video başına ~$1.20 (Fast). Müşteriden video başına çok daha fazlasını alırsın çünkü onların alternatifi ajansa binlerce lira ödemek veya kendi öğrenmek.
- **Avantaj:** Sıfır geliştirme. Bugün skill'i kur, yarın ilk müşteriye teklif götür.
- **Dezavantaj:** Ölçeklenmez — her video senin zamanını ister.

Bu seviyede topluluğa verilecek mesaj: "Önce hizmet olarak satıp talebi doğrula, sonra otomatikleştir."

---

## Seviye 1.5 — Pakete dahil: Lokal mini app (sıfır kod)

Pakette **`mini-app-builder` skill'i** var. Claude Code'a "mini app'e dönüştür" dediğinde lokalde çalışan tek-makine bir dashboard kurar:

- Express + vanilla HTML, ~600 satır kod (zaten yazılmış).
- `npm install && npm start` → `http://localhost:3000`.
- Aynı 8 tarz, 4 kalite seviyesi, görsel upload, canlı maliyet, otomatik Türkçe altyazı.
- Üretim geçmişi JSON dosyasında lokalde.

**Kim için:**
- Seviye 1'i panele çevirip operasyonu hızlandırmak isteyen sen.
- Terminal kullanmadan ekibine üretim yaptırmak isteyen küçük takımlar.
- Demo / pilot için müşteriye "şuradan dene" diye link verebilmek (LAN üzerinde).

**Sınırları:**
- Sadece tek makine (localhost). Public internete açmak için Seviye 3'e geç.
- Kimlik doğrulama yok — paneli kullanan herkes API key sahibi gibi davranır. Yani makineyi paylaşan ekiplerde dikkat.
- Stripe/ödeme yok.

Seviye 2'ye (yarı otomatik panel) geçmeden önce bu lokal app ile süreçleri test edip akışı oturt — sonra cloud'a taşırsın.

---

## Seviye 2 — Yarı otomatik panel (sipariş formu + arka planda sen)

Basit bir web formu: müşteri ürün adı, tarz, görsel yükler → sana bildirim gelir → sen skill ile üretir → linki panele düşersin.

**Gerekli parçalar:**
- Basit bir form (ürün, tarz seçimi dropdown'ı — skill'deki 8 tarzı kullan, görsel yükleme).
- Bir sipariş listesi (Google Sheet bile olur).
- Üretim: hâlâ Claude Code + skill, ama brief'ler düzenli geliyor.

**Neden bu işe yarar:** Müşteri kendini "bir uygulama kullanıyorum" hisseder, sen arkada skill ile hızlı üretirsin. Tarz menüsü ve maliyet mantığı zaten skill'de tanımlı — formu ona göre kur.

---

## Seviye 3 — Tam otomatik SaaS (kullanıcı kendi üretir)

Müşteri kendi hesabıyla girer, ürünü/tarzı seçer, "Üret" der, video gelir. Sen hiç araya girmezsin. Asıl ölçeklenen model bu.

### Mimari (skill mantığının koda çevrilmiş hali)

```
[Kullanıcı Arayüzü]                    [Backend]                      [fal.ai]
 - Ürün/sahne girişi      ──>   - Brief'i al                  
 - Tarz seçimi (8 tarz)         - prompt-rehberi.md mantığıyla
 - Görsel yükleme               zengin prompt'a çevir          ──>  Veo 3.1 Fast
 - Maliyet onayı                - Model SABİT (veo3.1/fast)         ile üret
 - Sonuç/indir                  - Maliyet hesapla & göster     <──  video URL
                                - fal API'ye gönder
```

### Skill → Kod eşlemesi (en kritik tablo)

Skill'deki her kural, app'te bir koda dönüşür. Hiçbirini atlamadan taşı:

| Skill kuralı | App'teki karşılığı |
|---|---|
| Model havuzu sabit (5 model: Veo Fast/Lite/standart, Seedance Fast/standart) | Backend'de havuz hardcode — kullanıcıya katalog seçtirme yok, sadece "kalite seviyesi" (Ekonomik / Standart / Premium) sun |
| Model yönlendirme karar ağacı | Süre + bütçe + multi-referans girdilerine bakan if/else → doğru endpoint'i seç |
| 8 UGC tarzı | Arayüzde tarz seçici; her tarz `ugc-tarzlari.md`'deki iskeleti taşır |
| Zengin prompt üretimi | `prompt-rehberi.md` mantığını bir prompt-şablon fonksiyonuna çevir |
| Türkçe ses zorunlu | İstek gövdesinde `generate_audio: true` + Türkçe diyalog her zaman (Kling 3.0 Pro hariç — o havuzda değil) |
| Maliyet onayı | "Üret" butonundan önce fiyat ekranı: Lite ~$0.40 / Fast ~$1.20 / Standart ~$3.20 / Seedance ~$1.10 (12 sn) |
| Çok sahneli | Sahnelere böl, her birini ayrı çağır, toplam fiyatı göster, kullanıcıya birleştirme notu düş |
| Ürün görseli | Görseli fal CDN'e yükle (`upload_file`), `image_url` ile image-to-video |
| MCP/fal "FAILED → 422" bug'ı | Backend retry mantığı: status COMPLETED ama result 422 ise prompt'u sadeleştir (auto_fix + safety_tolerance:"5"), 3 deneme limiti |

### Teknik temel

fal.ai'nin doğrudan API'si var (MCP olmadan da çağrılır). App backend'inde `fal-ai/veo3.1/fast/image-to-video` (varsayılan) veya `bytedance/seedance-2.0/fast/image-to-video` (uzun video için) endpoint'ine `submit` → `poll` (durum sorgula) → sonuç URL'i akışını kurarsın. Parametreler `model-ve-maliyet.md`'dekiyle birebir aynı. Yani skill'i anlamış biri için app'in çekirdeği zaten hazır — sadece arayüz, kullanıcı yönetimi ve fal'in "FAILED → 422" davranışı için retry mantığı eklenir.

### İş modeli fikirleri

- **Kredi sistemi:** Kullanıcı kredi alır, her video X kredi (senin fal maliyetinin üstünde marj). fal'ın "kullandıkça öde"si sana, kredi sistemi müşteriye.
- **Abonelik:** Aylık paket (örn. 30 video/ay).
- **White-label:** Ajanslara "kendi markanızla UGC üretim paneli" olarak sat.
- **Niş odak:** Belirli sektöre (kozmetik, e-ticaret, restoran) özel hazır tarz şablonlarıyla farklılaş.

### Kâr mantığı (yaklaşık)

Senin maliyetin: 8 sn Fast video ≈ $1.20. Geleneksel UGC içerik üreticisi pazarında bir video $100-500 bandında. Sen müşteriye bunun çok altında, kendine maliyetinin çok üstünde fiyat verebilirsin — arada büyük bir marj var. Asıl değer hız ve ölçek: bir müşteriye haftada onlarca varyasyon üretip A/B test ettirmek, geleneksel yöntemle imkânsız.

---

## Önerilen yol

1. **Bu hafta:** Skill'i kur, 2-3 örnek video üret, portföy yap.
2. **Bu ay:** Seviye 1 — 1-2 müşteriye hizmet olarak sat, talebi doğrula.
3. **Talep varsa:** Seviye 2 paneli kur, operasyonu hızlandır.
4. **Tutarlı gelir varsa:** Seviye 3 SaaS'a yatırım yap.

Sırayı atlama — çoğu kişi talep doğrulamadan app yazıp boşa emek harcıyor. Skill sayesinde Seviye 1'e bugün başlayabilirsin; bu en büyük avantajın.

---

## Yasal / etik notlar (müşteriye satarken önemli)

- Üretilen videolar AI ile yapıldı; bazı platformlar/pazarlar AI içerik etiketlemesi isteyebilir — müşteriyi bilgilendir.
- Telifli marka, ünlü kişi, lisanslı karakter içeren içerik üretme — sadece müşterinin kendi ürünü/markası.
- Müşteri verilerini (ürün görselleri) izinsiz saklama/kullanma.
- fal.ai ve ilgili modellerin kullanım şartlarını ticari kullanım için kontrol et.
