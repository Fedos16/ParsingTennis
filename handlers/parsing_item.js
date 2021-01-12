import {getPageContent} from '../helpers/puppeteer'
import {NameFile} from '../helpers/name_file'

const fs = require('fs');

const URL = 'https://1xstavka.ru/results/';

export async function getData() {
    try {
        const pageContent = await getPageContent(URL);

        fs.writeFile(`parsed_files/${NameFile()}.html`, pageContent, (err) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log('Файл успешно записан');
        });
        
        return {status: true, data: null};

    } catch(e) {
        console.log('Ошибка !!!');
        console.log(e);
    }
}