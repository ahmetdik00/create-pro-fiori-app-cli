const inquirer = require("inquirer");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const ejs = require("ejs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generator = require("@babel/generator").default;
const t = require("@babel/types");

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
        title="<%= fragmentName %>">
        <content>
            <!-- Fragment içeriğini buraya ekleyin -->
        </content>
        <beginButton>
            <Button text="OK" press=".onClose<%= fragmentName %>Dialog"/>
        </beginButton>
        <endButton>
            <Button text="Cancel" press=".onClose<%= fragmentName %>Dialog"/>
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

async function addFragment(fragmentName) {
  fragmentName = capitalizeFirstLetter(fragmentName);
  const projectRoot = process.cwd();

  try {
    const controllerDir = path.join(projectRoot, "webapp/controller");
    const allControllers = fs
      .readdirSync(controllerDir)
      .filter((f) => f.endsWith(".js"));

    if (allControllers.length === 0) {
      console.error(
        chalk.red("Hata: Projede herhangi bir Controller dosyası bulunamadı.")
      );
      return;
    }

    const { targetControllerFile } = await inquirer.prompt([
      {
        type: "list",
        name: "targetControllerFile",
        message: "Bu fragment'ın fonksiyonları hangi Controller'a eklensin?",
        choices: allControllers,
      },
    ]);

    console.log(
      chalk.blue(
        `'${fragmentName}' Fragment'ı oluşturuluyor ve '${targetControllerFile}' dosyasına fonksiyonlar ekleniyor...`
      )
    );

    const fragmentDir = path.join(projectRoot, "webapp/view/fragments");
    fs.ensureDirSync(fragmentDir);
    const fragmentPath = path.join(fragmentDir, `${fragmentName}.fragment.xml`);

    if (fs.existsSync(fragmentPath)) {
      console.error(
        chalk.red(
          `Hata: '${path.relative(projectRoot, fragmentPath)}' zaten mevcut.`
        )
      );
      return;
    }

    const fragmentContent = ejs.render(fragmentTemplate, { fragmentName });
    fs.writeFileSync(fragmentPath, fragmentContent);
    console.log(
      chalk.green(
        ` -> Oluşturuldu: ${path.relative(projectRoot, fragmentPath)}`
      )
    );

    const controllerPath = path.join(controllerDir, targetControllerFile);
    const controllerCode = fs.readFileSync(controllerPath, "utf-8");
    const ast = parser.parse(controllerCode, { sourceType: "module" });

    const namespace = JSON.parse(
      fs.readFileSync(path.join(projectRoot, "webapp/manifest.json"))
    )["sap.app"].id;
    const fragmentLoadName = `${namespace}.view.fragments.${fragmentName}`;

    traverse(ast, {
      ObjectExpression(path) {
        const parent = path.parent;
        if (
          t.isCallExpression(parent) &&
          t.isMemberExpression(parent.callee) &&
          parent.callee.property.name === "extend"
        ) {
          const openFuncName = `onOpen${fragmentName}Dialog`;
          const closeFuncName = `onClose${fragmentName}Dialog`;
          const dialogPropName = `p${fragmentName}Dialog`;

          const openFunctionBody = `
                        if (!this.${dialogPropName}) {
                            this.${dialogPropName} = this.loadFragment({
                                name: "${fragmentLoadName}"
                            });
                        }
                        this.${dialogPropName}.then(function (oDialog) {
                            oDialog.open();
                        });
                    `;
          const closeFunctionBody = `this.byId("${fragmentName.toLowerCase()}Dialog").close();`;

          const openBodyAst = parser.parse(openFunctionBody).program.body;
          const closeBodyAst = parser.parse(closeFunctionBody).program.body;

          const openFunctionNode = t.objectProperty(
            t.identifier(openFuncName),
            t.functionExpression(null, [], t.blockStatement(openBodyAst))
          );

          const closeFunctionNode = t.objectProperty(
            t.identifier(closeFuncName),
            t.functionExpression(null, [], t.blockStatement(closeBodyAst))
          );

          path.node.properties.push(openFunctionNode, closeFunctionNode);
          path.stop();
        }
      },
    });

    const { code: newCode } = generator(
      ast,
      { retainLines: true },
      controllerCode
    );
    fs.writeFileSync(controllerPath, newCode);
    console.log(
      chalk.green(` -> Fonksiyonlar eklendi: ${targetControllerFile}`)
    );

    console.log(chalk.green.bold(`\nBaşarıyla tamamlandı!`));
    console.log(
      chalk.yellow(
        `\n1. Fragment yolu: webapp/view/fragments/${fragmentName}.fragment.xml`
      )
    );
    console.log(
      chalk.yellow(`2. Fonksiyonlar '${targetControllerFile}' içine eklendi.`)
    );
    console.log(
      chalk.yellow(
        `3. Fragment'ı tetiklemek için bir butona press=".${`onOpen${fragmentName}Dialog`}" ekleyin.`
      )
    );
  } catch (error) {
    console.error(chalk.red("\nBir hata oluştu:"), error);
  }
}

module.exports = { addView, addModel, addFragment };
