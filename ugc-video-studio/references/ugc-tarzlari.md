# UGC Tarz Kütüphanesi

Bu dosya, kullanıcıya sunulacak UGC tarzlarını ve her birinin nasıl yapılandırılacağını içerir. Kullanıcı tarz seçmediyse aşağıdaki kısa menüyü sun, sonra seçilen tarzın detay bölümünü uygula.

## Kullanıcıya sunulacak kısa menü

Şunun gibi sun (kısa tut):

1. **Samimi İtiraf** — Gerçek bir kullanıcı kameraya içtenlikle ürünü anlatır. En çok dönüşüm getiren klasik UGC. (varsayılan)
2. **Heyecanlı Keşif (Unboxing)** — Ürün kutudan çıkarılır, ilk izlenim heyecanı.
3. **Problem–Çözüm** — Bir sorun gösterilir, ürün çözüm olarak sunulur.
4. **Sokak Röportajı** — Sokakta biriyle yapılan doğal mini röportaj havası.
5. **Lüks / Estetik** — Yavaş, sinematik, premium his. Pahalı ürünler için.
6. **Komik / Eğlenceli** — Mizah ve abartı ile dikkat çeker, viral potansiyel.
7. **Uzman Tavsiyesi** — Konunun uzmanı gibi görünen biri güven vererek anlatır.
8. **Önce–Sonra** — Dönüşüm/sonuç vurgusu (cilt, fitness, temizlik vb.).

---

## Tarz detayları

Her tarz için: kanca mantığı, karakter, kamera, ton ve örnek prompt iskeleti verilmiştir. İskeletteki `[ÜRÜN]`, `[FAYDA]`, `[DİYALOG]` gibi yerleri brifing'e göre doldur. Diyalog her zaman **Türkçe** yazılır; sahne yönergeleri İngilizce kalır.

### 1. Samimi İtiraf (Testimonial) — VARSAYILAN

- **Kanca:** İlk 2 saniyede doğrudan kameraya çarpıcı bir cümle ("Bunu 3 haftadır kullanıyorum ve cidden şaşırdım").
- **Karakter:** 25-35 yaş, sıradan ve içten görünümlü, abartısız.
- **Kamera:** Elde tutulan telefon hissi, hafif doğal sallantı, yüz yakın planı.
- **Ton:** İçten, sohbet eder gibi, satış yapmıyormuş gibi.
- **Ortam:** Ev içi — banyo, oturma odası, mutfak. Doğal ışık.

İskelet:
```
A handheld selfie-style vertical video. A relatable woman in her late 20s
sits in a softly lit home setting, talking directly to the camera with a
warm, casual, sincere tone — as if telling a close friend. She holds [ÜRÜN]
clearly visible to camera. Natural daylight, slight handheld movement.
First 2 seconds: an attention-grabbing honest opener.
She says in Turkish (native Turkish accent): "[DİYALOG — Türkçe]"
Burned-in Turkish subtitles at the bottom, clean modern font.
Authentic, unpolished, trustworthy mood. Soft ambient room tone.
```

### 2. Heyecanlı Keşif (Unboxing)

- **Kanca:** Kutuya/pakete heyecanla bakış, "Sonunda geldi!".
- **Karakter:** Enerjik, meraklı, hareketli.
- **Kamera:** Ürüne ve ellere yakın çekimler, hızlı ama akıcı.
- **Ton:** Heyecanlı, pozitif, tempolu.

İskelet:
```
Vertical handheld video, energetic and bright. A person excitedly opens the
packaging of [ÜRÜN]. Quick close-ups of hands revealing the product, genuine
surprise and delight on their face. First 2 seconds: the box/packaging with
an excited reaction. Dynamic but smooth camera, vibrant lighting.
They say in Turkish (native Turkish accent): "[DİYALOG — Türkçe]"
Burned-in Turkish subtitles, bold modern font. Upbeat, fun energy with light
background music feel.
```

### 3. Problem–Çözüm

- **Kanca:** İlk 2 saniyede tanıdık bir sıkıntı gösterilir.
- **Yapı:** Problem (2 sn) → ürün devreye girer → rahatlama/çözüm.
- **Ton:** Empatik başlar, çözümle birlikte aydınlanır.

