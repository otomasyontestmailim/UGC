# UGC Video Studio — Mini App (Local)

Tek makinede çalışan UGC video üretim dashboard'u. fal.ai REST API'sini doğrudan çağırır.

## Kurulum (3 adım)

1. **fal.ai API anahtarını yapıştır:**
   - `.env.example` dosyasını `.env` olarak kopyala.
   - `FAL_KEY=` satırından sonra anahtarını yapıştır. Kaydet.

2. **Bağımlılıkları kur** (sadece ilk seferde):
   ```
   npm install
   ```

3. **Başlat:**
   ```
   npm start
   ```

   Tarayıcıdan: <http://localhost:3000>

## Özellikler

- 8 UGC tarzı (Samimi İtiraf, Heyecanlı Keşif, Problem–Çözüm, Sokak Röportajı, Lüks/Estetik, Komik/Eğlenceli, Uzman Tavsiyesi, Önce–Sonra)
- 4 kalite seviyesi (Ekonomik / Standart / Premium / Uzun)
- Görsel upload (image-to-video)
- Canlı maliyet tahmini
- Otomatik Türkçe altyazı (auto-subtitle)
- Üretim geçmişi, video oynatıcı, indir

## Modeller (sabit, değiştirilmez)

| Seviye | Model | 8 sn fiyat |
|---|---|---|
| Ekonomik | Veo 3.1 Lite | ~$0.40 |
| Standart (varsayılan) | Veo 3.1 Fast | ~$1.20 |
| Premium | Veo 3.1 | ~$3.20 |
| Uzun (9–15 sn) | Seedance 2.0 Fast | ~$1.10–1.50 |

Altyazı her zaman ayrı çağrı: auto-subtitle (~$0.01).

## Güvenlik

- API key sadece `.env` içinde — git'e gönderme (`.gitignore`'da).
- App sadece **localhost**'a açar — internete açma. Public deployment için backend'i bir cloud (Vercel/Railway/Render) servise koy.

## Sorun çıkarsa

- **"Cannot find module 'express'"** → `npm install` çalıştırdın mı?
- **"401 Unauthorized" / "Missing FAL_KEY"** → `.env` dosyası var mı, içine API key doğru yazıldı mı?
- **"Check Error" / üretim başarısız ama bakiyeden düşmedi** → fal'in prompt'u reddetti (içerik moderation). Promptu sadeleştirip yeniden dene. Para kesilmez.
- **Port 3000 doluysa** → `.env`'de `PORT=3001` yaz, yeniden başlat.

Daha fazla detay: paket içindeki `dokumanlar/KURULUM-KILAVUZU.md` ve `ugc-video-studio/SKILL.md`.
