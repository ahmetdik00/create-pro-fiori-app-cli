const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const ejs = require("ejs");

// View ve Controller için EJS şablonları
const viewTemplate = `
<mvc:View
    controllerName="<%= namespace %>.controller.<%= viewName %>"
    xmlns="sap.m"
    xmlns:mvc="sap.ui.core.mvc">
    <Page title="{i18n>title<%= viewName %>}">
        <content></content>
    </Page>
</mvc:View>
`;

const controllerTemplate = `
sap.ui.define([
    "<%= namespace %>/controller/BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("<%= namespace %>.controller.<%= viewName %>", {
        onInit: function () {

        }
    });
});
`;

const modelTemplate = `
sap.ui.define([
    "sap/ui/model/json/JSONModel"
], function (JSONModel) {
    "use strict";

    return {
        /**
         * Creates a new JSON model with initial data.
         * @returns {sap.ui.model.json.JSONModel} The new JSON model instance.
         */
        create: function () {
            const oModel = new JSONModel({
                someProperty: "Initial Value",
                editMode: false
            });
            return oModel;
        }
    };
});
`;

const fragmentTemplate = `
<core:FragmentDefinition
    xmlns="sap.m"
    xmlns:core="sap.ui.core">
    <Dialog
        id="<%= fragmentName.toLowerCase() %>Dialog"
        title="Select an Option">
        <content>
            <!-- Add fragment content here -->
        </content>
        <beginButton>
            <Button text="OK" press=".onCloseDialog"/>
        </beginButton>
        <endButton>
            <Button text="Cancel" press=".onCloseDialog"/>
        </endButton>
    </Dialog>
</core:FragmentDefinition>
`;

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function addView(viewName) {
  viewName = capitalizeFirstLetter(viewName); // Otomatik olarak ilk harfi büyütelim
  const projectRoot = process.cwd();
  const manifestPath = path.join(projectRoot, "webapp/manifest.json");

  // 1. Doğru yerde miyiz?
  if (!fs.existsSync(manifestPath)) {
    console.error(
      chalk.red(
        "Hata: Bu komut bir Fiori projesinin kök dizininde çalıştırılmalıdır (manifest.json bulunamadı)."
      )
    );
    return;
  }

  console.log(
    chalk.blue(`'${viewName}' adlı View ve Controller oluşturuluyor...`)
  );

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath));
    const namespace = manifest["sap.app"].id;

    const viewPath = path.join(
      projectRoot,
      "webapp/view",
      `${viewName}.view.xml`
    );
    const controllerPath = path.join(
      projectRoot,
      "webapp/controller",
      `${viewName}.controller.js`
    );

    // 2. Dosyalar zaten var mı?
    if (fs.existsSync(viewPath) || fs.existsSync(controllerPath)) {
      console.error(
        chalk.red(`Hata: '${viewName}' adlı view veya controller zaten mevcut.`)
      );
      return;
    }

    // 3. Şablonları kullanarak dosyaları oluştur
    const viewContent = ejs.render(viewTemplate, { namespace, viewName });
    fs.writeFileSync(viewPath, viewContent);
    console.log(
      chalk.green(` -> Oluşturuldu: webapp/view/${viewName}.view.xml`)
    );

    const controllerContent = ejs.render(controllerTemplate, {
      namespace,
      viewName,
    });
    fs.writeFileSync(controllerPath, controllerContent);
    console.log(
      chalk.green(
        ` -> Oluşturuldu: webapp/controller/${viewName}.controller.js`
      )
    );

    // 4. manifest.json'ı güncelle (En Kritik Kısım)
    console.log(chalk.blue("manifest.json güncelleniyor..."));

    // Yeni Target
    manifest["sap.ui5"].routing.targets[`Target${viewName}`] = {
      viewId: viewName.toLowerCase(),
      viewName: viewName,
    };

    // Yeni Route
    manifest["sap.ui5"].routing.routes.push({
      name: `Route${viewName}`,
      pattern: viewName.toLowerCase(), // örn: "products"
      target: `Target${viewName}`,
    });

    // manifest.json'u güzel formatlanmış şekilde geri yaz
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(chalk.green(" -> manifest.json başarıyla güncellendi."));

    // 5. i18n dosyasını güncelle
    const i18nPath = path.join(projectRoot, "webapp/i18n/i18n.properties");
    if (fs.existsSync(i18nPath)) {
      fs.appendFileSync(
        i18nPath,
        `\n# Title for ${viewName} view\ntitle${viewName}=${viewName}\n`
      );
      console.log(
        chalk.green(" -> i18n/i18n.properties dosyasına başlık eklendi.")
      );
    }

    console.log(chalk.green.bold(`\n'${viewName}' başarıyla eklendi!`));
    console.log(
      chalk.yellow(
        `Uygulamanızda bu sayfaya gitmek için bir Button veya Link'e 'press' event'i ekleyip 'getRouter().navTo("Route${viewName}")' fonksiyonunu çağırın.`
      )
    );
  } catch (error) {
    console.error(chalk.red("\nBir hata oluştu:"), error);
  }
}

