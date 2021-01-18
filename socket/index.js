import {Parsing} from '../handlers/parsing'
import {Processing_File} from '../handlers/processing_file';
import {StartingBrowser, PAGE_PUPPETEER_OPTS} from '../handlers/bot';

const fs = require('fs');

export default function (server, dir_path) {
    let io = require('socket.io').listen(server);
    io.sockets.on('connection', (socket) => {
        console.log('Пользователь подключен');

        socket.on('disconnect', () => {
            console.log('Пользователь отключился');
        });

        socket.emit('open_connect', {text: 'Соединение с сервером установлено'});

        socket.on('start_parsing', async (data) => {
            console.log('Парсинг начинается');
            let arr = await Parsing(socket);
            socket.emit('parsing_result', {text: 'Что то парсили', data: arr});
        });

        socket.on('parsing_file', async (data) => {
            console.log(' - Начинаем обработку файла ...');
            let arr = await Processing_File();
            socket.emit('parsing_file_result', {text: 'Файл обработан', data: arr});
        });
        socket.on('bot_start', async (data) => {
            console.log(` - Запускаем Бота`);

            let start = new Date();

            let obj = await StartingBrowser();
            const page = obj.page;

            const url = 'https://1xstavka.ru';

            await page.goto(url);

            // АВТОРИЗАЦИЯ
            await (await page.$('.loginDropTop .name')).click();
            
            const login_text = '13016481';
            const password_text = '384467';
            const tel_number = '90373464'

            await (await page.$('#auth_id_email')).type(login_text, {delay: 100});
            await (await page.$('#auth-form-password')).type(password_text, {delay: 40});

            await (await page.$('.auth-button')).click();

            let status_autorization = false;
            try {
                await page.waitForSelector('.top-b__account', {timeout: 10000});
                status_autorization = true;
            } catch (e) {
                console.log(' - Ресурс требует капчу');
            }

            if (!status_autorization) {
                await (await page.$('#phone_middle')).type(tel_number, {delay: 53});
                await (await page.$('.block-window__btn')).click();

                await page.waitFor(3000);
                await (await page.$('button.swal2-confirm')).click();

                socket.emit('captcha_code', {text: 'Введите код: '})

                await page.waitFor(10000)
            }

            const page_data = await page.content();
            fs.writeFileSync(`CAPCHA.html`, page_data);

            await page.screenshot({path: 'screen.png'});


            obj.browser.close();
            console.log(` - Остановили Бота (${new Date() - start} ms)`);
            

            socket.emit('bot_stopped', {text: 'Бот остановлен ...'});
        })
    });
}