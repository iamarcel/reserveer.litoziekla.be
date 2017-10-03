import 'core-js';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as JSForce from 'jsforce';
import * as ApplicationInsights from 'applicationinsights';
import * as Mollie from 'mollie-api-node';
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
import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/last';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/reduce';
import 'rxjs/add/operator/publishReplay';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/take';
const RxHttpRequest = require('rx-http-request').RxHttpRequest;

import { AppData } from '../src/app/app-data';
import { Account } from '../src/app/reservations/models/account';
import { Contact } from '../src/app/reservations/models/contact';
import { Campaign } from '../src/app/reservations/models/campaign';
import { PricebookEntry } from '../src/app/reservations/models/pricebook-entry';
import { Reservation } from '../src/app/reservations/models/reservation';

// import { resolveContact } from './resolve-contact';
// import { addOpportunityItems } from './add-opportunity-items';
import { getSponsors } from './get-sponsors';
import { postToTeam } from './post-to-team';
import * as mollie from './mollie';




const PORT = process.env.PORT || 3000;





// Set up app insights
ApplicationInsights.setup('4a53ccb5-c5c0-4921-a764-de3bf06f910e').start();

// Set up a Salesforce connection
const connection = new JSForce.Connection({
  loginUrl: SETTINGS['salesforce']['url']
});

// Log in every hour
const login =
  Observable.interval(1000 * 60 * 60).startWith(0)
  .switchMap(_ => {
    console.log('[LOG] Logging in to Salesforce...');
    return Observable.fromPromise(
      connection.login(SETTINGS['salesforce']['auth']['user'],
                       SETTINGS['salesforce']['auth']['pass']))
  }).map(x => connection).publishReplay(1).refCount() as Observable<JSForce.Connection>;
login.subscribe(result => console.log('[LOG] Logged in to Salesforce.'),
                err => console.error('[ERROR] while logging in to Salesforce:\n', err));

// Fetch & store information we'll be using
const CAMPAIGN_FIELDS = 'Id,Name,Maximum_Opportunities__c,MaximumProducts__c,Hero_Image__c,'
    + 'StartDate,EndDate,NumberOfOpportunities,NumberOfProducts__c,'
    + 'Location__c,RecordTypeId,RecordType.Name,RecordType.DeveloperName,'
    + 'DefaultPricebook2__c,Entrance__c,IsActive';
const productionSubject = new Subject<any>();
const production = productionSubject.publishReplay(1).refCount();

const sponsors = Observable.combineLatest(login, production)
    .mergeMap(getSponsors)
    .publishReplay(1).refCount();

login.subscribe(_ => {
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
                (html || '').replace(/--c\..+\.content\.force\.com/,'.secure.force.com/test');

            console.log('[LOG] Parsed current production\n');
            productionSubject.next(records[0]);
        });
});
production.subscribe(result => console.log('[LOG] Production updated.'),
                     err => console.error('[ERROR] while caching production:\n', err));

const PRICEBOOKENTRY_FIELDS = 'Id,Name,Pricebook2Id,Product2Id,'
    + 'UnitPrice,UseStandardPrice,'
    + 'Product2.Id,Product2.Description,Product2.Name';
const productsObservable = production
    .switchMap((campaign: Campaign) => {
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
const products = productsObservable.publishReplay(1).refCount();
products.subscribe(result => console.log('[LOG] Products updated.'),
                   err => console.error('[ERROR] while caching products:\n', err));




// Start up the app
const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname + '/dist'));

let appData = new AppData();
const mockData = appData.createDb();
app.get('/api/v1/current/productions', (req, res) => {
  production.take(1).subscribe((result) => res.json(result));
});

app.get('/api/v1/current/productions/tickets', (req, res) => {
  products.take(1).subscribe((result) => res.json(result));
});

app.get('/api/v1/current/productions/sponsors', (req, res) => {
  sponsors.take(1).subscribe(sponsors => res.json(sponsors));
});

app.get('/api/v1/recordTypes', (req, res) => {
    res.json(mockData['record-types']);
});

app.get('/api/v1/hook', mollie.checkPayment);

const request = require('request');
app.post('/api/v1/reservations', (req, res) => {
  let reservation: Reservation = req.body;

  // postToTeam(SETTINGS, reservation, production)
  //   .subscribe(x => console.log('[LOG] Sent out that there\'s a new reservation to the team!'));

  RxHttpRequest.post(SETTINGS.salesforce.endpoints.reservation, {
    method: 'POST',
    json: true,
    body: reservation
  })
    .subscribe(data => {
      if (data.response.statusCode != 201) {
        res.status(data.response.statusCode).json({
          error: data.error.message
        });
      } else {
        production.take(1).subscribe((campaign: any) => {
          console.log('[LOG] Updating cached available seats');
          let thisCampaign = campaign.ChildCampaigns.records
            .filter((campaign: Campaign) => campaign.Id == reservation.CampaignId)[0];
          thisCampaign.NumberOfProducts__c += reservation.Tickets.reduce(
            (acc, t) => acc + t.amount, 0);
          productionSubject.next(campaign);
        });

        console.log('[NICE] All done processing the reservation\n\n');

        // Create the payment
        mollie.api.payments.create({
          amount: 999,
          description: 'My first API payment',
          redirectUrl: `http://${SETTINGS.root}/`,
          webhook: `http://${SETTINGS.root}/api/v1/hook`,
        })

        res.status(201).json(data.body);
      }
    });
});

app.listen(PORT, _ => {
    console.log('\n[NICE] App listening in port ' + PORT + '!');
});
