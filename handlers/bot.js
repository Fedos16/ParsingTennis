import puppeteer from 'puppeteer'

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

    const table_tennis_url = 'https://1xstavka.ru/live/Table-Tennis/';

    let current_url = page.url();
    if (current_url != table_tennis_url) {
        await page.goto(table_tennis_url);
    }

    await page.waitFor(2000);

    let code_page = await page.content();

    let $ = cherio.load(code_page);

    let block = $('#games_content div div div div[data-name="dashboard-champ-content"]');
    for (let i=0; i < block.length; i++) {
        let name = $(block[i]).find('.c-events__name a').text();
        console.log(` -- ${name}`);
        let game_urls = $(block[i]).find('a.c-events__name');
        let people = $(block[i]).find('a.c-events__name span.c-events__teams');

        let scores = $(block[i]).find('.c-events-scoreboard__lines')
        for (let x=0; x < game_urls.length; x++) {
            let game_url = $(game_urls[x]).attr('href');
            let person = $(people[x]).attr('title');
            let text_score = '';

            let score_line_one = $(scores[x]).find('.c-events-scoreboard__line:nth-child(1)');
            let score_line_two = $(scores[x]).find('.c-events-scoreboard__line:nth-child(2)');

            let elements_score_line_one = $(score_line_one).find('.c-events-scoreboard__cell');
            let elements_score_line_two = $(score_line_two).find('.c-events-scoreboard__cell');
            for (let y=0; y < elements_score_line_one.length; y ++) {
                let t1 = $(elements_score_line_one[y]).text();
                let t2 = $(elements_score_line_two[y]).text();
                
                if (y == 0) {
                    text_score += `${t1} : ${t2}`;
                } else {
                    text_score += ` [${t1} - ${t2}]`;
                }
            }


            console.log(` -- -- ${person} === (${text_score})`);
            //console.log(` -- -- (${game_url})`);
        }
    }

    return current_url;
}