$(document).ready(async function(){

    let ARRAY = {};

    var socket = io.connect();

    const setStatus = (text, style) => {
        if (style == 'green') {
            $('#progress_bar').css({'color': 'green'});
        } else if (style == 'red') {
            $('#progress_bar').css({'color': 'red'});
        } else if (style == 'standart' || !style) {
            $('#progress_bar').css({'color': 'black'});
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
        $('table tbody').html('');
        socket.emit('parsing_file', { text: 'start' });
    })
    $('#start_bot').on('click', (e) => {
        $(e.target).attr('disabled', true);
        $('#stop_bot').removeAttr('disabled');
        $('.progress_bar').text('Запускаем ракету ...');
        socket.emit('bot_start', {text: 'start'});
    })
    $('#stop_bot').on('click', (e) => {
        $(e.target).attr('disabled', true);
        socket.emit('bot_stop', {text: 'stop'});
    })
    $(document).on('click', '#Days', async (e) => {
        let day = $(e.target).find('option:selected').val();

        let arr = localStorage.getItem('ALL_DATA');
        if (arr) arr = JSON.parse(arr);

        (day == 'Все дни') ? await setRows_v2(arr) : await setRows_v2(arr, day);
    })
    $('#send_code').on('click', (e) => {
        const code = $('#captcha_code').val();
        if (!code) return;

        $('.modal_block').hide();

        $('.progress_bar').text('Отправили код, ждем ...');

        socket.emit('send_code', { code });
    })

    socket
    .on('open_connect', (msg) => {
        setStatus(msg.text, 'green');
    })
    .on('connect', () => {
        $('.status_server').text('Онлайн');
        socket.emit('get_status_bot', {text: 'true_false'});
        //setStatus('Соединение с сервером установлено', 'green');
    })
    .on('disconnect', () => {
        $('.status_server').text('Офлайн');
        //setStatus('Соединение с серверов разорвано', 'red');
    })
    .on('reconnect_failed', () => {
        setStatus('Ошибка повторного соединения', 'red');
    })
    .on('transfer_data', (data) => {
        setStatus(data.text, 'green');
        console.log(data);
    })
    .on('parsing_result', (data) => {
        let time = (new Date() - start) / 1000;
        time = time / 60;
        let num = Math.trunc(time)
        let part = (time - num);


        console.log(time);

        (num > 0) ? time = `${num} мин. ${(part * 60).toFixed(0)} сек.` : time = `${(part * 60).toFixed(0)} сек.`;

        setStatus(data.text + ` ${time}`, 'green');
        //console.log(data);
    })
    .on('parsing_file_result', async (data) => {
        setStatus(data.text + ` за ${(new Date() - start) / 1000} секунд.`, 'green');
        console.log(data);

        addDataInSelect(Object.keys(data.data.data));

        localStorage.setItem('ALL_DATA', JSON.stringify(data.data.data));

        await setRows_v2(data.data.data);
    })
    .on('bot_notification', async (data) => {
        $('.progress_bar').text(data.text);
        if ('status_bot' in data) {
            let status_bot = data.status_bot;
            if (status_bot) {
                $('#start_bot').attr('disabled', true);
                $('#stop_bot').removeAttr('disabled');
            } else {
                $('#start_bot').removeAttr('disabled');
                $('#stop_bot').attr('disabled', true);
                $('table tbody').text('');
            }
        }
    })
    .on('bot_stopped', async (data) => {
        $('.progress_bar').text(data.text);
        $('#start_bot').removeAttr('disabled');
        $('#stop_bot').attr('disabled', true);
    })
    .on('captcha_code', async (data) => {
        $('.modal_block').show();
        $('#captcha_code').val('')
        $('#captcha_code').focus();
    })
    .on('transfer_data_bot', async (data) => {
        let arr = data.data;
        setRowsBotData(arr);
    })

    function addDataInSelect(days) {
        $('#Days').html('<option value="Все дни">Все дни</option>');
        for (let day of days) {
            $('#Days').append(`<option value="${day}">${day}</option>`);
        }

        $('#Days').removeAttr('disabled');
    }
    async function setRows_v2(arr, day_name) {

        async function setArrayForRead() {
            const days = Object.keys(arr);

            let arr_names = {};
            if (day_name) {
                arr_names = arr[day_name];
            } else {
                for (let day of days) {
                    let names = Object.keys(arr[day]);
                    for (let name of names) {
                        if (name in arr_names) {
                            let row = arr[day][name];
    
                            arr_names[name].all_v += row.all_v;
                            arr_names[name].true_v += row.true_v;
                            arr_names[name].nums += row.nums;
                        } else {
                            arr_names[name] = arr[day][name];
                        }
                    }
                }
            }

            return arr_names;
        }
        function getDataForDay(array, name_ch) {
            let nums = array.nums;
            all_nums += nums;

            let all9x2 = array.all_v;
            let true9x2 = array.true_v;

            let percent_9x2 = 0
            if (all9x2 > 0) percent_9x2 = (true9x2 / all9x2 * 100).toFixed(2);

            let champ = ARRAY.Championats;
            let status_champ = true;
            if (day_name) {
                status_champ = false;
                if (name_ch in champ) {
                    if (champ[name_ch] >= 53.6) status_champ = true;
                }
            } else {
                if (percent_9x2 < 53.6) status_champ = false;
            }

            let style_9x2 = '';
            if (status_champ) {
                all_all9x2 += all9x2;
                all_true9x2 += true9x2;
                style_9x2 = 'color: rgb(103, 153, 3); font-weight: bold;';
            }



            return {nums, all9x2, true9x2, percent_9x2, style_9x2};
        }
        function addTableRow(func, name, index) {
            if (!func) return;
            $('table tbody').append(`<tr><td>${index}</td><td>${name}</td><td>${func.nums}</td>
                <td style="${func.style_9x2}">
                    ${func.all9x2}(${func.true9x2}) - ${func.percent_9x2} %
                </td>
            </tr>`);
        }

        $('table tbody').html('');

        let index = 1;
        let all_nums = 0;

        let all_all9x2 = 0;
        let all_true9x2 = 0;

        let datas = await setArrayForRead();

        let true_champ = {};

        Object.keys(datas).map(name => {
            let func = getDataForDay(datas[name], name);

            if (!day_name) {
                if (func.percent_9x2 >= 53) {
                    if (!(name in true_champ)) true_champ[name] = func.percent_9x2;
                }
            }

            addTableRow(func, name, index);

            index ++;
        });

        if (!day_name) {
            ARRAY.Championats = true_champ;
        }

        let percent_9x2 = 0
        if (all_all9x2 > 0) percent_9x2 = (all_true9x2 / all_all9x2 * 100).toFixed(2);

        $('table tbody').prepend(`<tr style="background-color: rgb(103, 153, 3);"><td>${0}</td><td>ВСЕ ТУРНИРЫ</td><td>${all_nums}</td>
            <td>
                ${all_all9x2}(${all_true9x2}) - ${percent_9x2} %
            </td>
        </tr>`);
    }
    async function setRowsBotData(arr) {
        $('table tbody').text('');



        Object.keys(arr).map(championat => {
            let arrs = arr[championat];
            $('table tbody').append(`<tr style="background-color: rgb(240, 240, 240);"><td colspan="2">${championat}</td></tr>`)

            let code_nobet = '';
            let code_bet = '';

            for (let row of arrs) {
                let scores = row.score;

                let status_bet = row.status_stavka;

                let l1 = '<div class="score_row">';
                let l2 = '<div class="score_row">';
                for (let i=0; i < scores.length; i++) {
                    if (i==0) {
                        l1 += `<div class="score_all">${scores[i][0]}</div>`;
                        l2 += `<div class="score_all">${scores[i][1]}</div>`;
                    } else {
                        l1 += `<div class="score_item">${scores[i][0]}</div>`;
                        l2 += `<div class="score_item">${scores[i][1]}</div>`;
                    }
                }
                l1 += `</div>`;
                l2 += `</div>`;

                if (status_bet) {
                    console.log(`СТАВКА: ${championat}`);
                    console.log(row);
                    code_bet += `<tr><td style="text-align: left;">${row.person}<b style="margin-left: 10px; font-weight: bold; color: rgb(0, 119, 255)">СТАВКА</b>
                    </td><td><div class="div_score">${l1}${l2}</div></td></tr>`;
                } else {
                    code_nobet += `<tr><td style="text-align: left;">${row.person}</td><td><div class="div_score">${l1}${l2}</div></td></tr>`;
                }
            }

            $('table tbody').append(`${code_bet}${code_nobet}`);
        })
    }

});