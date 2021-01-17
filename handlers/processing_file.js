const cherio = require('cheerio');
const fs = require('fs');

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
                    let peps = String($(cols[x]).find('.c-games__opponents.u-dir-ltr').text()).trim()
                    let scores = $(cols[x]).find('.c-games__results.u-mla.u-tar');

                    let score_arr = [];

                    for (let z =0; z < scores.length; z++) {
                        let score = String($(scores[z]).text()).trim();
                        score_arr.push(score);

                        let f_getData20x2 = getData20x2(score);

                        all_v += f_getData20x2.val_all;
                        true_v += f_getData20x2.val_true;

                    }

                    //arrs[nameComp].push({ name: peps, score: score_arr});
                }

                arrs[name][nameComp].all_v += all_v;
                arrs[name][nameComp].true_v += true_v
                arrs[name][nameComp].nums += cols.length;
                
            }

            return arrs;
        }

        const folder = 'parsed_files/'
        let files = [];

        fs.readdirSync(folder).forEach(file => {
            files.push(file);
        });

        let arrs = {};

        for (let name of files) {
            arrs = await readFileName(name);
        }


        return {status: true, data: arrs}
    } catch (e) {
        console.log(e);
        return {status: false, err: e}
    }
}