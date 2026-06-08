# UGC Video Studio — Sıfırdan Kurulum Kılavuzu

Bu kılavuz, daha önce terminal kullanmamış biri için yazıldı. Her adımı sırayla yap, atlama. Tahmini süre: 15-20 dakika.

Sonunda şunu yapabiliyor olacaksın: Claude Code'a Türkçe bir cümle yazıp ("X ürünü için TikTok videosu yap") satışa hazır bir video almak.

---

## Genel mantık (önce bunu anla)

Üç parça var:

1. **Claude Code** — bilgisayarında çalışan, senin yerine işleri yapan yapay zeka asistanı (terminalde çalışır).
2. **fal.ai** — videoyu fiilen üreten servis. Sen kullandıkça ödersin, aylık abonelik yok.
3. **MCP bağlantısı** — Claude Code ile fal.ai'yi birbirine bağlayan köprü. Bir kez kurarsın, bir daha uğraşmazsın.
4. **Skill (bu paket)** — Claude Code'a "UGC videosunu şu kurallarla üret" diye öğreten talimat klasörü.

Akış: Sen Claude Code'a Türkçe yazarsın → Skill devreye girer → fal.ai videoyu üretir → sana video linki gelir.

---

## ADIM 1 — fal.ai hesabı aç ve API anahtarı al

API anahtarı, fal.ai'nin "bu kişi benim, faturayı bana kes" diye tanıdığı gizli bir şifredir.

