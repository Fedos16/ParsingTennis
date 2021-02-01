
import puppeteer from 'puppeteer'
import express from 'express'
import path from 'path'
import http from 'http'
import bodyParser from 'body-parser'

import routes from './routes'
import config from './config'

import models from './models'

const mongoose = require('mongoose');


// database
mongoose.Promise = global.Promise;
const options = {
  socketTimeoutMS: 30000,
  keepAlive: true,
  reconnectTries: 30000
}
mongoose.set('debug', !config.IS_PRODUCTION);
mongoose.connection
  .on('error', error => console.log(error))
  .on('close', () => console.log('Database connection closed.'))
  .once('open', async () => {
    const info = mongoose.connections[0];
    console.log(`Connected to ${info.host}:${info.port}/${info.name}`);
  });

mongoose.connect(config.MONGO_URL, options);

let app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({limit: '50mb'}));

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(
    '/javascripts',
    express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist'))
);
app.use(
    '/socket.io',
    express.static(path.join(__dirname, 'node_modules', 'socket.io-client', 'dist'))
);

app.use('/', routes);

let server = http.createServer(app);
server.listen(config.PORT, function(){
  console.log('Сервер работает. Порт:  ' + config.PORT);
});

const dir_path = path.resolve(__dirname);
require('./socket').default(server, dir_path);

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.render('error', {
      message: error.message,
      error: !config.IS_PRODUCTION ? error : {}
    });
});

(async function () {
    let ch = await models.Championats.find({});

    let all = 0;
    let all_alg_all = 0;
    let all_alg_true = 0;

    let all_r = 0;
    let all_alg_all_r = 0;
    let all_alg_true_r = 0;

    let alg9x2 = [];
    let alg9x2_r = [];

    for (let row of ch) {
        let name = row.Name;
        let nums = row.NumberGame;
        let alg_nums = row.A9x2.Number;
        let alg_true = row.A9x2.TrueNumber;
        let percent = row.A9x2.Percent;

        let reverce_percent = 100 - percent;

        if (percent > 53.6) {
            all += nums;
            all_alg_all += alg_nums;
            all_alg_true += alg_true;

            let text = ` - ${name} - ${nums}: ${alg_nums} (${alg_true}) - ${percent}%`;
            if (alg_true > 0) alg9x2.push(text);
        }

        if (reverce_percent > 53.6) {
            all_r += nums;
            all_alg_all_r += alg_nums;
            all_alg_true_r += alg_nums - alg_true;

            let text = ` - ${name} - ${nums}: ${alg_nums} (${alg_nums- alg_true}) - ${reverce_percent}%`;
            if (alg_nums- alg_true > 0) alg9x2_r.push(text);
        }
    }

    console.log('')
    console.log(` ==== ОБЫЧНЫЙ АЛГОРИТМ ====`);
    for (let row of alg9x2) {
        console.log(row);
    }
    console.log(` --- ВСЕ ЛИГИ - ${all}:  ${all_alg_all} (${all_alg_true}) - ${(all_alg_true / all_alg_all * 100).toFixed(2)}%`);
    
    console.log('')
    console.log(` ==== ПЕРЕВЕРНУТЫЙ АЛГОРИТМ ====`);
    for (let row of alg9x2_r) {
        console.log(row);
    }
    console.log(` --- ВСЕ ЛИГИ - ${all_r}:  ${all_alg_all_r} (${all_alg_true_r}) - ${(all_alg_true_r / all_alg_all_r * 100).toFixed(2)}%`);
    console.log('')

})