import {getPageContent} from '../helpers/puppeteer'
import {NameFile} from '../helpers/name_file'

const fs = require('fs');

const URL = 'https://1xstavka.ru/results/';

export async function Parsing (socket) {

    try {

        socket.emit('parsing_result', {text: 'Подготавливаем браузер. Выполнено', data: null});

        // Массив со страницами
        const datas = await getPageContent(URL, socket);

        if (datas) {
            for (let row of datas) {
                let now = new Date();
                let day = row.name;
                if (day < 10) day = '0' + day;
                let month = now.getMonth()+1;
                if (month < 10) month = '0' + month;
                let year = now.getFullYear();

                let page = row.value;

                let name_file = `${day}.${month}.${year}`;

                fs.writeFileSync(`parsed_files/${name_file}.html`, page);
            }
        }

        /* fs.writeFile(`parsed_files/${NameFile()}.html`, pageContent, (err) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log('Файл успешно записан');
        }); */
        
        return {status: true, data: null};

    } catch(e) {
        console.log(e);
        return {status: false, err: e}
    }
}