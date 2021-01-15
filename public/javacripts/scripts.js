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
        //setRows(data.data.data);
        setRows_v2(data.data.data);
    })

    function setRows(arr) {

        function getData20x2(score) {

            let val_all = 0;
            let val_true = 0;

            let text = String(score).replace(/\(|\)/g, '').split(' ')[1]
            let s_arr = text.split(',');
            for (let i=1; i < s_arr.length; i++) {
                if (i+1 <= s_arr.length-1) {
                    let b = s_arr[i-1].split(':');
                    let a = s_arr[i].split(':');
                    let c = s_arr[i+1].split(':');

                    let b1 = Number(b[0]);
                    let b2 = Number(b[1]);

                    let a1 = Number(a[0]);
                    let a2 = Number(a[1]);

                    let c1 = Number(c[0]);
                    let c2 = Number(c[1]);

                    if (b1+b2 >= 20 && a1+a2 >= 20) {
                        val_all ++;
                        if (c1+c2 <= 18) {
                            val_true ++;
                        }
                    }

                }
            }

            return { val_all, val_true }
        }


        let index = 1;
        let all_nums = 0;

        let all_all9x2 = 0;
        let all_true9x2 = 0;

        $('table tbody').html('');

        Object.keys(arr).map(name => {
            let nums = arr[name].length;

            let arrs = arr[name];

            let all9x2 = 0;
            let true9x2 = 0;

            for (let row of arrs) {
                let scores = row.score;
                for (let score of scores) {
                    let f_getData20x2 = getData20x2(score);

                    all9x2 += f_getData20x2.val_all;
                    true9x2 += f_getData20x2.val_true;
                }
            }

            all_nums += nums;

            let percent_9x2 = 0
            if (all9x2 > 0) percent_9x2 = (true9x2 / all9x2 * 100).toFixed(2);

            let style_9x2 = '';
            if (percent_9x2 >= 53) {
                all_all9x2 += all9x2;
                all_true9x2 += true9x2;
                style_9x2 = 'color: rgb(103, 153, 3);';
            }

            $('table tbody').append(`<tr><td>${index}</td><td>${name}</td><td>${nums}</td>
                <td style="${style_9x2}">
                    ${all9x2}(${true9x2}) - ${percent_9x2} %
                </td>
            </tr>`)
            index ++;
        })

        let percent_9x2 = 0
        if (all_all9x2 > 0) percent_9x2 = (all_true9x2 / all_all9x2 * 100).toFixed(2);

        $('table tbody').prepend(`<tr style="background-color: rgb(103, 153, 3);"><td>${0}</td><td>ВСЕ ТУРНИРЫ</td><td>${all_nums}</td>
            <td>
                ${all_all9x2}(${all_true9x2}) - ${percent_9x2} %
            </td>
        </tr>`);
    }
    function setRows_v2(arr) {
        $('table tbody').html('');

        let index = 1;
        let all_nums = 0;

        let all_all9x2 = 0;
        let all_true9x2 = 0;

        Object.keys(arr).map(name => {
            let nums = arr[name].nums;
            all_nums += nums;

            let all9x2 = arr[name].all_v;
            let true9x2 = arr[name].true_v;

            let percent_9x2 = 0
            if (all9x2 > 0) percent_9x2 = (true9x2 / all9x2 * 100).toFixed(2);

            let style_9x2 = '';
            if (percent_9x2 >= 53) {
                all_all9x2 += all9x2;
                all_true9x2 += true9x2;
                style_9x2 = 'color: rgb(103, 153, 3);';
            }

            $('table tbody').append(`<tr><td>${index}</td><td>${name}</td><td>${nums}</td>
                <td style="${style_9x2}">
                    ${all9x2}(${true9x2}) - ${percent_9x2} %
                </td>
            </tr>`)
            index ++;
        })

        let percent_9x2 = 0
        if (all_all9x2 > 0) percent_9x2 = (all_true9x2 / all_all9x2 * 100).toFixed(2);

        $('table tbody').prepend(`<tr style="background-color: rgb(103, 153, 3);"><td>${0}</td><td>ВСЕ ТУРНИРЫ</td><td>${all_nums}</td>
            <td>
                ${all_all9x2}(${all_true9x2}) - ${percent_9x2} %
            </td>
        </tr>`);
    }

});