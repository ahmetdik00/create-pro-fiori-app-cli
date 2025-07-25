# Fiori CLI - Profesyonel Fiori Proje Yöneticisi 🚀

`fiori-cli`, modern SAPUI5/Fiori projelerini saniyeler içinde oluşturmak ve yönetmek için tasarlanmış güçlü bir Komut Satırı Arayüzü (CLI) aracıdır. Standart proje şablonlarının ötesine geçerek, projenizin amacına uygun en iyi mimariyi kurar, tekrar eden görevleri otomatize eder ve geliştirme yaşam döngüsü boyunca size akıllı bir asistanlık yapar.

Artık sıfırdan proje kurmak, konfigürasyon dosyalarıyla boğuşmak veya yeni bir sayfa eklemek için dosyaları manuel olarak oluşturmak yok. `fiori-cli` ile odaklanmanız gereken tek şey, harika Fiori uygulamaları geliştirmek!

## ✨ Ana Özellikler

- **Akıllı Proje Oluşturma (`new`)**: Sadece bir proje değil, seçtiğiniz mimariye (OData V2, OData V4, REST API) uygun, çalışmaya hazır bir başlangıç kiti oluşturur.
- **Dinamik Kod Üretimi (`add`)**: Tek komutla projenize yeni View, Controller, Model veya Fragment ekleyin. Aracımız, `manifest.json` gibi dosyaları sizin için otomatik olarak günceller.
- **Kod Enjeksiyonu**: Fragment eklerken, ilgili fonksiyonları (`onOpen...`, `onClose...`) seçtiğiniz Controller dosyasına otomatik olarak ekler.
- **DevOps Otomasyonu (`init-deploy`)**: Sizi `nwabap-ui5uploader` için adım adım yönlendirir, konfigürasyon dosyanızı oluşturur ve `package.json` script'lerini hazırlar. Tek komutla (`npm run deploy`) deploy etmeye hazır olun!
- **Kalite Kontrol (`init-linter`)**: Projenize tek komutla ESLint entegrasyonu ekleyerek tüm takımın aynı kod standartlarına uymasını ve potansiyel hataları anında yakalamasını sağlar.
- **Profesyonel Şablon**: Oluşturulan her proje, içinde merkezi servis yapıları (`ODataV2Service`, `RestService`, `SessionManager` vb.), `BaseController`, formatlayıcılar ve daha fazlasını barındıran, en iyi pratiklere uygun bir dosya yapısıyla gelir.

## 📦 Kurulum

Bu aracı global olarak kurarak bilgisayarınızın her yerinden erişebilirsiniz:

```bash
npm install -g ./yol/bilgisayarimdaki/fiori-cli
```

**Not**: Bu komutu, `fiori-cli`'nin kaynak kodlarının bulunduğu klasörün bir üst dizinindeyken çalıştırın veya tam yolu belirtin. NPM'e yayınlandığında bu komut `npm install -g fiori-cli` olacaktır.

## 🚀 Kullanım

`fiori-cli`, komut tabanlı basit bir arayüze sahiptir.

### 1. Yeni Bir Proje Oluşturma

Yeni bir Fiori projesi başlatmak hiç bu kadar kolay olmamıştı:

```bash
fiori-cli new <proje-adi>
```

**Örnek**:

```bash
fiori-cli new MyAwesomeApp
```

Araç sizi adım adım yönlendirecektir:
- **Namespace**: Projenizin benzersiz kimliğini girin (örn: `com.mycompany.myawesomeapp`).
- **Servis Türü**: Projenizin kalbini oluşturacak mimariyi seçin:
  - **OData V2**: Klasik SAP sistemleri için.
  - **OData V4**: Modern S/4HANA sistemleri için.
  - **Standart REST API**: Token tabanlı, oturum yönetimi içeren, çalışmaya hazır bir Login ekranı ve mimarisi ile birlikte.
  - **Hiçbiri**: Minimal başlangıç için.
- **Backend Adresi**: CORS proxy için backend sisteminizin URL'ini girin.

Kurulum bittiğinde, projeniz tüm bağımlılıkları yüklenmiş ve git deposu başlatılmış, çalışmaya hazır bir halde sizi bekliyor olacak:

```bash
cd MyAwesomeApp
npm start
```

### 2. Projeye Yeni Bileşenler Ekleme

Projenizin kök dizinindeyken `add` komutunu kullanın.

#### View ve Controller Ekleme

```bash
fiori-cli add view Products
```

Bu komut:
- `webapp/view/Products.view.xml` oluşturur.
- `webapp/controller/Products.controller.js` oluşturur.
- `manifest.json`'a otomatik olarak `Products` için bir route ve target ekler.
- `i18n.properties` dosyasına yeni bir başlık anahtarı ekler.

#### Fragment Ekleme (Kod Enjeksiyonu ile!)

```bash
fiori-cli add fragment FilterDialog
```

Bu komut:
- Size, bu fragment'ın fonksiyonlarının hangi Controller'a ekleneceğini sorar.
- `webapp/view/fragments/FilterDialog.fragment.xml` dosyasını oluşturur.
- **Sihir**: Seçtiğiniz Controller'ın içine `onOpenFilterDialog` ve `onCloseFilterDialog` fonksiyonlarını otomatik olarak ekler.

#### JSON Model Ekleme

```bash
fiori-cli add model AppState
```

Bu komut, `webapp/model/AppState.js` içinde, içinde hazır `create` fonksiyonu bulunan bir `JSONModel` şablonu oluşturur.

### 3. Deployment (SAP Sistemine Gönderme) Yapılandırması

Projenizi `nwabap-ui5uploader` ile deploy etmeye hazırlayın:

```bash
fiori-cli init-deploy
```

Bu komut, bir sihirbaz aracılığıyla sizden SAP sistem bilgilerinizi alır, `.nwabaprc` dosyasını oluşturur, gerekli NPM paketini kurar ve `package.json`'a `deploy` script'ini ekler.

Sonrasında tek yapmanız gereken:

```bash
npm run deploy
```

### 4. Kod Kalitesini Yapılandırma

Projenize ESLint ile statik kod analizi ekleyin:

```bash
fiori-cli init-linter
```

Bu komut, `eslint` ve gerekli eklentileri kurar, UI5 için en iyi pratikleri içeren bir `.eslintrc.json` dosyası oluşturur ve `lint`/`lint:fix` script'lerini `package.json`'a ekler.

Kod kalitenizi kontrol etmek için:

```bash
npm run lint
```

## 💡 Katkıda Bulunma

Bu proje her zaman gelişime açıktır. Yeni özellik fikirleri, hata bildirimleri ve katkılarınız için lütfen bir **Issue** açın veya **Pull Request** gönderin.

## 📄 Lisans

Bu proje **MIT Lisansı** ile lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakınız.