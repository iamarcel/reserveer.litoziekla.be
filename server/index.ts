/// <reference path="../typings/index.d.ts" />

import 'core-js';
import * as express from 'express';
import * as bodyParser from 'body-parser';
// const JSForce = require('jsforce');
import * as JSForce from 'jsforce';
const SETTINGS = require('./settings.json');

import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import 'rxjs/add/observable/bindNodeCallback';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/last';
import 'rxjs/add/operator/forkJoin';

import { AppData } from '../src/app/app-data';




const PORT = 3000;





// Set up a Salesforce connection
console.log('[LOG] Logging in to Salesforce...');
const connection = new JSForce.Connection({
    loginUrl: SETTINGS['salesforce']['url']
});
const login = Observable.fromPromise(
    connection.login(SETTINGS['salesforce']['auth']['user'],
                     SETTINGS['salesforce']['auth']['pass']));
login.subscribe(result => console.log('[LOG] Logged in to Salesforce.'),
                err => console.error('[ERROR] while logging in to Salesforce:\n', err));

// Fetch & store information we'll be using
const CAMPAIGN_FIELDS = 'Id,Name,Maximum_Opportunities__c,MaximumProducts__c,Hero_Image__c,'
    + 'StartDate,EndDate,NumberOfOpportunities,NumberOfProducts__c,'
    + 'Location__c,RecordTypeId,RecordType.Name,RecordType.DeveloperName,'
    + 'DefaultPricebook2__c';
const productions = Observable.create((observer: Observer<any>) => {
    login.last().subscribe(_ => {
        console.log('[LOG] Caching current production...');
        (connection as any).sobject('Campaign')
            .find({
                'RecordType.DeveloperName': 'Production'
            }, CAMPAIGN_FIELDS)
            .include('ChildCampaigns')
                .select(CAMPAIGN_FIELDS)
                .end()
            .sort('-StartDate')
            .limit(1)
            .execute((err, records) => {
                if (err) {
                    console.error(err);
                    return observer.error(err);
                }
                observer.next(records[0]);
                observer.complete();
            });
    });
});
productions.subscribe(result => console.log('[LOG] Cached current production.'),
                      err => console.error('[ERROR] while caching production:\n', err));

const PRICEBOOK2_FIELDS = '';
const products = Observable.create((observer: Observer<any>) => {
    Observable.fork
    login.last().subscribe(_ => {
        console.log('[LOG] Caching products...');
        (connection as any).sobject('PricebookEntry')
            .find({
                'Pricebook2Id': '' // TODO Get Default_Pricebook__c from Campaign
            }, PRICEBOOK2_FIELDS);
    });
});




// Start up the app
export const app = express();
app.use(bodyParser.json());

app.use(express.static(__dirname + '/../dist'));

let appData = new AppData();
const mockData = appData.createDb();
app.get('/api/v1/current/productions', (req, res) => {
    productions.last().subscribe((result) => res.json(result));
});

app.get('/api/v1/current/productions/tickets', (req, res) => {
    res.json(mockData['current-production']['products']);
});

app.get('/api/v1/recordTypes', (req, res) => {
    res.json(mockData['record-types']);
});

app.post('/api/v1/reservations', (req, res) => {
    console.dir(req.body);
});

app.listen(PORT, _ => {
    console.log('\n[NICE] App listening in port ' + PORT + '!');
});
