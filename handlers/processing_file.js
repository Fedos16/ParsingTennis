const cherio = require('cheerio');
const fs = require('fs');

import {NameFile} from '../helpers/name_file'

export async function Processing_File () {
    try {

        let data_file = fs.readFileSync(`parsed_files/${NameFile()}.html`, "utf8")

        let $ = cherio.load(data_file);

        let arrs = {};

        let blocks = $('.c-games.p-results__games > div > div.c-games__col');
        for (let i=0; i < blocks.length; i++) {
            let nameComp = String($(blocks[i]).find('.c-games__row.c-games__row_can-toggle.active .c-games__name').text()).trim();

            arrs[nameComp] = [];

            let cols = $(blocks[i]).find('.c-games__col');
            for (let x=0; x < cols.length; x++) {
                let peps = String($(cols[x]).find('.c-games__opponents.u-dir-ltr').text()).trim()
                let scores = $(cols[x]).find('.c-games__results.u-mla.u-tar');

                let score_arr = [];

                for (let z =0; z < scores.length; z++) {
                    let score = String($(scores[z]).text()).trim();
                    score_arr.push(score);
                }

                arrs[nameComp].push({ name: peps, score: score_arr });
            }
            
        }

        return {status: true, data: arrs}
    } catch (e) {
        console.log(e);
        return {status: false, err: e}
    }
}