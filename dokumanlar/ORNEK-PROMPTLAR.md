# Örnek Prompt Kartı — Kopyala, Yapıştır, Üret

Aşağıdakileri Claude Code'a olduğu gibi yapıştırabilirsin. Köşeli parantezli yerleri kendi ürününle değiştir. Her seferinde başına "UGC video studio skill'ini kullan" yazman, doğru akışın çalışmasını garantiler.

---

## 1. En basit kullanım (her şeyi skill'e bırak)

```
UGC video studio skill'ini kullan. [ÜRÜN/HİZMET] için bir UGC reklam
videosu üret. Sen karar ver.
```

Skill tarzı seçtirir, sahneyi kurar, maliyeti söyler, onay alır.

---

## 2. Tarz belirterek

```
UGC video studio skill'ini kullan. [ÜRÜN] için "Problem–Çözüm" tarzında,
dikey, Türkçe sesli, altyazılı bir UGC videosu üret. Genç bir kadın
anlatsın, samimi olsun.
```

Tarz seçenekleri: Samimi İtiraf · Heyecanlı Keşif · Problem–Çözüm · Sokak Röportajı · Lüks/Estetik · Komik/Eğlenceli · Uzman Tavsiyesi · Önce–Sonra

---

## 3. Ürün görseli ile

Önce ürün görselini Claude Code'a yükle (sürükle-bırak veya yolunu ver), sonra:

```
UGC video studio skill'ini kullan. Yüklediğim ürün görselini kullanarak
bir UGC videosu üret. Karakter bu ürünü elinde tutsun ve net görünsün.
Lüks/Estetik tarzı, Türkçe.
```

---

## 4. Diyaloğu kendin yazmak istersen

```
UGC video studio skill'ini kullan. [ÜRÜN] için Samimi İtiraf tarzında
video üret. Karakter şunu söylesin: "[KENDİ TÜRKÇE DİYALOĞUN — kısa,
2-3 cümle]". Altyazılı, dikey.
```

---

## 5. A/B test için varyasyon

```
UGC video studio skill'ini kullan. [ÜRÜN] için 3 farklı kancayla 3 ayrı
kısa UGC videosu üret — hangisinin daha çok ilgi çekeceğini test edeceğim.
Hepsi Türkçe, dikey, altyazılı. Toplam maliyeti tek seferde söyle.
```

---

## 6. Daha uzun video (9-15 sn — tek sahnede)

```
UGC video studio skill'ini kullan. [ÜRÜN] için 12 saniyelik bir UGC
videosu istiyorum. Türkçe, dikey, altyazılı.
```

Skill 9-15 sn aralığında otomatik olarak **Seedance 2.0 Fast**'a geçer (Veo
ailesi max 8 sn destekliyor). Maliyet 12 sn / 1080p için ~$1.10-1.50 arası.

## 7. Çok sahneli reklam (15 sn+)

```
UGC video studio skill'ini kullan. [ÜRÜN] için yaklaşık 24 saniyelik,
3 sahneli bir reklam üret: kanca (8 sn) → ürün tanıtımı (8 sn) →
çağrı (8 sn). Karakter ve ortam sahneler boyunca aynı kalsın. Türkçe,
dikey, altyazılı. Birleştirme için sahne linklerini ayrı ver.
```

Skill her sahneyi ayrı üretir (toplam maliyeti tek onayda gösterir),
sahneler arası karakter/ortam tutarlılığını prompt yenidengiriminden
korumaya çalışır. Sahne birleştirme skill kapsamı dışıdır — sana 3 ayrı
MP4 verilir, sen CapCut / ffmpeg ile birleştirirsin.

---

## 8. Kalite modu (daha pahalı, daha iyi görüntü)

```
UGC video studio skill'ini kullan. [ÜRÜN] için en iyi kalitede, premium
bir UGC videosu üret. Lüks/Estetik tarzı, Türkçe, altyazılı.
```

"Kalite/premium/en iyi" dediğinde skill otomatik olarak **standart Veo 3.1**'e
geçer ve maliyeti ona göre söyler (~$3.20 / 8 sn).