1. Tarayıcıdan **fal.ai** sitesine git, sağ üstten **Sign up** ile ücretsiz kayıt ol (Google ile giriş en kolayı).
2. Giriş yaptıktan sonra hesap ayarlarında **API Keys** (veya **Keys**) bölümünü bul.
3. **Create API Key** / **Yeni anahtar oluştur** butonuna bas.
4. Karşına `uuid:hex` formatında (örnek: `a1b2c3d4-5e6f-7890-abcd-ef1234567890:9876543210fedcba9876543210fedcba`) uzun bir karakter dizisi çıkacak. **Bunu kopyala ve güvenli bir yere yapıştır** (Not Defteri'ne geçici olarak). Bu pencereyi kapatınca bir daha gösterilmez.
5. **Önemli:** Bu anahtarı kimseyle paylaşma, ekran görüntüsünde göstermeyeceğin yere not al. Anahtarı olan herkes senin hesabından video üretip sana fatura çıkarabilir.

> **Para konusu:** fal.ai kullandıkça öde mantığında. Yeni hesaplara genelde bir miktar deneme kredisi verilir. Sonrasında hesabına kredi kartı ekleyip kullandığın kadar ödersin. 8 saniyelik Türkçe sesli bir video yaklaşık **1.20 dolar** tutar. Önce küçük bir bakiye/limit koyman önerilir.

---

## ADIM 2 — Claude Code kurulu mu? Kontrol et / kur

Claude Code zaten kuruluysa bu adımı atla. Değilse:

### Önce Node.js gerekiyor

Claude Code'un çalışması için bilgisayarında "Node.js" denen bir altyapı olmalı.

- **nodejs.org** adresine git, büyük yeşil indirme butonundan **LTS** sürümünü indir, kurulumu çalıştır, hep "İleri / Next" diyerek bitir.

### Terminali aç

Terminal, bilgisayara yazıyla komut verdiğin siyah/beyaz pencere. Korkutucu değil, sadece bir metin kutusu.

- **Windows:** Başlat menüsüne `PowerShell` yaz, çıkanı aç.
- **Mac:** Spotlight'a (Cmd+Boşluk) `Terminal` yaz, çıkanı aç.

### Claude Code'u kur

Terminale **tam olarak şunu** yapıştır ve Enter'a bas:

```
npm i -g @anthropic-ai/claude-code
```

Birkaç dakika sürebilir, satırlar akar — normal. Bittiğinde tekrar yazı yazabildiğin satıra dönersin.

Kurulduğunu doğrulamak için:

```
claude --version
```

Bir sürüm numarası görüyorsan tamamdır.

---

## ADIM 3 — Proje klasörünü hazırla ve skill'i yerleştir

1. Bilgisayarında bu işe özel bir klasör oluştur. Örneğin Masaüstü'nde `ugc-studio` adında bir klasör aç (sağ tık → Yeni Klasör).
2. Bu paketteki **`ugc-video-studio`** klasörünün tamamını, az önce açtığın `ugc-studio` klasörünün içine `.claude/skills/` yolunun altına kopyala. Sonuç şu yapıda olmalı:

```
ugc-studio/
└── .claude/
    └── skills/
        └── ugc-video-studio/
            ├── SKILL.md
            └── references/
                ├── ugc-tarzlari.md
                ├── prompt-rehberi.md
                └── model-ve-maliyet.md
```

> `.claude` klasörü başında nokta olduğu için bazı sistemlerde "gizli" görünür. Klasörü oluştururken adını tam olarak `.claude` yaz. Windows'ta nokta ile başlayan klasör oluşturamazsan, klasörü `.claude.` (sonunda da nokta) olarak oluştur — Windows sondaki noktayı otomatik siler ve `.claude` kalır.

---

## ADIM 4 — Claude Code'u proje klasöründe başlat

Terminalde önce proje klasörüne girmen lazım. Terminale şunu yaz (yolu kendi klasörüne göre düzelt):

**Mac:**
```
cd ~/Desktop/ugc-studio
```

**Windows:**
```
cd $HOME\Desktop\ugc-studio
```

Sonra Claude Code'u başlat:

```
claude
```

Claude Code açıldı. Artık buraya Türkçe yazabilirsin.

---

## ADIM 5 — fal.ai MCP köprüsünü bağla (tek seferlik)

Bu adımı bir kez yaparsın, bir daha gerekmez.

Claude Code açıkken, terminalde **yeni bir terminal sekmesi/penceresi** aç (Claude Code'u kapatmadan) ve aşağıdaki komutu yapıştır. `SENIN_API_ANAHTARIN` yazan yere, Adım 1'de kopyaladığın gerçek anahtarı yapıştır:

```
claude mcp add --scope user --transport http fal-ai https://mcp.fal.ai/mcp --header "Authorization: Bearer SENIN_API_ANAHTARIN"
```

> **Neden `--scope user`?** Bu flag MCP bağlantısını **tüm projelerinde** geçerli yapar — her klasörde Claude Code açtığında fal-ai otomatik bağlı gelir. Olmazsa MCP sadece o anki klasöre kaydolur ve başka klasörlerden erişilemez.

Örnek (anahtar gerçek formatta ama uydurma):
```
claude mcp add --scope user --transport http fal-ai https://mcp.fal.ai/mcp --header "Authorization: Bearer a1b2c3d4-5e6f-7890-abcd-ef1234567890:9876543210fedcba9876543210fedcba"
```

Enter'a bas. "Added HTTP MCP server fal-ai ... to user config" benzeri bir mesaj görmelisin.

Bağlantının sağlıklı eklendiğini hemen doğrulamak için:
```
claude mcp list
```

Çıktıda şu satırı görmelisin:
```
fal-ai: https://mcp.fal.ai/mcp (HTTP) - ✓ Connected
```

"Connected" yerine "Needs authentication" görüyorsan anahtarda boşluk/eksik karakter olabilir — komutu baştan yapıştır.

> Not: fal.ai MCP şu an Claude Code, Cursor ve Windsurf ile çalışır. Claude masaüstü uygulaması / claude.ai web sürümü bu bağlantıyı henüz desteklemiyor. Bu yüzden bu işi **Claude Code (terminal)** üzerinden yapıyoruz.

---

## ADIM 6 — Claude Code'u yeniden başlat

Bağlantının aktif olması için Claude Code'u kapatıp aç:

1. Claude Code'un çalıştığı pencerede `exit` yaz, Enter.
2. Tekrar `claude` yaz, Enter.

Bağlantıyı doğrulamak için Claude Code'a şunu yaz:

```
fal.ai bağlantım çalışıyor mu? Mevcut araçlarını kontrol et.
```

Claude Code fal araçlarını görüyorsa hazırsın.

---

## ADIM 7 — İlk videonu üret

Artık tek yapman gereken Türkçe yazmak. Claude Code'a örnek bir istek yaz:

```
UGC video studio skill'ini kullan. Doğal cilt bakım serumu tanıtan
bir UGC videosu üret. Genç bir kadın, banyoda, samimi tonda Türkçe
konuşsun. TikTok formatı, altyazılı.
```

Bundan sonra Claude Code:
1. Eksik bilgi varsa sana **tek seferde** sorar (tarz vb.).
2. Profesyonel bir sahne hazırlar ve Türkçe özetini gösterir.
3. **Tahmini maliyeti söyler ve onay ister.** ("~1.20 dolar, onaylıyor musun?")
4. Sen "evet / üret" deyince üretir (birkaç dakika sürer).
5. Video linkini verir.

Beğenmediğin yer olursa "tonu daha enerjik yap", "altyazı fontu daha kalın olsun", "başka bir tarz dene" gibi söyle — yeniden üretir.

`ORNEK-PROMPTLAR.md` dosyasında kopyala-yapıştır hazır daha fazla örnek var.

---

## Sık karşılaşılan sorunlar

**"command not found: claude"** → Node.js düzgün kurulmamış olabilir. Adım 2'yi tekrar yap, terminali kapatıp aç.

**"command not found: cd" veya yol bulunamadı** → Klasör yolunu yanlış yazmışsındır. Klasöre dosya gezgininden gir, adres çubuğundaki yolu kopyalayıp `cd` komutundan sonra yapıştır.

**Claude Code fal araçlarını görmüyor** → Adım 5'teki komutta API anahtarını yanlış yapıştırmış olabilirsin (başında/sonunda boşluk, eksik karakter) veya `--scope user` flag'ını eklemeyi unutmuş olabilirsin. `claude mcp list` ile durumu kontrol et — "fal-ai" satırı yoksa Adım 5'i tekrarla (mutlaka `--scope user` ile). Sonra Adım 6'daki gibi Claude Code'u kapatıp aç (mevcut oturum yeni MCP'yi yüklemez).

**"401 / Unauthorized" hatası** → API anahtarı geçersiz veya süresi dolmuş. fal.ai'de yeni anahtar oluştur, Adım 5'i tekrarla.

**Üretim başarısız ama bakiyeden düşmedi (dashboard'da "Check Error")** → fal sunucusu prompt'u **içerik moderation/format** gerekçesiyle reddetmiş demektir. Bu durumda Claude Code, fal MCP'sinin tasarımı gereği "üretim başarısız oldu, para kesilmedi" diye uyarır. Yapacakların:
1. Üretim prompt'unu sadeleştir (özellikle marka/AI/satış vurgulu içeriklerden bahsediliyorsa).
2. Skill içinde `auto_fix: true` zaten ayarlı — bu fal'in prompt'u kendi düzeltmesine izin verir.
3. Hata sürerse modeli değiştirip yeniden dene (Veo 3.1 Fast en güvenilir geçer).
4. Detaylı tanı için `https://fal.ai/dashboard/requests` adresinden ilgili request'i aç.

**Video üretimi çok uzun sürüyor** → Normal. Video üretimi birkaç dakika sürer (Fast modellerde 30-90 sn, premium modellerde 2-4 dk). Claude Code "hâlâ üretiliyor" diyorsa bekle.

**Türkçe telaffuz garip çıktı** → Claude Code'a "diyaloğu kısalt ve sadeleştirip yeniden üret" de. Kısa Türkçe cümleler daha temiz okunur. Veo 3.1 Fast en temiz Türkçe ses üretiyor.

**"Skill yüklenmedi" / "ugc-video-studio görünmüyor"** → `.claude/skills/ugc-video-studio/SKILL.md` dosyasının var olduğunu kontrol et. Yoksa Adım 3'ü tekrarla. Klasör yapısı `.claude/skills/ugc-video-studio/SKILL.md` şeklinde tam yoldadır (tek nokta önemli).

---

## Güvenlik notları

- API anahtarın **senin bilgisayarında** kalır, fal'ın MCP sunucusu onu saklamaz/loglamaz; her istekte anlık gönderilir.
- Anahtarını GitHub'a, ekran görüntüsüne, paylaşılan dosyalara koyma.
- fal.ai hesabında harcama limiti/uyarısı ayarlaman önerilir — beklenmedik maliyetlere karşı.
