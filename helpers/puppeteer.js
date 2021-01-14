import puppeteer from 'puppeteer'

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

        /**
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
         */
        /* `--proxy-server=${proxy.ip}:${proxy.port}` */
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

        await page.goto(url);

        await page.waitForSelector('.b-menu__nav .c-nav__item');
        const kind_sport = await page.$('.b-menu__nav .c-nav__item:nth-child(7)');
        await kind_sport.click();
        const view_all_button = await page.$('.c-filters__item:nth-child(9) div div:nth-child(1)');
        await view_all_button.click();

        await page.waitForSelector('.c-games .c-games__col .c-games__col:nth-child(1)');

        let now = new Date();
        let now_day = now.getDate();

        let contents = [];

        for (let i=1; i < now_day; i++) {
            console.log(`День: ${i}`);
            const calendar = await page.$('.c-filter_datepicker');
            await calendar.click();
            
            const [day_calendar] = await page.$x(`//*[@class="vdp-datepicker__calendar"]/div/span[text()="${i}"]`);
            await day_calendar.click();

            await page.waitForSelector('.c-games .c-games__col .c-games__col:nth-child(1)');

            // Экономим около 3 секнд на каджой итерации
            //await page.screenshot({path: `example_${i}.png`});

            const content = await page.content();

            contents.push({name: i, value: content});

            socket.emit('parsing_result', {text: `Спарсили день №${i}. Выполнено`, data: null});
            
        }
        
        browser.close();

        console.log('Браузер закрыт');

        return contents;

    } catch (e) {
        throw e
    }
}