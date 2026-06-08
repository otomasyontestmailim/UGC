# Prompt Mühendisliği Rehberi

Kullanıcının kısa cümlesini profesyonel bir video prompt'una çevirme kuralları. Amaç: "basit UGC yaptı geçti" değil, satışa hazır içerik.

## Altın kural

Kullanıcının cümlesini ASLA ham gönderme. Kullanıcı "vitamin serumu için video" der; sen 15-25 satırlık, sinematik, yapılandırılmış sahne yazarsın. Sahne yönergeleri İngilizce (modeller İngilizce'yi daha iyi yorumlar), karakterin söylediği diyalog Türkçe.

## Altyazı artık PROMPTTA DEĞİL — ayrı model halleder

Önemli değişiklik: video üretim prompt'una "burned-in subtitles / captions" YAZMA. Altyazı, video üretildikten sonra ayrı bir modelle (`fal-ai/workflow-utilities/auto-subtitle`) ekleniyor (bkz. `model-ve-maliyet.md`). Bunun nedeni: video modelleri ekrana yazı gömmede tutarsız ve hatalı (bozuk harf, yanlış zamanlama). İşi ayırınca: video modeli sadece temiz görüntü+ses üretir, altyazı modeli profesyonel kelime-vurgulu altyazıyı ekler. Sonuç belirgin daha kaliteli.

Yani prompt'ta sadece: temiz görüntü, Türkçe konuşma, doğal ses iste. Altyazıyı düşünme.

## Zorunlu prompt bileşenleri (sırayla)

1. **Format** — "Vertical video" (9:16) ya da "Horizontal video" (16:9).
2. **2 saniyelik kanca** — İlk 2 saniyede ne olacak, izleyici neden durup izleyecek. En kritik kısım; kaydırmayı durduran budur.
3. **Karakter tanımı** — Yaş, görünüm, ruh hali. Çok sahnede/çoklu çekimde BİREBİR aynı tut.
4. **Ortam** — Mekan, zaman, atmosfer.
5. **Kamera** — Hareket (handheld, slow push-in, static, pan), mesafe (close-up, medium).
6. **Işık** — "natural daylight", "soft directional lighting", "golden hour" vb.
7. **Ürün anı** — Ürünün NET göründüğü an mutlaka tarif edilir. Görsel referans varsa "the product from the reference image, clearly visible".
8. **Türkçe diyalog** — Tırnak içinde, kısa, doğal. 8 saniyeye ~2-3 kısa cümle sığar. "spoken in Turkish, native Turkish accent" ekle.
9. **Ton/ruh hali ve ses** — "authentic, trustworthy mood", "natural ambient sound, no loud music" vb. (Ses tarifini açıkça yaz, yoksa model rastgele ses koyar.)

(Eskiden 10. madde "altyazı yönergesi" idi — KALDIRILDI, ayrı model yapıyor.)

## Diyalog yazma kuralları (kritik)

- 8 saniyeye ~2-3 kısa cümle sığar; fazlası kesilir/bozulur.
- Doğal konuşma dili olsun, reklam panosu gibi değil: "Bu ürün hayatımı değiştirdi" yerine "Cidden, ilk haftada farkı gördüm".
- Kanca cümlesi diyalogun ilk cümlesi; merak/itiraz uyandırsın.
- Çağrı kısa: "Linke bak", "Denemeye değer".

## İyi vs kötü örnek

**Kötü (ham):**
```
Vitamin C serumu tanıtan bir kız videosu yap
```

**İyi (skill'in üretmesi gereken — altyazı yönergesi YOK):**
```
Vertical handheld selfie-style video, 9:16. Soft morning light in a clean
bathroom. A relatable woman in her late 20s, fresh-faced, minimal makeup,
talking directly to camera like she's telling a friend a secret.

First 2 seconds (hook): she leans in slightly with a surprised, intrigued tone.

She holds a small vitamin C serum bottle, clearly visible, turning it once
so the label shows.

She says in Turkish (native Turkish accent):
"Cildim hep matlaşıyordu, hiçbir şey işe yaramıyordu. Bunu üç haftadır
kullanıyorum — sabah aynaya bakmak bile keyifli artık."

Camera: handheld, slight natural shake, medium close-up on her face, brief
close-up on the bottle.

Mood: authentic, honest, unpolished, trustworthy. Natural ambient bathroom
room tone, no background music. Clean realistic image, no on-screen text.
```

Not: son satırda "no on-screen text" diyerek modelin kendi yazısını engelliyoruz; altyazıyı ayrı model ekleyecek.

## Görsel → video onaylı akış için prompt notu

İki aşamalı akışta (önce görsel üret, onayla, sonra videoya çevir — bkz. SKILL.md "görsel önce" bölümü), görsel üretim prompt'u da aynı zenginlikte yazılır ama hareket/ses olmaz; sadece kompozisyon, ışık, ürün, ortam, karakter tarif edilir. Onaydan sonra o görsel image-to-video'ya referans verilir ve hareket+diyalog video prompt'unda eklenir.

## Model dili ipuçları

- Sesi açıkça tarif et ("she says...", "natural ambient sound", "no music").
- Film dili anlaşılır: "rack focus", "slow push-in", "establishing shot".
- Işık/ruh halini açıkça yaz: "overcast", "golden hour", "soft".
- Çoklu çekim/sahnede karakter ve ortam tanımını kelimesi kelimesine tekrarla.

## Türkçe ses notu

- Diyalogu doğrudan Türkçe yaz (İngilizce yazıp "Türkçe konuşsun" deme).
- "spoken in Turkish, native Turkish accent" ekle.
- Kısa tut. İlk denemede telaffuz kötüyse diyalogu sadeleştirip kısaltarak aynı modelle yeniden üret.
