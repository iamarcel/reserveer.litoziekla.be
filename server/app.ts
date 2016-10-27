/// <reference path="../typings/index.d.ts" />

import 'core-js';
import * as express from 'express';

import { AppData } from '../src/app/app-data';

const PORT = 3000;

const app = express();

app.use(express.static(__dirname + '/../dist'));

let appData = new AppData();
const mockData = appData.createDb();
app.get('/app/current-production', (req, res) => {
    res.json({
        data: mockData['current-production']
    });
});

app.listen(PORT, _ => {
    console.log('App listening in port ' + PORT + '!');
});