## 9. Ekonomik mod (öğrenme / hızlı varyasyon)

```
UGC video studio skill'ini kullan. [ÜRÜN] için ucuz / öğrenme amaçlı bir
UGC videosu üret. Sadece akışı görmek istiyorum.
```

"Ucuz / bütçe / öğrenme amaçlı" dediğinde skill **Veo 3.1 Lite**'a geçer
(~$0.40 / 8 sn). Kalite Fast'tan biraz daha düşük ama uçtan uca akışı
test etmek için ideal.

---

## İyileştirme komutları (üretimden sonra)

Video geldikten sonra şunları diyebilirsin:

- "Tonu daha enerjik yap, yeniden üret"
- "Altyazı fontu daha kalın ve büyük olsun"
- "Diyaloğu kısalt, telaffuz daha temiz olsun"
- "Aynı sahneyi farklı bir kancayla tekrar üret"
- "Bu sefer Komik tarzında dene"
- "Karakteri biraz daha yaşlı/genç yap"

---

## Hatırlatma

- Her üretimde skill **önce maliyeti söyler ve onay ister** — habersiz para harcanmaz.
- Onay vermeden "evet/üret" yazmadıkça üretim başlamaz.
- Diyalog her zaman Türkçe; 8 saniyeye 2-3 kısa cümle sığar.

---

## YENİ: Görsel → Video onaylı akış (kör üretim istemeyenler için)

```
UGC video studio skill'ini kullan. [ÜRÜN] için bir UGC videosu istiyorum
ama önce sahneyi görsel olarak göreyim, onaylayınca videoya çevir.
Influencer ürünü [ORTAM — örn. modern bir mutfakta] kullanıyor olsun.
```

Skill önce sahneyi görsel üretir, sana gösterir, "uygun mu?" diye sorar;
sen onayınca videoya çevirir + altyazı ekler. Pahalı video öncesi sahneyi
kilitlersin — hem maliyet hem kalite kazancı.

---

## YENİ: Ürün + ortam + influencer tutarlılığı (Seedance pipeline)

Ürün görselini (ve varsa influencer referansını) yükle, sonra:

```
UGC video studio skill'ini kullan. Yüklediğim ürün görselini kullan.
Ürün tüm videoda net ve tutarlı görünsün — logosu, etiketi bozulmasın.
Influencer ürünü elinde tutarak [ORTAM] içinde Türkçe anlatsın.
```

Skill bu işte otomatik olarak ürün tutarlılığını koruyan modeli seçer.

---

## YENİ: Mini app'e dönüştür (lokal dashboard)

Chat akışı yerine tarayıcıdan kullanmak istersen:

```
Mini app'e dönüştür. Lokal bir dashboard kur.
```

Claude `mini-app-builder` skill'ini devreye alır, `mini-app/` klasörünü açar, Express + HTML dashboard'unu kurar, `npm install` çalıştırır. Sonra `.env`'e API key'ini yapıştırıp `npm start` dersin → `http://localhost:3000`'da aynı 8 tarz + kalite seçimi + üretim listesi tarayıcıdan çalışır. Aynı kurallar (model havuzu sabit, Türkçe ses, maliyet onayı, otomatik altyazı) korunur.

Kim için yararlı: müşterilerine paneli açmak isteyen freelancer/ajans, terminal-fobik kullanıcılar, takım üyeleri.

---

## YENİ: Altyazı hakkında

Altyazı artık videonun içine ayrı bir profesyonel modelle ekleniyor
(kelime-vurgulu, doğru zamanlı, Türkçe). Bozuk/yanlış altyazı riski yok.
Altyazıyı beğenmezsen:

```
Altyazı fontunu daha büyük ve sarı yap, kelime kelime aksın. Sadece
altyazıyı yenile, videoyu tekrar üretme.
```

Bu, sadece altyazı adımını tekrarlar — videoyu yeniden üretmez, hızlı ve ucuz.
