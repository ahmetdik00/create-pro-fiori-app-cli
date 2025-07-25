#!/usr/bin/env node
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');
const ejs = require('ejs');
const chalk = require('chalk');
const ora = require('ora');
const execa = require('execa');
const commandExists = require('command-exists');

// Bu fonksiyonu şablon dosyalarını işlemek için kullanacağız.
// Bu sayede iç içe klasörlerdeki dosyaları da işleyebiliriz.
async function processTemplate(templatePath, targetPath, data) {
  const files = fs.readdirSync(templatePath);

  for (const file of files) {
    const sourceFile = path.join(templatePath, file);
    const targetFile = path.join(targetPath, file);
    const stats = fs.lstatSync(sourceFile);

    if (stats.isDirectory()) {
      // Eğer bir klasörse, hedefte de aynısını oluşturup içine giriyoruz (recursive)
      fs.mkdirSync(targetFile);
      await processTemplate(sourceFile, targetFile, data);
    } else {
      // Eğer bir dosyaysa, EJS ile işleyip hedefe yazıyoruz
      const templateContent = fs.readFileSync(sourceFile, 'utf-8');
      const renderedContent = ejs.render(templateContent, data);
      fs.writeFileSync(targetFile, renderedContent, 'utf-8');
    }
  }
}

async function checkPrerequisites() {
    const gitExists = await commandExists('git').catch(() => false);
    const npmExists = await commandExists('npm').catch(() => false);

    if (!gitExists) {
        console.error(chalk.red.bold('Hata: Git sisteminizde kurulu değil. Lütfen önce Git kurun.'));
        process.exit(1);
    }
    if (!npmExists) {
        console.error(chalk.red.bold('Hata: NPM sisteminizde kurulu değil. Lütfen önce Node.js ve NPM kurun.'));
        process.exit(1);
    }
}

async function run() {
    console.log(chalk.cyan.bold('--- Profesyonel Fiori Uygulama Oluşturucu v2.0 ---'));
    await checkPrerequisites();

    const answers = await inquirer.prompt([
        {
            name: 'projectName',
            message: 'Proje adını girin (örn: my-fiori-app):',
            validate: input => !!input || 'Proje adı boş olamaz!'
        },
        {
            name: 'namespace',
            message: 'Uygulama namespace\'ini girin (örn: com.mycompany.app):',
            default: 'com.example.fiori'
        },
        {
            name: 'backendUrl',
            message: 'SAP Gateway sistem adresini girin (CORS proxy için, örn: http://sunucu:port):',
            default: 'http://localhost:8080'
        }
    ]);

    const { projectName, namespace, backendUrl } = answers;
    const targetDir = path.join(process.cwd(), projectName);
    const templateDir = path.join(__dirname, 'pro-fiori-template');

    if (fs.existsSync(targetDir)) {
        console.error(chalk.red(`\nHata: '${projectName}' adında bir klasör zaten mevcut!`));
        return;
    }

    const spinner = ora(chalk.blue(' Proje yapısı oluşturuluyor...')).start();

     try {
        // 1. Dosyaları Kopyala ve İşle
        fs.ensureDirSync(targetDir);
        await processTemplate(templateDir, targetDir, { projectName, namespace, backendUrl });
        spinner.succeed(chalk.green(' Proje yapısı başarıyla oluşturuldu.'));

        // 2. Git Deposunu Başlat
        spinner.start(chalk.blue('Git deposu hazırlanıyor...'));
        if (fs.existsSync(path.join(targetDir, 'gitignore.template'))) {
            fs.renameSync(path.join(targetDir, 'gitignore.template'), path.join(targetDir, '.gitignore'));
        }
        await execa('git', ['init'], { cwd: targetDir });
        await execa('git', ['add', '.'], { cwd: targetDir });
        await execa('git', ['commit', '-m', 'Initial commit from create-pro-fiori-app'], { cwd: targetDir });
        spinner.succeed(chalk.green(' Git deposu başarıyla başlatıldı.'));

        // 3. NPM Bağımlılıklarını Kur
        spinner.start(chalk.blue('NPM bağımlılıkları kuruluyor (Bu işlem biraz sürebilir)...'));
        await execa('npm', ['install'], { cwd: targetDir });
        spinner.succeed(chalk.green('NPM bağımlılıkları başarıyla kuruldu.'));

        // 4. Final Mesajları
        console.log(chalk.green.bold('\n✨ Kurulum Tamamlandı! ✨'));
        console.log(`\nProjeniz '${chalk.cyan(projectName)}' klasöründe hazır.`);
        console.log(`\nSıradaki adımlar:`);
        console.log(`  1. ${chalk.cyan(`cd ${projectName}`)}`);
        console.log(`  2. ${chalk.cyan('npm start')} komutuyla uygulamayı başlatın.`);
        
    } catch (error) {
        spinner.fail(chalk.red('Bir hata oluştu!'));
        fs.removeSync(targetDir); // Hata durumunda oluşturulan klasörü temizle!
        console.error(chalk.red(error.stderr || error.message));
        process.exit(1);
    }
}

run();