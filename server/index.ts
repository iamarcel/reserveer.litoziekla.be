/// <reference path="../typings/index.d.ts" />

import 'core-js';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as JSForce from 'jsforce';
import * as ApplicationInsights from 'applicationinsights';
const SETTINGS = require('./settings.json');

import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Subject } from 'rxjs/Subject';
import { AsyncSubject } from 'rxjs/AsyncSubject';
import 'rxjs/add/observable/bindNodeCallback';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/from';
import 'rxjs/add/operator/last';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/reduce';
import 'rxjs/add/operator/cache';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/toArray';
const RxHttpRequest = require('rx-http-request').RxHttpRequest;

import { AppData } from '../src/app/app-data';
import { Account } from '../src/app/reservations/models/account';
import { Contact } from '../src/app/reservations/models/contact';
import { Campaign } from '../src/app/reservations/models/campaign';
import { PricebookEntry } from '../src/app/reservations/models/pricebook-entry';
import { Reservation } from '../src/app/reservations/models/reservation';

import { resolveContact } from './resolve-contact';
import { addOpportunityItems } from './add-opportunity-items';
import { getSponsors } from './get-sponsors';
import { postToTeam } from './post-to-team';




const PORT = process.env.PORT || 3000;





// Set up app insights
ApplicationInsights.setup('4a53ccb5-c5c0-4921-a764-de3bf06f910e').start();

// Set up a Salesforce connection
console.log('[LOG] Logging in to Salesforce...');
const connection = new JSForce.Connection({
    loginUrl: SETTINGS['salesforce']['url']
});
const login = Observable.fromPromise(
    connection.login(SETTINGS['salesforce']['auth']['user'],
                     SETTINGS['salesforce']['auth']['pass']))
    .map(x => connection).last().cache(1) as Observable<JSForce.Connection>;
login.subscribe(result => console.log('[LOG] Logged in to Salesforce.'),
                err => console.error('[ERROR] while logging in to Salesforce:\n', err));

// Fetch & store information we'll be using
const CAMPAIGN_FIELDS = 'Id,Name,Maximum_Opportunities__c,MaximumProducts__c,Hero_Image__c,'
    + 'StartDate,EndDate,NumberOfOpportunities,NumberOfProducts__c,'
    + 'Location__c,RecordTypeId,RecordType.Name,RecordType.DeveloperName,'
    + 'DefaultPricebook2__c,Entrance__c';
const productionSubject = new Subject();
const production = productionSubject.last().cache(1);
login.last().subscribe(_ => {
    console.log('[LOG] Caching current production...');
    (connection as any).sobject('Campaign')
        .find({
            'RecordType.DeveloperName': 'Production'
        }, CAMPAIGN_FIELDS)
        .include('ChildCampaigns')
            .select(CAMPAIGN_FIELDS)
            .where({
                'RecordType.DeveloperName': 'Show'
            })
            .sort('EndDate')
        .end()
        .sort('-StartDate')
        .limit(1)
        .execute((err, records: any) => {
            console.log('[LOG] Received answer about current production.');
            if (err) {
                return productionSubject.error(err);
            }

            let campaign = records[0];
            let html = campaign.Hero_Image__c;
            campaign.Hero_Image__c =
                html.replace(/--c\..+\.content\.force\.com/,'.secure.force.com/test');

            console.log('[LOG] Parsed current production\n');
            productionSubject.next(records[0]);
            productionSubject.complete();
        });
});
production.subscribe(result => console.log('[LOG] Production updated.'),
                     err => console.error('[ERROR] while caching production:\n', err));

const PRICEBOOKENTRY_FIELDS = 'Id,Name,Pricebook2Id,Product2Id,'
    + 'UnitPrice,UseStandardPrice,'
    + 'Product2.Id,Product2.Description,Product2.Name';
const productsObservable = production
    .mergeMap((campaign: Campaign) => {
        console.log('[LOG] Caching products...');
        return Observable.create((observer: Observer<PricebookEntry[]>) => {
            (connection as any).sobject('PricebookEntry')
                .find({
                    'Pricebook2Id': campaign.DefaultPricebook2__c
                }, PRICEBOOKENTRY_FIELDS)
                .execute((err, result) => {
                    if (err) return observer.error(err);
                    observer.next(result);
                    observer.complete();
                });
        });
    });
const products = productsObservable.last().cache(1);
products.subscribe(result => console.log('[LOG] Products updated.'),
                   err => console.error('[ERROR] while caching products:\n', err));

const sponsors = Observable.forkJoin(login, production)
    .mergeMap(getSponsors)
    .toArray()
    .last().cache(1);




// Start up the app
export const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname + '/dist'));

let appData = new AppData();
const mockData = appData.createDb();
app.get('/api/v1/current/productions', (req, res) => {
    production.subscribe((result) => res.json(result));
});

app.get('/api/v1/current/productions/tickets', (req, res) => {
    products.subscribe((result) => res.json(result));
});

app.get('/api/v1/current/productions/sponsors', (req, res) => {
    sponsors.subscribe(sponsors => res.json(sponsors));
});

app.get('/api/v1/recordTypes', (req, res) => {
    res.json(mockData['record-types']);
});

const request = require('request');
app.post('/api/v1/reservations', (req, res) => {
  let reservation: Reservation = req.body;


  RxHttpRequest.post(SETTINGS.salesforce.endpoints.reservation, {
    method: 'POST',
    json: true,
    body: reservation
  })
    .subscribe(data => {
      if (data.response.statusCode != 201) {
        res.status(data.response.statusCode).json({
          error: data.body
        });
      } else {
        production.subscribe((campaign: any) => {
          postToTeam(SETTINGS, reservation, campaign)
            .subscribe(x => console.log('[LOG] Sent out that there\'s a new reservation to the team!'));
          console.log('[LOG] Updating cached available seats');
          let thisCampaign = campaign.ChildCampaigns.records
            .filter((campaign: Campaign) => campaign.Id == reservation.CampaignId)[0];
          thisCampaign.NumberOfProducts__c += reservation.Tickets.reduce(
            (acc, t) => acc + t.amount, 0);
          productionSubject.next(campaign);
        });

        console.log('[NICE] All done processing the reservation\n\n');

        res.status(201).json({
          status: 'Created'
        });
      }
    });
});

app.listen(PORT, _ => {
    console.log('\n[NICE] App listening in port ' + PORT + '!');
});
