
import puppeteer from 'puppeteer'
import express from 'express'
import path from 'path'
import http from 'http'
import bodyParser from 'body-parser'

import routes from './routes'
import config from './config'

const mongoose = require('mongoose');


// database
mongoose.Promise = global.Promise;
const options = {
  socketTimeoutMS: 30000,
  keepAlive: true,
  reconnectTries: 30000
}
mongoose.set('debug', config.IS_PRODUCTION);
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