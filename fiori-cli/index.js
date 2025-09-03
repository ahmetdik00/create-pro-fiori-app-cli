#!/usr/bin/env node
const { Command } = require("commander");
const chalk = require("chalk");
const packageJson = require("./package.json");
const initProject = require("./commands/new");
const { addView, addModel, addFragment } = require("./commands/add");
const { initDeploy } = require("./commands/deploy");
const { initLinter } = require("./commands/quality");

const program = new Command();

program
  .version(packageJson.version, "-v, --version", "CLI versiyonunu göster")
  .name("fiori-cli")
  .usage(`${chalk.green("<command>")} [options]`);

// 'new' KOMUTU
program
  .command("new <project-name>")
  .description("Yeni bir profesyonel Fiori projesi oluşturur")
  .action(initProject);

// 'add' KOMUTU
const addCommand = program
  .command("add")
  .description(
    "Mevcut bir projeye yeni bileşenler ekle (view, model, fragment)"
  );

// --- add view ---
addCommand
  .command("view <view-name>")
  .description(
    "Projeye yeni bir View ve Controller ekler ve manifest.json'a route ekler."
  )
  .action(addView);

// ---  add model ---
addCommand
  .command("model <model-name>")
  .description("Projeye yeni bir JSON Model dosyası ekler.")
  .action(addModel);

// --- add fragment ---
addCommand
  .command("fragment <fragment-name>")
  .description("Projeye yeni bir XML Fragment dosyası ekler (interaktif).")
  .action((fragmentName) => {
    addFragment(fragmentName);
  });

// --- init-deploy ---
program
  .command("init-deploy")
  .description(
    "Projenin nwabap-ui5uploader ile SAP sistemine gönderilmesi için gerekli yapılandırmayı başlatır."
  )
  .action(initDeploy);

  // --- init-linter ---
program
  .command("init-linter")
  .description(
    "Projeye ESLint ile kod kalitesi kontrolü ve standartları ekler."
  )
  .action(initLinter);

program.parse(process.argv);
