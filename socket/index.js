import {Parsing} from '../handlers/parsing'
import {Processing_File, ProcessingDB} from '../handlers/processing_file';
import {StartingBrowser, BotIsRunning, TransferDataForClient, GetStatistics, GetStatisticsBk} from '../handlers/bot';

const fs = require('fs');

export default function (server, dir_path) {
    let io = require('socket.io').listen(server);

    let browser;
    let page;
    let status_bot = true;
    let status_job_bot = false;

    async function BotJob(page) {
        status_job_bot = true;
        let index = 0;
        while (status_bot) {
            io.sockets.emit('bot_notification', {text: 'Начинаем получать данные ...'});
            //await GetStatisticsBk(page);
            let arr = await BotIsRunning(page);
            if (arr) {
                await TransferDataForClient(io, arr);
                io.sockets.emit('bot_notification', {text: 'Данные получены ...', status_bot: status_job_bot});
            }
            await page.waitFor(1500);
            index ++;
        }
    }

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
                //let arr = await Processing_File(socket);
                let arr = await ProcessingDB(socket);
                socket.emit('parsing_file_result', {text: 'Файл обработан', data: arr});
            });
            socket.on('bot_start', async (data) => {
                console.log(` - Starting Bot`);

                io.sockets.emit('bot_notification', {text: 'Запускаем ракету', status_bot: true});

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
                    await page.waitForSelector('.top-b__account');
                    status_autorization = true;
                    socket.emit('bot_notification', {text: 'Капча не требуется'});
                } catch (e) {
                    console.log(' - Resuorce Captcha');
                    await page.screenshot({path: './public/images/CAPTCHA.png'});
                    socket.emit('bot_notification', {text: 'Ресурс требует пройти капчу', captcha: true});
                }

                if (!status_autorization) {
                    await (await page.$('#phone_middle')).type(tel_number, {delay: 53});
                    await (await page.$('.block-window__btn')).click();

                    await page.waitFor(3000);
                    await (await page.$('button.swal2-confirm')).click();

                    socket.emit('captcha_code', {text: 'Введите код: '});
                    return;
                }

                io.sockets.emit('bot_notification', {text: 'Успешно авторизовались ...'});

                await page.waitFor(5000);

                await page.waitForSelector('.langDropTop_con');
                await (await page.$('.langDropTop_con')).click();

                await page.waitFor(1000);

                const [ru_lang] = await page.$x(`//*[@class="langDropTop_ul"]//*[text()[contains(.,'ru')]]/parent::a/parent::li`);
                await page.waitFor(100);
                await ru_lang.click();

                console.log(' - Bot Jobbing');

                status_bot = true;

                await BotJob(page);

                status_job_bot = false;

                browser.close();
                io.sockets.emit('bot_stopped', {text: 'Бот завершил работу'});

                console.log(' - Bot True');
            
            })
            socket.on('send_code', async (data) => {

                io.sockets.emit('bot_notification', {text: 'Решаем капчу', status_bot: true});

                await (await page.$('#input_otp')).type(data.code, {delay: 30});
                await (await page.$('.block-window__btn')).click();

                await page.waitFor(5000);

                status_bot = true;

                await BotJob(page);

                status_job_bot = false;

                browser.close();
                io.sockets.emit('bot_stopped', {text: 'Бот завершил работу'});

            });
            socket.on('bot_stop', async (data) => {
                status_bot = false;
                status_job_bot = false;
                io.sockets.emit('bot_notification', {text: 'Отправлена команда остановки работы бота, ожидаем...'});
            });
            socket.on('get_status_bot', async (data) => {
                let text = 'Бот работает ...';
                if (!status_job_bot) text = 'Бот отдыхает ...'
                io.sockets.emit('bot_notification', {text, status_bot: status_job_bot});
            })
            socket.on('get_statistics', async (data) => {
                let bets = await GetStatistics() || [];

                socket.emit('calc_statistics', {text: 'Статистика собрана', bets});
            })

        } catch (e) {
            console.log(e);
            io.sockets.emit('bot_notification', {text: 'Произошла ошибка!'});
        }
    });
}