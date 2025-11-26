# TL Çevirici

Tarayıcıda gezinirken karşılaştığınız yabancı para birimlerini (Dolar, Euro, Sterlin) otomatik olarak Türk Lirasına çeviren Chrome eklentisi.

## Özellikler

- Sayfadaki döviz değerlerini ($, €, £) algılayıp TL karşılığını gösterir
- TCMB (Türkiye Cumhuriyet Merkez Bankası) resmi kurlarını kullanır
- Güncel kur bilgilerini panel halinde gösterir
- Tüm web sitelerinde çalışır
- Basit ve kullanıcı dostu arayüz

## Kurulum

1. Bu repoyu bilgisayarınıza indirin veya klonlayın
2. Chrome tarayıcınızda `chrome://extensions/` adresine gidin
3. Sağ üst köşeden "Geliştirici modu"nu aktif edin
4. "Paketlenmemiş öğe yükle" butonuna tıklayın
5. İndirdiğiniz klasörü seçin

## Kullanım

1. Eklenti yüklendikten sonra, herhangi bir web sayfasını ziyaret edin
2. Eklenti simgesine tıklayın
3. "TL'ye Çevir" butonuna basın
4. Sayfadaki döviz değerleri otomatik olarak TL karşılıklarıyla birlikte gösterilecektir

## Teknik Detaylar

- **Manifest Version**: 3
- **Kur Kaynağı**: TCMB XML API (Yedek: ExchangeRate-API)
- **Desteklenen Para Birimleri**: USD, EUR, GBP
- **İzinler**: activeTab, storage

## Dosya Yapısı

```
my-tl-extension/
├── manifest.json       # Eklenti yapılandırması
├── popup.html          # Popup arayüzü
├── popup.js            # Popup mantığı
├── content.js          # Sayfa içeriği işleme
└── style.css           # Stil dosyası
```

## Geliştirici Notları

Eklenti, TCMB'nin günlük yayınladığı XML formatındaki döviz kurlarını kullanır. TCMB API'sine erişim sağlanamazsa, otomatik olarak yedek API'ye geçiş yapar.

## Katkıda Bulunma

Katkılarınızı bekliyoruz! Pull request göndermekten çekinmeyin.

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