İskelet:
```
Vertical video. Opens on a relatable everyday frustration related to [PROBLEM]
— shown clearly in the first 2 seconds with a slightly annoyed expression.
Then the person picks up [ÜRÜN] and the mood shifts to relief and satisfaction.
Handheld, natural light, expressive face. They say in Turkish (native Turkish
accent): "[DİYALOG — önce sorun, sonra çözüm, Türkçe]". Burned-in Turkish
subtitles. Emotional arc from frustration to relief.
```

### 4. Sokak Röportajı

- **Kanca:** Ani, doğal "Pardon, bir saniyenizi alabilir miyim?" havası.
- **Karakter:** Röportajı veren sıradan biri, doğal tepkiler.
- **Kamera:** Dışarıda, hafif hareketli, arka planda şehir/sokak.

İskelet:
```
Vertical street-interview style video on a busy sidewalk. Casual, candid mood.
A passerby is asked about [ÜRÜN / KONU] and answers naturally and positively,
slightly surprised, authentic reactions. Handheld documentary feel, natural
outdoor light, blurred city background. They say in Turkish (native Turkish
accent): "[DİYALOG — Türkçe]". Burned-in Turkish subtitles. Real, unscripted feel.
```

### 5. Lüks / Estetik

- **Kanca:** Yavaş, etkileyici bir ürün belirişi.
- **Kamera:** Yavaş kaydırma, makro detaylar, sinematik.
- **Ton:** Sakin, prestijli, az konuşma çok atmosfer.

İskelet:
```
Vertical cinematic video, premium aesthetic. Slow, elegant camera movement.
[ÜRÜN] presented with macro detail shots, soft directional lighting, refined
color grading, shallow depth of field. Minimal, sophisticated mood. A calm
confident voice in Turkish (native Turkish accent) says: "[DİYALOG — kısa,
prestijli, Türkçe]". Burned-in elegant Turkish subtitles, thin minimalist
font. Luxurious, aspirational atmosphere with subtle ambient sound.
```

### 6. Komik / Eğlenceli

- **Kanca:** Beklenmedik, abartılı bir açılış.
- **Ton:** Mizah, abartı, hızlı tempo. Viral hedefli.

İskelet:
```
Vertical video, comedic and exaggerated. An over-the-top funny scenario
involving [ÜRÜN]. First 2 seconds: an unexpected, humorous hook. Expressive
acting, playful timing, bright energetic look. They say in Turkish (native
Turkish accent) with comedic delivery: "[DİYALOG — esprili, Türkçe]".
Burned-in Turkish subtitles, bold playful font. Light, funny, shareable mood.
```

### 7. Uzman Tavsiyesi

- **Kanca:** Otorite kuran bir açılış ("X konusunda 10 yıldır çalışıyorum, şunu söyleyeyim...").
- **Karakter:** Güven veren, sakin, bilgili görünüm.
- **Ton:** Net, bilgilendirici, ikna edici ama satışçı değil.

İskelet:
```
Vertical video, credible and clean look. A knowledgeable, trustworthy person
in a professional-but-approachable setting explains why [ÜRÜN] works, citing
a clear benefit [FAYDA]. Steady camera, soft professional lighting, confident
posture. First 2 seconds: an authority-building opener. They say in Turkish
(native Turkish accent): "[DİYALOG — bilgilendirici, Türkçe]". Burned-in
Turkish subtitles, clean professional font. Reassuring, expert tone.
```

### 8. Önce–Sonra

- **Kanca:** "Bakın 2 hafta önce nasıldı..." karşılaştırma vaadi.
- **Yapı:** Önce durumu → ürün → sonra durumu / sonuç.
- **Ton:** Kanıt odaklı, etkileyici dönüşüm.

İskelet:
```
Vertical video showing a clear before-and-after transformation related to
[FAYDA]. First 2 seconds: the "before" state with a hook line. Then [ÜRÜN]
is introduced, transitioning to the improved "after" state. Handheld,
natural light, honest framing. They say in Turkish (native Turkish accent):
"[DİYALOG — önce/sonra anlatımı, Türkçe]". Burned-in Turkish subtitles.
Convincing, results-driven mood.
```

---

## Tarzları birleştirme

Kullanıcı isterse tarzlar harmanlanabilir (örn. "Problem–Çözüm ama komik tonda"). Bu durumda ana yapıyı bir tarzdan, tonu diğerinden al. Ama prompt'u yine zengin ve tek tutarlı sahne olarak yaz — iki tarzı çakıştırıp kafa karıştırma.
