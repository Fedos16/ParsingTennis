$(document).ready(async function(){

    var socket = io.connect();

    const setStatus = (text, style) => {
        if (style == 'green') {
            $('#progress_bar').css({'color': 'green'});
        } else if (style == 'red') {
            $('#progress_bar').css({'color': 'red'});
        } else if (style == 'standart' || !style) {
            $('#progress_bar').css({'color': 'white'});
        }
        $('#progress_bar').text(text);
    }

    let start = new Date();

    $('#start_parsing').on('click', (e) => {
        setStatus('Начинаем парсинг ...');
        start = new Date();
        socket.emit('start_parsing', {text: 'start'});
    });
    $('#parsing_file').on('click', (e) => {
        setStatus('Открываем файл ...');
        start = new Date();
        socket.emit('parsing_file', { text: 'start' });
    })

    socket
    .on('open_connect', (msg) => {
        setStatus(msg.text, 'green');
    })
    .on('connect', () => {
        setStatus('Соединение с сервером установлено', 'green');
    })
    .on('disconnect', () => {
        setStatus('Соединение с серверов разорвано', 'red');
    })
    .on('reconnect_failed', () => {
        setStatus('Ошибка повторного соединения', 'red');
    })
    .on('transfer_data', (data) => {
        setStatus(data.text, 'green');
        console.log(data);
    })
    .on('parsing_result', (data) => {
        setStatus(data.text + ` за ${(new Date() - start) / 1000} секунд.`, 'green');
        console.log(data);
    })
    .on('parsing_file_result', (data) => {
        setStatus(data.text + ` за ${(new Date() - start) / 1000} секунд.`, 'green');
        console.log(data);
    })

});