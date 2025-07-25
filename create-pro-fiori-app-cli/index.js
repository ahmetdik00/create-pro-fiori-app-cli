#!/usr/bin/env node
const { Command } = require("commander");
const chalk = require("chalk");
const packageJson = require("./package.json");
const initProject = require("./commands/new");
const { addView, addModel, addFragment } = require("./commands/add");

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
  .description("Projeye yeni bir XML Fragment dosyası ekler.")
  .action(addFragment);

program.parse(process.argv);
