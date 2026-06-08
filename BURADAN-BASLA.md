# UGC Video Studio — Eğitim Paketi

Türkçe konuşan, altyazılı, profesyonel UGC reklam videolarını Claude Code + fal.ai ile, hiç manuel işlem yapmadan, sadece Türkçe yazarak üretmek için hazırlanmış komple paket.

## Bu pakette ne var?

```
ugc-paket/
├── BURADAN-BASLA.md            ← şu an okuduğun dosya
├── ugc-video-studio/           ← ANA SKILL (UGC üretimi — chat akışı)
│   ├── SKILL.md
│   └── references/
│       ├── ugc-tarzlari.md         (8 UGC tarzı + prompt iskeletleri)
│       ├── prompt-rehberi.md       (zengin prompt üretim kuralları)
│       └── model-ve-maliyet.md     (model havuzu + maliyet + hata davranışları)
├── mini-app-builder/           ← İKİNCİ SKILL (lokal dashboard kurar)
│   ├── SKILL.md
│   └── templates/                  (Express + HTML şablonları)
└── dokumanlar/
    ├── KURULUM-KILAVUZU.md     ← sıfırdan kurulum (terminal bilmeyenler için)
    ├── ORNEK-PROMPTLAR.md      ← kopyala-yapıştır hazır örnekler
    └── APP-YOL-HARITASI.md     ← müşteriye satma / app'e dönüştürme
```

> **İki kullanım modu:** Chat'te `"UGC videosu üret"` deyince ana skill üretir. `"Mini app'e dönüştür"` deyince ikinci skill, lokal bir Express dashboard kurar — sonra tarayıcıdan `http://localhost:3000`'da aynı işi yaparsın.

## Eğitimde hangi sırayla anlat

1. **Mantığı göster** — Claude Code video üretmez; fal.ai üretir, MCP köprü kurar, skill kuralları koyar. (KURULUM-KILAVUZU.md'nin başındaki "Genel mantık" bölümü)
2. **Canlı kurulum** — KURULUM-KILAVUZU.md'yi adım adım ekranda yap. fal.ai hesabı → API key → Claude Code → skill yerleştirme → MCP bağlama.
3. **İlk video** — ORNEK-PROMPTLAR.md'den 1 numarayı canlı çalıştır. Maliyet onayı ekranını göster (önemli: habersiz para harcanmıyor).
4. **Zenginliği göster** — tarz değiştir, ürün görseli ver, A/B varyasyon üret, kalite moduna geç.
5. **Para kazanma** — APP-YOL-HARITASI.md'deki 3 seviyeyi anlat. Seviye 1 (hizmet olarak satış) bugün başlayabilir.

## Bu paketin çözdüğü problemler

- **"Model karışır mı?"** → Hayır. Skill modeli `veo3.1/fast`'e sabitler, katalog aramasını yasaklar. Tutarlı sonuç.
- **"Habersiz para harcar mıyım?"** → Hayır. Her üretim öncesi maliyet söylenir ve onay istenir.
- **"İngilizce çıkar mı?"** → Hayır. Ses her zaman Türkçe, altyazı Türkçe.
- **"Basit/sönük olur mu?"** → Hayır. 8 tarz, zengin sinematik prompt, ürün görseli desteği, çok sahneli üretim, A/B varyasyon.
- **"Terminal bilmiyorum"** → Kurulum kılavuzu sıfır terminal bilgisi varsayarak yazıldı.
- **"Bunu satabilir miyim?"** → Evet. App yol haritası 3 seviyeli iş modeli sunuyor.

## Hızlı özet (afiş gibi)

> fal.ai hesabı aç → API key al → Claude Code kur → **iki skill'i de** `.claude/skills/` içine koy → tek komutla MCP bağla → Türkçe yaz, video al. İstersen `"mini app'e dönüştür"` de — tarayıcıdan kullanırsın.

Maliyet: 8 saniyelik Türkçe sesli video ≈ **1.20 dolar** (kullandıkça öde, abonelik yok).

Detaylar için `dokumanlar/KURULUM-KILAVUZU.md` ile başla.
