const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const execa = require('execa');

async function initDeploy() {
    console.log(chalk.cyan.bold('--- SAP Sistemine Gönderme (Deployment) Yapılandırması ---'));

    const projectRoot = process.cwd();
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const nwabaprcPath = path.join(projectRoot, '.nwabaprc');

    if (!fs.existsSync(packageJsonPath)) {
        console.error(chalk.red('Hata: Bu komut bir Fiori projesinin kök dizininde çalıştırılmalıdır (package.json bulunamadı).'));
        return;
    }
    if (fs.existsSync(nwabaprcPath)) {
        const { overwrite } = await inquirer.prompt([{
            type: 'confirm',
            name: 'overwrite',
            message: '.nwabaprc dosyası zaten mevcut. Üzerine yazılsın mı?',
            default: false
        }]);
        if (!overwrite) {
            console.log(chalk.yellow('İşlem iptal edildi.'));
            return;
        }
    }

    try {
        const answers = await inquirer.prompt([
            { name: 'conn_server', message: 'SAP sunucu adresini girin (örn: https://s4.mycompany.com:44300):' },
            { name: 'conn_client', message: 'SAP mandant (client) numarasını girin:', default: '100' },
            { name: 'conn_user', message: 'SAP kullanıcı adınızı girin:' },
            { type: 'password', name: 'conn_password', message: 'SAP şifrenizi girin:', mask: '*' },
            { name: 'abap_package', message: 'ABAP Geliştirme Paketini girin (örn: $TMP):', default: '$TMP' },
            { name: 'abap_bsp', message: 'Oluşturulacak BSP uygulamasının adını girin:' },
            { name: 'abap_bsp_text', message: 'BSP uygulamasının tanımını (açıklamasını) girin:' },
            { name: 'abap_transport', message: 'Taşıma (Transport) isteği numarasını girin (gerekmiyorsa boş bırakın):' }
        ]);

        // .nwabaprc dosyasının içeriğini oluştur
        const nwabaprcContent = {
            base: "./dist",
            conn_server: answers.conn_server,
            conn_client: answers.conn_client,
            conn_user: answers.conn_user,
            conn_password: answers.conn_password,
            conn_usestrictssl: false,
            abap_package: answers.abap_package,
            abap_bsp: answers.abap_bsp,
            abap_bsp_text: answers.abap_bsp_text,
            abap_transport: answers.abap_transport
        };

        fs.writeFileSync(nwabaprcPath, JSON.stringify(nwabaprcContent, null, 2));
        console.log(chalk.green(` -> Başarıyla oluşturuldu: .nwabaprc`));
        
        // nwabap-ui5uploader paketini kur
        const spinner = ora(chalk.blue('`nwabap-ui5uploader` ve `rimraf` paketleri kuruluyor...')).start();
        await execa('npm', ['install', '--save-dev', 'nwabap-ui5uploader', 'rimraf']);
        spinner.succeed(chalk.green('Gerekli NPM paketleri başarıyla kuruldu.'));
        
        // package.json script'lerini güncelle
        console.log(chalk.blue('package.json script\'leri güncelleniyor...'));
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
        packageJson.scripts = packageJson.scripts || {};
        packageJson.scripts["build"] = "ui5 build --all --clean-dest";
        packageJson.scripts["deploy"] = "npm run build && npx nwabap upload";
        packageJson.scripts["undeploy"] = "npx nwabap undeploy"; // Ekstra bonus: silme komutu
        
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log(chalk.green(' -> "build", "deploy" ve "undeploy" script\'leri başarıyla eklendi.'));
        
        console.log(chalk.green.bold(`\n✨ Deployment yapılandırması tamamlandı! ✨`));
        console.log(chalk.yellow(`\nUygulamanızı SAP sistemine göndermek için şimdi şu komutu çalıştırabilirsiniz:`));
        console.log(chalk.cyan('   npm run deploy'));

    } catch (error) {
        console.error(chalk.red('\nBir hata oluştu:'), error);
    }
}

module.exports = { initDeploy };