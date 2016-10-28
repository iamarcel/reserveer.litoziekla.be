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
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/last';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';

import { AppData } from '../src/app/app-data';
import { Account } from '../src/app/reservations/models/account';
import { Contact } from '../src/app/reservations/models/contact';
import { Campaign } from '../src/app/reservations/models/campaign';
import { Reservation } from '../src/app/reservations/reservation.service';




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
                    return observer.error(err);
                }
                observer.next(records[0]);
                observer.complete();
            });
    });
})
    .map((campaign: Campaign) => {
        let heroContent = campaign.Hero_Image__c;
        campaign.Hero_Image__c = heroContent.replace(/--c\..+\.content\.force\.com/,'.secure.force.com/test');

        return campaign;
    });
productions.subscribe(result => console.log('[LOG] Cached current production.'),
                      err => console.error('[ERROR] while caching production:\n', err));

const PRICEBOOKENTRY_FIELDS = 'Id,Name,Pricebook2Id,Product2Id,'
    + 'UnitPrice,UseStandardPrice,'
    + 'Product2.Id,Product2.Description,Product2.Name';
const products = Observable.create((observer: Observer<any>) => {
    Observable
        .forkJoin(login, productions)
        .subscribe((results: any) => {
            console.log('[LOG] Caching products...');

            let campaign: Campaign = results[1];
            (connection as any).sobject('PricebookEntry')
                .find({
                    'Pricebook2Id': campaign.DefaultPricebook2__c
                }, PRICEBOOKENTRY_FIELDS)
                .execute((err, records) => {
                    if (err) {
                        return observer.error(err);
                    }
                    observer.next(records);
                    observer.complete();
                });
        });
})
products.subscribe(result => console.log('[LOG] Cached products.'),
                   err => console.error('[ERROR] while caching products:\n', err));




// Start up the app
export const app = express();
app.use(bodyParser.json());

let appData = new AppData();
const mockData = appData.createDb();
app.get('/api/v1/current/productions', (req, res) => {
    productions.last().subscribe((result) => res.json(result));
});

app.get('/api/v1/current/productions/tickets', (req, res) => {
    products.last().subscribe((result) => res.json(result));
});

app.get('/api/v1/recordTypes', (req, res) => {
    res.json(mockData['record-types']);
});

app.post('/api/v1/reservations', (req, res) => {
    let reservation: Reservation = req.body;

    // Try to find a contact first
    const foundContact = Observable.create((observer: Observer<Contact[]>) => {
        (connection as any)
            .sobject('Contact')
            .find({
                Email: reservation.Email
            })
            .limit(1)
            .execute((err, results) => {
                if (err) return observer.error(err);
                observer.next(results);
                observer.complete();
            })
    })
        .last()
        .switchMap((contacts: any, index) => {
            console.dir(contacts);
            if (contacts.length === 1) {
                return Observable.of(contacts[0]);
            }

            return Observable.fromPromise((connection as any)
                                          .sobject('Account')
                                          .create({
                                              Name: reservation.LastName,
                                              Description: 'Aangemaakt tijdens een reservatie, door Libo.'
                                          })
                                          .catch(err => {
                                              console.error('[ERROR] When making account');
                                              console.dir(err);
                                          })
                                              .then((result) => {
                                                  console.log('[LOG] Created new account for new contact.');
                                                  return (connection as any)
                                                      .sobject('Contact')
                                                      .create({
                                                          AccountId: result.id,
                                                          FirstName: reservation.FirstName || '',
                                                          LastName: reservation.LastName,
                                                          Email: reservation.Email,
                                                          Phone: reservation.Phone || ''
                                                      });
                                              }));
        });

    foundContact.subscribe(contact => {
        console.log('[NICE] Resolved contact.');
        console.dir(contact);
    });
});

app.listen(PORT, _ => {
    console.log('\n[NICE] App listening in port ' + PORT + '!');
});
