const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const ora = require("ora");
const execa = require("execa");

// .eslintrc.json içeriği (SENİN BULDUĞUN, EKLENTİSİZ KURAL LİSTESİ)
const eslintrcContent = {
  env: {
    browser: true,
  },
  globals: {
    sap: "readonly",
    jQuery: "readonly",
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "block-scoped-var": 1,
    "brace-style": [2, "1tbs", { allowSingleLine: true }],
    "consistent-this": 2,
    "no-div-regex": 2,
    "no-floating-decimal": 2,
    "no-self-compare": 2,
    "no-mixed-spaces-and-tabs": [2, true],
    "no-nested-ternary": 2,
    "no-unused-vars": [2, { vars: "all", args: "none" }],
    radix: 2,
    "keyword-spacing": [2, {}], // 'space-after-keywords' kuralı yeni ESLint'te 'keyword-spacing' oldu
    "space-unary-ops": 2, // 'space-unary-word-ops' kuralı yeni ESLint'te 'space-unary-ops' oldu
    "wrap-iife": [2, "any"],
    camelcase: 1,
    "consistent-return": 1,
    "max-nested-callbacks": [1, 3],
    "new-cap": 1,
    "no-extra-boolean-cast": 1,
    "no-lonely-if": 1,
    "no-new": 1,
    "no-new-wrappers": 1,
    "no-redeclare": 1,
    "no-unused-expressions": 1,
    "no-use-before-define": [1, "nofunc"],
    "no-warning-comments": 1,
    strict: [1, "global"], // 'global-strict' yerine bu kullanılır ve 'use strict' gerektirir.
    "valid-jsdoc": [
      1,
      {
        requireReturn: false,
      },
    ],
    "default-case": 1,
    "dot-notation": 0,
    "eol-last": 0,
    eqeqeq: 0,
    "no-trailing-spaces": 0,
    "no-underscore-dangle": 0,
    quotes: 0,
    semi: ["error", "always"],
  },
};

const eslintignoreContent = `
# Build output
dist/
webapp/resources/
# Dependencies
node_modules/
`;

async function initLinter() {
  console.log(chalk.cyan.bold("--- Kod Kalitesi (ESLint) Yapılandırması ---"));

  const projectRoot = process.cwd();
  const packageJsonPath = path.join(projectRoot, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    console.error(
      chalk.red(
        "Hata: Bu komut bir Fiori projesinin kök dizininde çalıştırılmalıdır."
      )
    );
    return;
  }

  try {
    const spinner = ora(
      chalk.blue("ESLint paketi kuruluyor...")
    ).start();
    // --- NİHAİ ÇÖZÜM: Sadece ve sadece ESLint'in 8. versiyonunu kuruyoruz ---
    await execa("npm", ["install", "--save-dev", "eslint@8"]);
    spinner.succeed(chalk.green("ESLint paketi başarıyla kuruldu."));

    // .eslintrc.json dosyasını oluştur
    fs.writeFileSync(
      path.join(projectRoot, ".eslintrc.json"),
      JSON.stringify(eslintrcContent, null, 4)
    );
    console.log(
      chalk.green(
        " -> Başarıyla oluşturuldu: .eslintrc.json (Eklentisiz, saf kurallar ile)"
      )
    );

    // .eslintignore dosyasını oluştur
    fs.writeFileSync(
      path.join(projectRoot, ".eslintignore"),
      eslintignoreContent.trim()
    );
    console.log(chalk.green(" -> Başarıyla oluşturuldu: .eslintignore"));

    // package.json script'lerini güncelle
    console.log(chalk.blue("package.json script'leri güncelleniyor..."));
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts["lint"] = "eslint webapp/**/*.js";
    packageJson.scripts["lint:fix"] = "eslint webapp/**/*.js --fix";

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(
      chalk.green(' -> "lint" ve "lint:fix" script\'leri başarıyla eklendi.')
    );

    console.log(
      chalk.green.bold(`\n✨ Kod Kalitesi yapılandırması bu sefer tamam! ✨`)
    );
    console.log(
      `Hataları görmek için ${chalk.cyan(
        "npm run lint"
      )} komutunu çalıştırabilirsiniz.`
    );
  } catch (error) {
    console.error(
      chalk.red("\nBir hata oluştu:"),
      error.stderr || error.message
    );
  }
}

module.exports = { initLinter };
