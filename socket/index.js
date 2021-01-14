import {Parsing} from '../handlers/parsing'
import {Processing_File} from '../handlers/processing_file';

export default function (server, dir_path) {
    let io = require('socket.io').listen(server);
    io.sockets.on('connection', (socket) => {
        console.log('Пользователь подключен');

        socket.on('disconnect', () => {
            console.log('Пользователь отключился');
        });

        socket.emit('open_connect', {text: 'Соединение с сервером установлено'});

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
    });
}