function addModel(modelName) {
  modelName = capitalizeFirstLetter(modelName);
  const projectRoot = process.cwd();
  const manifestPath = path.join(projectRoot, "webapp/manifest.json");

  if (!fs.existsSync(manifestPath)) {
    console.error(
      chalk.red(
        "Hata: Bu komut bir Fiori projesinin kök dizininde çalıştırılmalıdır."
      )
    );
    return;
  }

  console.log(
    chalk.blue(`'${modelName}' adlı JSON Model dosyası oluşturuluyor...`)
  );

  try {
    const modelPath = path.join(projectRoot, "webapp/model", `${modelName}.js`);

    if (fs.existsSync(modelPath)) {
      console.error(
        chalk.red(
          `Hata: 'webapp/model/${modelName}.js' adında bir dosya zaten mevcut.`
        )
      );
      return;
    }

    const modelContent = ejs.render(modelTemplate, {});
    fs.writeFileSync(modelPath, modelContent);
    console.log(chalk.green(` -> Oluşturuldu: webapp/model/${modelName}.js`));

    console.log(chalk.green.bold(`\n'${modelName}' modeli başarıyla eklendi!`));
    console.log(
      chalk.yellow(`\nBu modeli bir controller'da kullanmak için:
1. Controller'ınızın define bloğuna ekleyin: "<namespace>/model/${modelName}"
2. onInit içinde çağırın ve view'a set edin:
   const oMyModel = ${modelName}.create();
   this.getView().setModel(oMyModel, "${modelName.toLowerCase()}Model");
`)
    );
  } catch (error) {
    console.error(chalk.red("\nBir hata oluştu:"), error);
  }
}

function addFragment(fragmentName) {
  fragmentName = capitalizeFirstLetter(fragmentName);
  const projectRoot = process.cwd();
  const manifestPath = path.join(projectRoot, "webapp/manifest.json");

  if (!fs.existsSync(manifestPath)) {
    console.error(
      chalk.red(
        "Hata: Bu komut bir Fiori projesinin kök dizininde çalıştırılmalıdır."
      )
    );
    return;
  }

  console.log(
    chalk.blue(`'${fragmentName}' adlı Fragment dosyası oluşturuluyor...`)
  );

  try {
    const fragmentDir = path.join(projectRoot, "webapp/fragment");
    fs.ensureDirSync(fragmentDir); // 'fragment' klasörü yoksa oluşturur!

    const fragmentPath = path.join(fragmentDir, `${fragmentName}.fragment.xml`);

    if (fs.existsSync(fragmentPath)) {
      console.error(
        chalk.red(
          `Hata: 'webapp/fragment/${fragmentName}.fragment.xml' adında bir dosya zaten mevcut.`
        )
      );
      return;
    }

    const fragmentContent = ejs.render(fragmentTemplate, { fragmentName });
    fs.writeFileSync(fragmentPath, fragmentContent);
    console.log(
      chalk.green(
        ` -> Oluşturuldu: webapp/fragment/${fragmentName}.fragment.xml`
      )
    );

    console.log(
      chalk.green.bold(`\n'${fragmentName}' fragment'ı başarıyla eklendi!`)
    );
    console.log(
      chalk.yellow(`\nBu fragment'ı bir controller'dan açmak için:
1. Controller'a Fragment'ı import edin: "sap/ui/core/Fragment"
2. Bir fonksiyon içinde aşağıdaki gibi kullanın:
   onOpenFragment: function() {
       if (!this._p${fragmentName}Dialog) {
           this._p${fragmentName}Dialog = this.loadFragment({
               name: "<namespace>.view.fragment.${fragmentName}"
           });
       }
       this._p${fragmentName}Dialog.then(function(oDialog){
           oDialog.open();
       });
   },

   onCloseDialog: function() {
       this.byId("${fragmentName.toLowerCase()}Dialog").close();
   }
`)
    );
  } catch (error) {
    console.error(chalk.red("\nBir hata oluştu:"), error);
  }
}

module.exports = { addView, addModel, addFragment };
