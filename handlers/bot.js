import puppeteer from 'puppeteer'
const models = require('.././models');
const cherio = require('cheerio');

export const LAUNCH_PUPPETEER_OPTS = {
    args: [
        '--window-size=1920x1080'
    ]
};

export const PAGE_PUPPETEER_OPTS = {
    networkIdle2Timeout: 5000,
    waitUntil: 'networkidle2',
    timeout: 3000000
};

export async function StartingBrowser() {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            args : [
                '--window-size=1920,1080',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });
        const page = await browser.newPage(PAGE_PUPPETEER_OPTS);
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
            let db = await models.Championats.find({ "A9x2.Percent": {$gte: 55} }, {Name: 1});
            let arr_names = {};
            for (let row of db) {
                arr_names[row] = true;
            }
            return arr_names;
        }
        async function Bet(params) {
            let main_url = 'https://1xstavka.ru/';

            let game_url = params.game_url;
            let part = params.num_parts;

            let url = main_url + game_url;

            let bets = await models.Bets.find({});

            if (bets.length > 0) return;

            await page.goto(url);
            
            await page.waitFor(2000);
            //await page.waitForSelector('.scoreboard-nav .multiselect__single', {timeout: 5000});

            console.log(url);
            console.log(Number(part));

            await (await page.$('.scoreboard-nav .multiselect__single')).click();
            await page.waitFor(300);
            await (await page.$x(`//*[@class="scoreboard-nav__select"]//*[text()[contains(.,'${part}-я')]]/parent::span/parent::li`)).click();

            await models.Bets.create({
                Team: 'TEST',
                PlayerOne: 'TEST',
                PlayerTwo: 'TEST',
                CurrentScore: 'TEST',
                PartBet: 3,
                Status: 'TEST'
            });

            await page.screenshot({path: 'bet.png'});

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

                let num_parts = arr_score.length-1;
                if (num_parts >= 2) {
                    let f_part = arr_score[0];

                    arr_score.splice(0, 1);
                    arr_score = arr_score.reverse();

                    let true_part = Number(f_part[0]) + Number(f_part[1]);

                    if (arr_score.length > true_part) arr_score.splice(0, 1);

                    if (true_part >= 2) {

                        let n1_0 = Number(arr_score[0][0]);
                        let n2_0 = Number(arr_score[0][1]);

                        let n1_1 = Number(arr_score[1][0]);
                        let n2_1 = Number(arr_score[1][1]);

                        if (n1_0 + n2_0 >= 20 && n1_1 + n2_1 >= 20) {
                            status_stavka = true;
                        }
                        
                    }

                }

                if (status_stavka) {
                    (name in true_bet_champ) ? status_stavka = true : status_stavka = false;
                }

                // Необходимо делать ставку
                if (status_stavka) {
                    await Bet({num_parts, game_url});
                }

                await Bet({num_parts, game_url});

                (name in arr) ? arr[name].push({person, game_url, score: new_score, status_stavka}) : arr[name] = [{person, game_url, score: new_score, status_stavka}];
            }
        }

        //console.log(` - Список игр получен за ${new Date() - start} ms`);

        return arr;
    } catch (e) {
        await page.screenshot({path: `screen_err_${new Date().getTime()}.png`});
        throw e;
    }
}
export async function TransferDataForClient(socket, arr) {
    socket.emit('transfer_data_bot', {data: arr});
    return true;
}