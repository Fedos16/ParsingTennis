import puppeteer from 'puppeteer'
const fs = require('fs');

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

export async function getPageContent(url, socket) {
    try {

        let contents = [];

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

        try {    
            await page.setViewport({width: 1920, height: 1080});
            
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36');

            await page.goto(url);

            await page.waitForSelector('.b-menu__nav .c-nav__item');
            const kind_sport = await page.$('.b-menu__nav .c-nav__item:nth-child(7)');
            await kind_sport.click();
            const view_all_button = await page.$('.c-filters__item:nth-child(9) div div:nth-child(1)');
            await view_all_button.click();

            try {
                await page.waitForSelector('.c-games .c-games__col .c-games__col:nth-child(1)');
            } catch (e) {
                //await page.screenshot({path: 'screen_' + new Date().getTime() + '.png'});
            }

            let now = new Date();
            let now_day = now.getDate();

            let months = 0;
            let start_date = new Date(now.getFullYear(), now.getMonth() - months, 1);

            // Открываем календарь
            await (await page.$('.c-filter_datepicker')).click();

            let colDays = 0;
            for (let m=0; m < months; m++) {
                let curDate = new Date(start_date);
                curDate.setMonth(curDate.getMonth()+1+m);
                curDate.setDate(0);

                colDays += curDate.getDate();

                let [prev] = await page.$x('//*[@class="vdp-datepicker__calendar"][1]//*[@class="prev"]');
                prev.click();
            }

            colDays += now_day - 1

            let s = 1;
            let curDate = new Date(start_date);
            curDate.setMonth(curDate.getMonth()+1);
            curDate.setDate(0);
            let e = curDate.getDate()+1;
            let month = curDate.getMonth();
            let year = curDate.getFullYear();
            if (month == new Date().getMonth() && year == new Date().getFullYear()) e = now_day;

            for (let i = s; i < e; i++) {

                await page.waitFor(200);

                const [day_calendar] = await page.$x(`//*[@class="vdp-datepicker__calendar"]/div/span[text()="${i}"]`);
                await day_calendar.click();

                try {
                    await page.waitForSelector('.c-games .c-games__col .c-games__col:nth-child(1)');
                } catch (e) {
                    await page.screenshot({path: 'screen_' + new Date().getTime() + '.png'});
                }

                const content = await page.content();

                let day = i;
                if (day < 10) day = '0' + day;
                month = curDate.getMonth() + 1;
                if (month < 10) month = '0' + month;

                let name_file = `${day}.${month}.${year}`;

                fs.writeFileSync(`parsed_files/${name_file}.html`, content);

                socket.emit('parsing_result', {text: `Спарсили день №${i} из ${e}. Время: `, data: null});

                const calendar = await page.$('.c-filter_datepicker');
                await calendar.click();
            }
            
            browser.close();

            console.log('Браузер закрыт');
        } catch (e) {
            console.log(' --- Делаем скриншот');
            await page.screenshot({path: './public/images/error_parsing.png'});
            console.log(' --- Скриншот сделан');
        }

        return contents;

    } catch (e) {
        console.log(' --- Не удалось сделать скриншот');
        console.log(e)
        throw e;
    }
}