const cherio = require('cheerio');
const fs = require('fs');

import {NameFile} from '../helpers/name_file'

export async function Processing_File () {
    try {

        let data_file;

        fs.readFile(`parsed_files/${NameFile()}.html`, "utf8", (err, data) => {
            if (err) throw err;

            data_file = data;
        });

        let $ = cherio.load(data_file);

        let competition_names = $('.c-games__item .c-games__col .c-games__row .c-games__name');
        console.log(competition_names.length);

        return {status: true, data: null}
    } catch (e) {
        return {status: false, err: e}
    }
}