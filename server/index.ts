/// <reference path="../typings/index.d.ts" />

import 'core-js';
import * as express from 'express';
import * as bodyParser from 'body-parser';
const JSForce = require('jsforce');
const SETTINGS = require('./settings.json');

import { AppData } from '../src/app/app-data';

// Set up a Salesforce connection
console.log('Connecting to Salesforce...');
const sf = new JSForce.Connection({
    loginUrl: SETTINGS['salesforce']['url']
});
sf.login(SETTINGS['salesforce']['auth']['user'],
         SETTINGS['salesforce']['auth']['pass'],
         (err, user) => {
             if (err) {
                 return console.error(err);
             }

             console.log('Logged in as ' + user.id + '!');
             console.dir(user);
         });

const PORT = 3000;

export const app = express();
app.use(bodyParser.json());

app.use(express.static(__dirname + '/../dist'));

let appData = new AppData();
const mockData = appData.createDb();
app.get('/api/v1/current/productions', (req, res) => {
    res.json(mockData['current-production']);
});

app.get('/api/v1/recordTypes', (req, res) => {
    res.json(mockData['record-types']);
});

app.post('/api/v1/reservations', (req, res) => {
    console.dir(req.body);
});

app.listen(PORT, _ => {
    console.log('App listening in port ' + PORT + '!');
});
