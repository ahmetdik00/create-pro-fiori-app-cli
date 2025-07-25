#!/usr/bin/env node
const inquirer = require("inquirer");
const path = require("path");
const fs = require("fs-extra");
const ejs = require("ejs");
const chalk = require("chalk");
const ora = require("ora");
const execa = require("execa");
const commandExists = require("command-exists");

async function checkPrerequisites() {
  const gitExists = await commandExists("git").catch(() => false);
  const npmExists = await commandExists("npm").catch(() => false);

  if (!gitExists) {
    console.error(
      chalk.red.bold(
        "Hata: Git sisteminizde kurulu değil. Lütfen önce Git kurun."
      )
    );
    process.exit(1);
  }
  if (!npmExists) {
    console.error(
      chalk.red.bold(
        "Hata: NPM sisteminizde kurulu değil. Lütfen önce Node.js ve NPM kurun."
      )
    );
    process.exit(1);
  }
}

async function initProject(projectName) {
  console.log(
    chalk.cyan.bold("--- Profesyonel Fiori Uygulama Oluşturucu v2.0 ---")
  );
  await checkPrerequisites();

  const answers = await inquirer.prompt([
    {
      name: "namespace",
      message: "Uygulama namespace'ini girin (örn: com.mycompany.app):",
      default: "com.example.fiori",
    },
    {
      type: "list",
      name: "serviceType",
      message: "Projenizin ana veri servisi türü ne olacak?",
      choices: [
        { name: "OData V2 (örn: SAP ERP, S/4HANA On-Prem)", value: "ODataV2" },
        { name: "OData V4 (örn: S/4HANA Cloud)", value: "ODataV4" },
        {
          name: "Standart REST API (Token tabanlı oturum yönetimi ile)",
          value: "Rest",
        },
        { name: "Hiçbiri (Daha sonra kendim ekleyeceğim)", value: "None" },
      ],
    },
    {
      name: "backendUrl",
      message:
        "SAP Gateway veya Backend sistem adresini girin (CORS proxy için):",
      default: "http://localhost:8080",
    },
  ]);

  const { namespace, serviceType, backendUrl } = answers;
  const projectData = { projectName, namespace, serviceType, backendUrl };
  const targetDir = path.join(process.cwd(), projectName);
  const templateDir = path.join(__dirname, "..", "pro-fiori-template");

  if (fs.existsSync(targetDir)) {
    console.error(
      chalk.red(`\nHata: '${projectName}' adında bir klasör zaten mevcut!`)
    );
    return;
  }

  const spinner = ora(chalk.blue("Proje yapısı oluşturuluyor...")).start();

  try {
    fs.ensureDirSync(targetDir);
    await processTemplate(templateDir, targetDir, projectData);
    spinner.succeed(chalk.green("Proje yapısı başarıyla oluşturuldu."));

    spinner.start(chalk.blue("Git deposu hazırlanıyor..."));
    if (fs.existsSync(path.join(targetDir, "gitignore.template"))) {
      fs.renameSync(
        path.join(targetDir, "gitignore.template"),
        path.join(targetDir, ".gitignore")
      );
    }
    await execa("git", ["init"], { cwd: targetDir });
    await execa("git", ["add", "."], { cwd: targetDir });
    await execa("git", ["commit", "-m", "Initial commit from fiori-cli"], {
      cwd: targetDir,
    });
    spinner.succeed(chalk.green("Git deposu başarıyla başlatıldı."));

    spinner.start(
      chalk.blue("NPM bağımlılıkları kuruluyor (Bu işlem biraz sürebilir)...")
    );
    await execa("npm", ["install"], { cwd: targetDir });
    spinner.succeed(chalk.green("NPM bağımlılıkları başarıyla kuruldu."));

    console.log(chalk.green.bold("\n✨ Kurulum Tamamlandı! ✨"));
    console.log(`\nProjeniz '${chalk.cyan(projectName)}' klasöründe hazır.`);
    console.log(`\nSıradaki adımlar:`);
    console.log(`  1. ${chalk.cyan(`cd ${projectName}`)}`);
    console.log(
      `  2. ${chalk.cyan("npm start")} komutuyla uygulamayı başlatın.`
    );
  } catch (error) {
    spinner.fail(chalk.red("Bir hata oluştu!"));
    fs.removeSync(targetDir);
    console.error(chalk.red(error.stack || error.message));
    process.exit(1);
  }
}

async function processTemplate(templatePath, targetPath, data) {
  const entries = fs.readdirSync(templatePath);
  for (const entry of entries) {
    const sourceFile = path.join(templatePath, entry);
    const targetFile = path.join(targetPath, entry);
    const stats = fs.lstatSync(sourceFile);

    if (stats.isDirectory()) {
      // --- DÜZELTME BURADA: 'service' klasörünü özel olarak ele alıyoruz ---
      if (entry === "service") {
        const targetServiceDir = targetFile;
        fs.ensureDirSync(targetServiceDir);

        // Kopyalanacak dosyaları seç
        const serviceFilesToCopy = [];
        if (data.serviceType === "Rest") {
          serviceFilesToCopy.push(
            "RestService.js",
            "UserService.js",
            "SessionManager.js"
          );
        } else if (data.serviceType === "ODataV2") {
          serviceFilesToCopy.push("ODataV2Service.js");
        } else if (data.serviceType === "ODataV4") {
          serviceFilesToCopy.push("ODataV4Service.js");
        }

        // Sadece seçilen dosyaları kopyala
        for (const serviceFile of serviceFilesToCopy) {
          const sourceServicePath = path.join(sourceFile, serviceFile);
          const targetServicePath = path.join(targetServiceDir, serviceFile);
          if (fs.existsSync(sourceServicePath)) {
            const templateContent = fs.readFileSync(sourceServicePath, "utf-8");
            const renderedContent = ejs.render(templateContent, data);
            fs.writeFileSync(targetServicePath, renderedContent, "utf-8");
          }
        }
      } else {
        // Diğer klasörleri recursive olarak işle
        fs.ensureDirSync(targetFile);
        await processTemplate(sourceFile, targetFile, data);
      }
    } else {
      // Dosyaları EJS ile işle
      const templateContent = fs.readFileSync(sourceFile, "utf-8");
      const renderedContent = ejs.render(templateContent, data);
      fs.writeFileSync(targetFile, renderedContent, "utf-8");
    }
  }
}

module.exports = initProject;
