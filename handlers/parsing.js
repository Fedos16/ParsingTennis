import {getPageContent} from '../helpers/puppeteer'
import {NameFile} from '../helpers/name_file'

const URL = 'https://1xstavka.ru/results/';

export async function Parsing (socket) {

    try {

        socket.emit('parsing_result', {text: 'Подготавливаем браузер. Выполнено', data: null});

        // Парсим данные
        await getPageContent(URL, socket);
        
        return {status: true, data: null};

    } catch(e) {
        console.log(e);
        return {status: false, err: e}
    }
}