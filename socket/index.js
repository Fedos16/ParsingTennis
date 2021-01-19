import {Parsing} from '../handlers/parsing'
import {Processing_File} from '../handlers/processing_file';
import {StartingBrowser, BotIsRunning, TransferDataForClient} from '../handlers/bot';

const fs = require('fs');

export default function (server, dir_path) {
    let io = require('socket.io').listen(server);

    let browser;
    let page;
    let status_bot = true;

    io.sockets.on('connection', (socket) => {
        console.log('Пользователь подключен');

        socket.on('disconnect', () => {
            console.log('Пользователь отключился');
        });

        socket.emit('open_connect', {text: 'Соединение с сервером установлено'});

        try {

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
                page = obj.page;
                browser = obj.browser;

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
                    socket.emit('bot_notification', {text: 'Капча не требуется'});
                } catch (e) {
                    console.log(' - Ресурс требует капчу');
                    socket.emit('bot_notification', {text: 'Ресурс требует пройти капчу'});
                }

                if (!status_autorization) {
                    await (await page.$('#phone_middle')).type(tel_number, {delay: 53});
                    await (await page.$('.block-window__btn')).click();

                    await page.waitFor(3000);
                    await (await page.$('button.swal2-confirm')).click();

                    socket.emit('captcha_code', {text: 'Введите код: '});
                    return;
                }

                socket.emit('bot_notification', {text: 'Успешно авторизовались ...'});


                while (status_bot) {
                    socket.emit('bot_notification', {text: 'Начинаем получать данные ...'});
                    let arr = await BotIsRunning(page);
                    if (arr) {
                        await TransferDataForClient(socket, arr);
                        socket.emit('bot_notification', {text: 'Данные получены ...'});
                    }
                    await page.waitFor(2000);
                }

                browser.close();
                socket.emit('bot_stopped', {text: 'Бот завершил работу'});
            
            })
            socket.on('send_code', async (data) => {
                await (await page.$('#input_otp')).type(data.code, {delay: 30});
                await (await page.$('.block-window__btn')).click();

                await page.waitFor(5000);

                while (status_bot) {
                    socket.emit('bot_notification', {text: 'Начинаем получать данные ...'});
                    let arr = await BotIsRunning(page);
                    if (arr) {
                        await TransferDataForClient(socket, arr);
                        socket.emit('bot_notification', {text: 'Данные получены ...'});
                    }
                    await page.waitFor(2000);
                }

                browser.close();
                socket.emit('bot_stopped', {text: 'Бот завершил работу'});

            });
            socket.on('bot_stop', async (data) => {
                status_bot = false;
                socket.emit('bot_notification', {text: 'Отправлена команда остановки работы бота, ожидаем...'});
            })

        } catch (e) {
            console.log(e);
            socket.emit('bot_notification', {text: 'Произошла ошибка!'});
        }
    });
}