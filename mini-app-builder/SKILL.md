---
name: mini-app-builder
description: Kullanıcı paketteki UGC üretim sistemini "mini app'e" / "lokal dashboard'a" / "web arayüze" dönüştürmek isterse devreye girer. Kullanıcı "mini app'e dönüştür", "lokal app yap", "dashboard kur", "web panel oluştur", "lokalde çalışan arayüz yap", "tarayıcıdan kullanayım" derse MUTLAKA bu skill'i kullan. mini-app/ klasörüne çalışan bir Node.js + Express + vanilla HTML uygulaması kurar. Kullanıcı sonra `npm install && npm start` ile localhost:3000'de aynı UGC üretim akışını tarayıcıdan kullanır.
---

# Mini App Builder

UGC Video Studio'nun chat tabanlı akışını **localhost'ta çalışan tek-makine web app'ine** dönüştürür. Aynı kurallar (model havuzu sabit, Türkçe ses, maliyet onayı, iki aşamalı pipeline, MCP failure modları) tam korunur — sadece arayüz değişir.

## Ne zaman tetiklenir

Kullanıcı şunlardan birini söylerse:
- "mini app'e dönüştür"
- "lokal app yap" / "lokal dashboard kur"
- "web arayüz oluştur" / "web panel yap"
- "tarayıcıdan kullanmak istiyorum"
- "localhost'ta açayım"
- "bunu app yap"

Otherwise: dokunma. Bu skill chat akışını bozmaz, sadece istek geldiğinde uygulamayı kurar.

## Önkoşullar (ZORUNLU kontrol)

1. **Node.js v18+** kurulu olmalı (Claude Code zaten gerektirdiği için genelde vardır). Doğrula: `node --version`.
2. **fal.ai API anahtarı** kullanıcıda hazır olmalı. App `.env` dosyasından okuyacak.
3. Çalışılan dizinde `mini-app/` adında bir klasör YOK olmalı — varsa kullanıcıya sor: "Üstüne yazayım mı yoksa farklı isimde mi kurayım?"

Eksik varsa kurulumu BAŞLATMA. Kullanıcıyı bilgilendir, eksiği gider, sonra geç.

## Akış

### 1. Ön kontrol ve onay
- Mevcut dizinde `mini-app/` var mı kontrol et.
- Node sürümünü `node --version` ile doğrula.
- Kullanıcıya plan özeti sun: "mini-app/ klasörü açıp Express tabanlı bir lokal dashboard kuracağım. ~3 npm paketi yükleyecek (express, multer, dotenv). API key'ini .env'e yapıştıracaksın. Onaylıyor musun?"
- "evet/üret/devam" yanıtı gelmeden başlatma.

### 2. Klasör yapısını oluştur
Hedef: `<cwd>/mini-app/` (kullanıcının çalıştığı dizinin altı).

```
mini-app/
├── server.js
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── data/                 (boş — runtime'da jobs.json yazılacak)
└── public/
    ├── index.html
    ├── styles.css
    └── app.js
```

`mkdir` ile klasörleri aç, sonra her dosyayı bu skill'in `templates/` dizininden Read edip hedefe Write et. Templates dosyalarını **olduğu gibi kopyala** — değiştirme.

### 3. Bağımlılıkları kur
`mini-app/` klasörüne girip `npm install` çalıştır. ~30-60 sn sürer. Çıktıyı kullanıcıya göster.

### 4. .env ayarı için kullanıcıyı yönlendir
Kurulum bitince kullanıcıya net talimat:

```
Kurulum tamamlandı. Şimdi:

1. mini-app/.env.example dosyasını mini-app/.env olarak kopyala (sağ tık → kopyala → yeniden adlandır).
   Veya terminalde: copy mini-app\.env.example mini-app\.env  (Windows)
                  cp mini-app/.env.example mini-app/.env       (Mac/Linux)

2. mini-app/.env dosyasını bir metin editöründe aç.

3. FAL_KEY= satırından sonra fal.ai API anahtarını yapıştır.

4. Dosyayı kaydet.

5. mini-app/ klasöründe terminalden: npm start

6. Tarayıcıdan: http://localhost:3000

İlk açılışta dashboard hazır. Form doldur, "Üret" bas, video kuyruğa alınır.
```

### 5. Otomatik başlatma (opsiyonel — kullanıcı isterse)
Kullanıcı "şimdi başlat", ".env'i de doldur ve aç" gibi bir şey derse:
- API key'i kullanıcıdan al (uyararak: "Anahtar buraya geçecek, sonra sil tavsiye ederim")
- `.env` dosyasını oluştur
- `npm start` background'da çalıştır
- "http://localhost:3000 hazır" de

Default davranış: kullanıcı kendi .env'i doldursun, kendi başlatsın (daha güvenli).

## Mini app'in özellikleri (kullanıcı bilsin)

- **Form alanları:** marka/ürün, tarz dropdown (8 tarz), süre (4/6/8/10/12s), kalite seviyesi (Ekonomik/Standart/Premium/Uzun), görsel upload, diyalog (opsiyonel — boşsa AI yazar).
- **Maliyet tahmini:** form değiştikçe canlı.
- **Üretim listesi:** geçmiş tüm üretimler kart şeklinde, status (kuyrukta/üretiliyor/hazır/hata), video player, indirme butonu.
- **Otomatik altyazı:** her video bittiğinde arka planda auto-subtitle çalışır, Türkçe altyazı eklenir.
- **Failure mode handling:** 422 (prompt reject) ve 500 (MCP/fal payload) hataları yakalanır, kullanıcıya net mesaj gösterilir.

## Mimari (referans için)

```
Tarayıcı (public/index.html)
  ↓ fetch POST /api/produce
mini-app/server.js (Express)
  ↓ HTTP REST
queue.fal.run/{endpoint}/{...}  ← fal.ai API doğrudan (MCP DEĞİL)
  ↓ poll
data/jobs.json (yerel storage)
```

Mini app fal.ai REST API'sini doğrudan çağırır (MCP üzerinden DEĞİL). Bu yüzden Claude Code çalışmıyorken bile çalışır — bağımsızdır.

## Asla yapma

- `mini-app/` klasörü zaten varsa, sormadan üzerine yazma.
- API key'i kullanıcıdan istemeden başlatma.
- Backend'e API key hardcode etme (her zaman `.env`'den oku).
- Üretim öncesi maliyet onayı atlamayan UI kurma — frontend her zaman onay butonuyla göndersin.
- İzinli model havuzu dışında model seçtirme — UI'da sadece izinli seviyeler (Ekonomik/Standart/Premium/Uzun) görünür.
- `npm install`'u kullanıcıya sormadan dünyaya çıkarma — onay sonrası yap.
