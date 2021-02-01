import puppeteer from 'puppeteer'
const models = require('.././models');
const cherio = require('cheerio');
const config = require('../config');

export let LAUNCH_PUPPETEER_OPTS = {
    headless: true,
    args: [
        '--window-size=1920,1080',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
    ]
};

export const PAGE_PUPPETEER_OPTS = {
    networkIdle2Timeout: 5000,
    waitUntil: 'networkidle2',
    timeout: 3000000
};

export async function StartingBrowser() {
    try {

        if (config.PROXY_SERVER != 'null') {
            LAUNCH_PUPPETEER_OPTS.args.push(`--proxy-server=http://${config.PROXY_SERVER}:${config.PROXY_PORT}`);
        }

        const browser = await puppeteer.launch(LAUNCH_PUPPETEER_OPTS);
        const page = await browser.newPage(PAGE_PUPPETEER_OPTS);

        if (config.PROXY_SERVER != 'null') {
            await page.authenticate({
                username: config.PROXY_LOGIN,
                password: config.PROXY_PASSWORD,
            });
        }

        await page.setViewport({width: 1920, height: 1080});
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36');

        return {page, browser};

    } catch (e) {
        throw e
    }
}
export async function BotIsRunning(page) {
    try {

        async function getLiga() {
            let db = await models.Championats.find({}, { Name: 1, 'A9x2.Percent': 1 });
            let arr_names = {};
            for (let row of db) {
                let name = row.Name;
                let percent = row.A9x2.Percent;
                let rec_percent = 100 - percent;
                if (percent >= 53.6) {
                    arr_names[row.Name] = '18.5 М';
                } else if (rec_percent >= 53.6) {
                    arr_names[row.Name] = '18.5 Б';
                }
            }
            return arr_names;
        }
        async function Bet(params) {

            function currentDateTime() {
                let now = new Date();
                let day = now.getDate();
                if (day < 10) day = '0'+day;
                let month = now.getMonth() + 1;
                if (month < 10) month = '0'+month;

                let h = now.getHours();
                if (h < 10) h = '0'+h;
                let m = now.getMinutes();
                if (m < 10) m = '0'+m

                return `${day}-${month} ${h} ${m}`;
            }

            let main_url = 'https://1xstavka.ru/';

            let sum_bet = '20';

            let game_url = params.game_url;
            let part = params.num_parts;
            let person = params.person;
            let name_championat = params.name;
            let new_score = params.new_score;
            let bet_text = params.bet;

            let url = main_url + game_url;

            let bets = await models.Bets.findOne({Team: person, PartBet: part});

            if (bets) return;

            await page.goto(url);
            
            await page.waitFor(2000);

            const el_in_kupon = await page.$('.c-bet-box--blocked button');
            if (el_in_kupon) await el_in_kupon.click();

            await (await page.$('.scoreboard-nav .multiselect__single')).click();
            await page.waitFor(300);
            const [part_element] = await page.$x(`//*[@class="scoreboard-nav__select"]//*[text()[contains(.,'${part}-я')]]/parent::span/parent::li`)
            await part_element.click();

            await page.waitFor(500);

            const [bet_element] = await page.$x(`//*[@class="bet_group"]//*[text()[contains(.,'${bet_text}')]]/parent::div`);

            if (!bet_element) {
                console.log(` - No Elements for Bet`);
                return;
            }

            let kef_element = await bet_element.$('.koeff i')
            let kef_value = await page.evaluate(el => el.textContent, kef_element);
            if (kef_value < 1.83) {
                console.log(` - Low Keff: ${kef_value}`);
                return;
            }

            // Получаем игрока 1 и игрока 2
            let person_arr = String(person).split(' — ');
            let person_one_arr = person_arr[0].split(' ');
            let person_one = person_one_arr[0] + ' ' + person_one_arr[1];
            let person_two_arr = person_arr[1].split(' ');
            let person_two = person_two_arr[0] + ' ' + person_two_arr[1];

            await bet_element.click()

            await page.waitFor(200)

            await (await page.$('.bet_sum_input')).type(sum_bet, {delay: 100});

            await (await page.$('.coupon-btn-group__item button')).click();

            console.log(` - BET and Save Bet: ${currentDateTime()}`);
            //await page.screenshot({path: `Ставка сделана и сохранена ${currentDateTime()}.png`})

            await page.waitFor(8000);

            await models.Bets.create({
                Championat: name_championat,
                Team: person,
                PlayerOne: person_one,
                PlayerTwo: person_two,
                CurrentScore: new_score,
                PartBet: part,
                Kef: kef_value,
                TypeBet: bet_text,
                Status: 'В игре'
            });

            return;
        }

        const table_tennis_url = 'https://1xstavka.ru/live/Table-Tennis/';

        const true_bet_champ = await getLiga();

        let current_url = page.url();
        if (current_url != table_tennis_url) {
            await page.goto(table_tennis_url);
        }

        await page.waitFor(2000);

        let code_page = await page.content();

        let $ = cherio.load(code_page);

        let arr = {};

        let start = new Date();

        let block = $('#games_content div div div div[data-name="dashboard-champ-content"]');
        for (let i=0; i < block.length; i++) {
            let name = $(block[i]).find('.c-events__name a').text();
            //console.log(` -- ${name}`);
            let game_urls = $(block[i]).find('a.c-events__name');
            let people = $(block[i]).find('a.c-events__name span.c-events__teams');

            let scores = $(block[i]).find('.c-events-scoreboard__lines')
            for (let x=0; x < game_urls.length; x++) {
                let game_url = $(game_urls[x]).attr('href');
                let person = $(people[x]).attr('title');
                let arr_score = [];
                let new_score = [];

                let score_line_one = $(scores[x]).find('.c-events-scoreboard__line:nth-child(1)');
                let score_line_two = $(scores[x]).find('.c-events-scoreboard__line:nth-child(2)');

                let elements_score_line_one = $(score_line_one).find('.c-events-scoreboard__cell');
                let elements_score_line_two = $(score_line_two).find('.c-events-scoreboard__cell');
                for (let y=0; y < elements_score_line_one.length; y ++) {
                    let t1 = $(elements_score_line_one[y]).text();
                    let t2 = $(elements_score_line_two[y]).text();

                    arr_score.push([t1, t2]);
                    new_score.push([t1, t2]);
                }

                let status_stavka = false;

                let status_test = false;

                let num_parts = arr_score.length-1;
                if (num_parts >= 2) {
                    let f_part = arr_score[0];

                    arr_score.splice(0, 1);
                    arr_score = arr_score.reverse();

                    let true_part = Number(f_part[0]) + Number(f_part[1]);

                    let arr_score_current = [];
                    if (arr_score.length > true_part) {
                        arr_score_current = arr_score.splice(0, 1);

                        // Тестирование создание ставки
                        let c1_0 = Number(arr_score_current[0][0]);
                        let c2_0 = Number(arr_score_current[0][1]);

                        if (c1_0 + c2_0 < 9) status_test = true;
                    }

                    if (true_part >= 2) {

                        let n1_0 = Number(arr_score[0][0]);
                        let n2_0 = Number(arr_score[0][1]);

                        let n1_1 = Number(arr_score[1][0]);
                        let n2_1 = Number(arr_score[1][1]);

                        let c1_0 = 10
                        let c2_0 = 10

                        if (arr_score_current.length > 0) {
                            c1_0 = Number(arr_score_current[0][0]);
                            c2_0 = Number(arr_score_current[0][1]);
                        }

                        if (n1_0 + n2_0 >= 20 && n1_1 + n2_1 >= 20 && c1_0 + c2_0 < 9) {
                            status_stavka = true;
                        }
                        
                    }

                }

                // Необходимо делать ставку
                if (status_stavka && name in true_bet_champ) {
                    await Bet({num_parts, game_url, person, name, new_score, bet: true_bet_champ[name]});
                } else {
                    status_stavka = false;
                }

                //if (status_test) await Bet({num_parts, game_url, person});

                (name in arr) ? arr[name].push({person, game_url, score: new_score, status_stavka}) : arr[name] = [{person, game_url, score: new_score, status_stavka}];
            }
        }

        //console.log(` - Список игр получен за ${new Date() - start} ms`);

        return arr;
    } catch (e) {
        await page.screenshot({path: `screen_err_${new Date().getTime()}.png`});
        console.log(e);
        return {};
    }
}
export async function TransferDataForClient(io, arr) {
    io.sockets.emit('transfer_data_bot', {data: arr});
    return true;
}