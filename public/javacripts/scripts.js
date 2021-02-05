$(document).ready(async function(){

    const PERCENT_TRUE = 53;

    let ARRAY = {};
    const url = window.location.pathname;

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

        if ('data' in data) {

            console.log(data);

            addDataInSelect(Object.keys(data.data.data));
            localStorage.setItem('ALL_DATA', JSON.stringify(data.data.data));

            await setRows_v2(data.data.data);
        }
    })
    .on('bot_notification', async (data) => {
        $('.progress_bar').text(data.text);
        $('img').remove();
        if ('status_bot' in data) {
            let status_bot = data.status_bot;
            if (status_bot) {
                $('#start_bot').attr('disabled', true);
                $('#stop_bot').removeAttr('disabled');
            } else {
                $('#start_bot').removeAttr('disabled');
                $('#stop_bot').attr('disabled', true);
            }
        }
        if ('captcha' in data) {
            $('.overflow_row').before(`<img src="/images/CAPTCHA.png" alt="">`);
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
        if (url == '/bot') setRowsBotData(arr);
    })
    .on('calc_statistics', async data => {
        function addRowInTable(data) {

            let per_plus = '<br>';
            let per_minus = '';
            let rub = '';
            if (data.all > 0) {
                per_plus = ' - ' + (data.plus / data.all * 100).toFixed(2) + '%';
                per_minus = ' - ' + (data.minus / data.all * 100).toFixed(2) + '%';
                rub = 'р.';
            }

            let style = '';
            if (data.name == 'ИТОГО') style="background-color: rgb(255, 255, 140); font-weight: bold;"

            $('table tbody').append(`<tr style="${style}">
                <td style="text-align: left;">${data.name}</td>
                <td>${data.type}</td>
                <td><b>${data.all}</b></td>
                <td><b>${data.plus}</b>${per_plus}</td>
                <td><b>${data.minus}</b>${per_minus}</td>
                <td><b>${Number(data.rev).toFixed(2)}${rub}</b></td>
            </tr`);
        }

        $('.progress_bar').text(data.text);
        console.log(data);
        let bets = data.bets;
        
        let arr = {};

        let sum_bet = 50;

        for (let row of bets) {
            let name = row.Championat;
            let type = row.TypeBet;
            let status = row.Status;
            let kef = row.Kef;

            let pl = 0;
            let mn = 0;
            (status == 'Выйгрыш') ? pl = 1 : mn = 1;

            let rev = 0;
            (status == 'Выйгрыш') ? rev = sum_bet * kef - sum_bet : rev = -sum_bet;
            rev = Number(rev.toFixed(2));

            if (name in arr) {
                if (type in arr[name]) {
                    arr[name][type].all += 1;
                    arr[name][type].plus += pl;
                    arr[name][type].minus += mn;
                    arr[name][type].rev += rev;
                } else {
                    arr[name][type] = {
                        all: 1, plus: pl, minus: mn, rev: rev
                    }
                }
            } else {
                arr[name] = {};
                arr[name][type] = {
                    all: 1, plus: pl, minus: mn, rev: rev
                }
            }
        }

        $('table tbody').html(`<tr style="background-color: rgb(240, 240, 240);">
        <td>Название турнира</td><td>Алгоритм</td><td>Всего ставок</td><td>Выйгрыш и %</td><td>Пройгрыш и %</td><td>Прибыль</td></tr>`);

        let all_tb = {all: 0, plus: 0, minus: 0, rev: 0};
        let all_tm = {all: 0, plus: 0, minus: 0, rev: 0};
        let all_all = {all: 0, plus: 0, minus: 0, rev: 0};

        Object.keys(arr).map(name => {
            Object.keys(arr[name]).map(type => {
                let cur = arr[name][type];
                addRowInTable({name, type, all: cur.all, plus: cur.plus, minus: cur.minus, rev: cur.rev});
                if (type == '18.5 М') {
                    all_tm.all += cur.all;
                    all_tm.plus += cur.plus;
                    all_tm.minus += cur.minus;
                    all_tm.rev += cur.rev;
                } else {
                    all_tb.all += cur.all;
                    all_tb.plus += cur.plus;
                    all_tb.minus += cur.minus;
                    all_tb.rev += cur.rev;
                }
                all_all.all += cur.all;
                all_all.plus += cur.plus;
                all_all.minus += cur.minus;
                all_all.rev += cur.rev;
            })
        })

        addRowInTable({name: '', type: '', all: '', plus: '', minus: '', rev: ''});
        addRowInTable({name: 'Итого', type: '18.5 Б', all: all_tb.all, plus: all_tb.plus, minus: all_tb.minus, rev: all_tb.rev});
        addRowInTable({name: 'Итого', type: '18.5 М', all: all_tm.all, plus: all_tm.plus, minus: all_tm.minus, rev: all_tm.rev});
        addRowInTable({name: 'ИТОГО', type: 'Все', all: all_all.all, plus: all_all.plus, minus: all_all.minus, rev: all_all.rev});

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

            let all9x2_reverce = all9x2;
            let true9x2_reverce = all9x2 - true9x2;

            let percent_9x2 = 0;
            if (all9x2 > 0) percent_9x2 = (true9x2 / all9x2 * 100).toFixed(2);

            let percent_9x2_reverce = 0;
            if (all9x2_reverce > 0) percent_9x2_reverce = (true9x2_reverce / all9x2_reverce * 100).toFixed(2);

            let champ = {};
            let champ_reverce = {};
            if ('Championats' in ARRAY) {
                champ = ARRAY.Championats;
                champ_reverce = champ;
            }

            let status_champ = true;
            let status_champ_reverce = true;
            if (day_name) {
                status_champ = false;
                status_champ_reverce = false;
                if (name_ch in champ) {
                    if (champ[name_ch] >= PERCENT_TRUE) status_champ = true;
                    if (champ_reverce[name_ch] >= PERCENT_TRUE) status_champ_reverce = true;
                }
            } else {
                if (percent_9x2 < PERCENT_TRUE) status_champ = false;
                if (percent_9x2_reverce < PERCENT_TRUE) status_champ_reverce = false;
            }

            let style_9x2 = '';
            if (status_champ) {
                all_all9x2 += all9x2;
                all_true9x2 += true9x2;
                style_9x2 = 'color: rgb(103, 153, 3); font-weight: bold;';
            }

            let style_9x2_reverce = '';
            if (status_champ_reverce) {
                all_all9x2_reverce += all9x2_reverce;
                all_true9x2_reverce += true9x2_reverce;
                style_9x2_reverce = 'color: rgb(103, 153, 3); font-weight: bold;';
            }



            return { nums, all9x2, true9x2, percent_9x2, style_9x2, all9x2_reverce, true9x2_reverce, percent_9x2_reverce, style_9x2_reverce };
        }
        function addTableRow(func, name, index) {
            if (!func) return;
            $('table tbody').append(`<tr><td>${index}</td><td>${name}</td><td>${func.nums}</td>
                <td style="${func.style_9x2}">
                    ${func.all9x2}(${func.true9x2}) - ${func.percent_9x2} %
                </td>
                <td style="${func.style_9x2_reverce}">
                    ${func.all9x2_reverce}(${func.true9x2_reverce}) - ${func.percent_9x2_reverce} %
                </td>
            </tr>`);
        }

        $('table tbody').html('');

        let index = 1;
        let all_nums = 0;

        let all_all9x2 = 0;
        let all_true9x2 = 0;

        let all_all9x2_reverce = 0;
        let all_true9x2_reverce = 0;

        let datas = await setArrayForRead();

        let true_champ = {};

        Object.keys(datas).map(name => {
            let func = getDataForDay(datas[name], name);

            if (!day_name) {
                if (func.percent_9x2 >= PERCENT_TRUE || func.percent_9x2_reverce >= PERCENT_TRUE) {
                    if (!(name in true_champ)) true_champ[name] = { a9x2: func.percent_9x2, a9x2_reverce: func.percent_9x2_reverce };
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

        let percent_9x2_reverce = 0
        if (all_all9x2_reverce > 0) percent_9x2_reverce = (all_true9x2_reverce / all_all9x2_reverce * 100).toFixed(2);

        $('table tbody').prepend(`<tr style="background-color: rgb(103, 153, 3);"><td>${0}</td><td>ВСЕ ТУРНИРЫ</td><td>${all_nums}</td>
            <td>
                ${all_all9x2}(${all_true9x2}) - ${percent_9x2} %
            </td>
            <td>
                ${all_all9x2_reverce}(${all_true9x2_reverce}) - ${percent_9x2_reverce} %
            </td>
        </tr>`);
    }
    async function setRowsBotData(arr) {
        $('table tbody').text('');



        Object.keys(arr).map(championat => {
            let arrs = arr[championat];

            let code_nobet = '';
            let code_bet = '';

            let status_liga = false;
            let type_bet_liga = '';

            for (let row of arrs) {
                let scores = row.score;

                let status_bet = row.status_stavka;
                status_liga = row.status_liga;

                if (status_liga) type_bet_liga = ' - ' + row.type_bet_liga;

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

            let style_liga = 'background-color: rgb(240, 240, 240);';
            if (status_liga) style_liga = 'background-color: #2586cd;';

            $('table tbody').append(`<tr style="${style_liga}"><td colspan="2">${championat}${type_bet_liga}</td></tr>`)

            $('table tbody').append(`${code_bet}${code_nobet}`);
        })
    }

    if (url == '/statistics') {
        socket.emit('get_statistics', { period: 'all' });
    }

});