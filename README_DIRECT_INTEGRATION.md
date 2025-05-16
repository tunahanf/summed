# SumMed Doğrudan Google Gemini Entegrasyonu

Bu dokümanda, SumMed uygulamasına Google Gemini API'nin sunucu olmadan doğrudan entegrasyonu açıklanmaktadır.

## Genel Bakış

SumMed uygulaması, ilaç prospektüsü özetleme özelliği için artık harici bir Python sunucusuna gerek duymadan doğrudan Google Gemini API'ye bağlanmaktadır. Bu yaklaşımın avantajları:

1. Daha basit mimari - İlave bir sunucu çalıştırmanıza gerek yoktur
2. Daha düşük gecikme süresi - Araya bir sunucu koymadığınız için daha hızlı yanıtlar
3. Daha kolay dağıtım - Ek altyapı gerektirmez

## Nasıl Çalışır

1. Kullanıcı bir ilaç adı ve dozaj bilgisi girer veya bir ilaç kutusu tarar
2. Uygulama, kullanıcı profil bilgilerini dahil ederek doğrudan Google Gemini API'ye istek gönderir
3. API yanıtı analiz edilir ve uygulama tarafından okunabilir formata dönüştürülür
4. Özetlenmiş prospektüs bilgisi ekranda görüntülenir

## API Yapılandırması

Uygulama, Google Gemini API'yi kullanmak için bir API anahtarı kullanır. Bu anahtar doğrudan uygulama kodunda saklanır:

```typescript
const GEMINI_API_KEY = "AIzaSyCk5ADOp2Tkd4DcCeTQlAFGW5uVAhcSWzI";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
```

**ÖNEMLİ NOT:** Gerçek üretim ortamında, API anahtarının bu şekilde doğrudan kodda saklanması güvenli değildir. Bir üretim uygulaması için, bu anahtarı güvenli bir şekilde saklayacak bir çözüm uygulanmalıdır.

## Yanıt İşleme

Google Gemini API'den gelen metin yanıtı, uygulama tarafından şu şekilde işlenir:

1. Yanıt metin formatında alınır
2. `parseSummaryText` fonksiyonu ile metin analiz edilir
3. Analiz edilen metin, uygulama için uygun format olan `LeafletData` yapısına dönüştürülür

```typescript
{
  name: string;       // İlaç adı
  dosage: string;     // Dozaj bilgisi
  intendedUse: string; // Kullanım amacı
  howToUse: string[]; // Nasıl kullanılır (madde listesi)
  notRecommendedFor: string; // Kimler için önerilmez
}
```

## Hata Yönetimi

API istekleri başarısız olursa veya beklenmeyen bir format döndürürse, uygulama varsayılan içerik gösterecektir. Hata ayrıntıları konsola kaydedilir.

## Özelleştirme

Gemini AI'ye gönderilen prompt şablonu, doğrudan `getSummarizedLeaflet` fonksiyonunda değiştirilebilir. Bu, AI'nin nasıl yanıt verdiğini ve özetleme stilini değiştirmenize olanak tanır.
