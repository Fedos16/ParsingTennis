const cherio = require('cheerio');
const fs = require('fs');

const models = require('.././models');

export async function Processing_File () {
    try {

        async function readFileName(name) {

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

            let data_file = fs.readFileSync(`parsed_files/${name}`, "utf8")

            let $ = cherio.load(data_file);

            name = String(name).replace('.html', '');

            if (!(name in arrs)) arrs[name] = {};

            //let arr_db = [];

            let blocks = $('.c-games.p-results__games > div > div.c-games__col');
            for (let i=0; i < blocks.length; i++) {
                let nameComp = String($(blocks[i]).find('.c-games__row.c-games__row_can-toggle.active .c-games__name').text()).trim();

                if (!(nameComp in arrs[name])) {
                    arrs[name][nameComp] = {all_v: 0, true_v: 0, nums: 0};
                }

                let cols = $(blocks[i]).find('.c-games__col');

                let all_v = 0;
                let true_v = 0;

                for (let x=0; x < cols.length; x++) {
                    let dates = String($(cols[x]).find('.c-games__date').text()).trim();

                    let arr_dates = dates.split(' ');
                    let date_part = name.split('.');
                    let time_part = arr_dates[1].split(':');

                    let date = new Date(date_part[2], date_part[1], date_part[0], time_part[0], time_part[1]);

                    let peps = String($(cols[x]).find('.c-games__opponents.u-dir-ltr').text()).trim()
                    let scores = $(cols[x]).find('.c-games__results.u-mla.u-tar');

                    let score_arr = [];

                    for (let z =0; z < scores.length; z++) {
                        let score = String($(scores[z]).text()).trim();
                        score_arr.push(score);

                        let f_getData20x2 = getData20x2(score);

                        all_v += f_getData20x2.val_all;
                        true_v += f_getData20x2.val_true;

                        let arr_score = score.replace(/\(|\)/g, '').split(' ');
                        let main_score = arr_score[0];
                        let dop_text = String(arr_score[1]).split(',');
                        let arr_sc = []
                        for (let row of dop_text) {
                            arr_sc.push(row.split(':'));
                        }

                        let peps_arr = String(peps).split(' - ');

                        /* arr_db.push({
                            Championat: nameComp,
                            HomePerson: peps_arr[0],
                            GuestPerson: peps_arr[1],
                            Score: {
                                Main: main_score,
                                More: arr_sc
                            },
                            DateGame: date
                        }); */

                    }

                    //arrs[nameComp].push({ name: peps, score: score_arr});
                }

                arrs_championats
                if (nameComp in arrs_championats) {
                    arrs_championats[nameComp].NumberGame += cols.length;
                    arrs_championats[nameComp].A9x2.Number += all_v;
                    arrs_championats[nameComp].A9x2.TrueNumber += true_v;

                    let percent = 0;
                    if (arrs_championats[nameComp].A9x2.Number > 0) percent = (arrs_championats[nameComp].A9x2.TrueNumber / arrs_championats[nameComp].A9x2.Number * 100).toFixed(2);
                    arrs_championats[nameComp].A9x2.Percent = percent;
                } else {

                    let percent = 0;
                    if (all_v > 0) percent = (true_v / all_v * 100).toFixed(2);

                    arrs_championats[nameComp] = {
                        NumberGame: cols.length,
                        A9x2: {
                            Number: all_v,
                            TrueNumber: true_v,
                            Percent: percent
                        }
                    }
                }

                arrs[name][nameComp].all_v += all_v;
                arrs[name][nameComp].true_v += true_v
                arrs[name][nameComp].nums += cols.length;
                
            }

            //await models.Games.insertMany(arr_db);

            return {arrs, arrs_championats};
        }

        const folder = 'parsed_files/'
        let files = [];

        fs.readdirSync(folder).forEach(file => {
            files.push(file);
        });

        let arrs = {};
        let arrs_championats = {};

        for (let name of files) {
            let func = await readFileName(name);
            arrs = func.arrs;
            arrs_championats = func.arrs_championats;
        }

        let db_arr = [];
        Object.keys(arrs_championats).map(key => {
            let obj = arrs_championats[key];
            obj.Name = key;
            db_arr.push(obj);
        });

        await models.Championats.remove();
        await models.Championats.insertMany(db_arr);

        return {status: true, data: arrs}
    } catch (e) {
        console.log(e);
        return {status: false, err: e}
    }
}
export async function ProcessingDB() {
    try {
        function get9x2(score) {
            let val_all = 0;
            let val_true = 0;
            for (let i=1; i < score.length; i++) {
                if (i+1 <= score.length-1) {
                    let a = score[i-1];
                    let b = score[i];
                    let c = score[i+1];

                    let a1 = Number(a[0]);
                    let a2 = Number(a[1]);

                    let b1 = Number(b[0]);
                    let b2 = Number(b[1]);

                    let c1 = Number(c[0]);
                    let c2 = Number(c[1]);

                    if (a1+a2 >= 20 && b1+b2 >= 20) {
                        val_all ++;
                        if (c1+c2 <= 18) {
                            val_true ++;
                        }
                    }

                }
            }

            return {val_all, val_true};
        }

        let start = new Date();
        let games = await models.Games.find({}, {Score: 1, Championat: 1, DateGame: 1});

        console.log(`Игр получено из Базы: ${games.length} за ${new Date() - start}ms`);

        let arrs = {}

        start = new Date();
        for (let row of games) {
            let score = row.Score.More;
            let name = row.Championat;
            let date = new Date(row.DateGame).toLocaleDateString('ru-RU');

            let func = get9x2(score);

            if (date in arrs) {
                if (name in arrs[date]) {
                    arrs[date][name].nums += 1
                    arrs[date][name].all_v += func.val_all;
                    arrs[date][name].true_v += func.val_true;
                } else {
                    arrs[date][name] = {all_v: func.val_all, true_v: func.val_true, nums: 1};
                }
            } else {
                arrs[date] = {};
                arrs[date][name] = {all_v: func.val_all, true_v: func.val_true, nums: 1};
            }
            
        }

        console.log(`База обработана за: ${new Date() - start}ms`);

        return {status: true, data: arrs}
    } catch(e) {
        console.log(e);
    }
}