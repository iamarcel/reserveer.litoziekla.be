/// <reference path="../typings/index.d.ts" />

import 'core-js';
import * as express from 'express';
import * as bodyParser from 'body-parser';
// const JSForce = require('jsforce');
import * as JSForce from 'jsforce';
const SETTINGS = require('./settings.json');

import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/observable/bindNodeCallback';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/from';
import 'rxjs/add/operator/last';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/reduce';
import 'rxjs/add/operator/cache';

import { AppData } from '../src/app/app-data';
import { Account } from '../src/app/reservations/models/account';
import { Contact } from '../src/app/reservations/models/contact';
import { Campaign } from '../src/app/reservations/models/campaign';
import { PricebookEntry } from '../src/app/reservations/models/pricebook-entry';
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
const productionSubject = new Subject();
const production = productionSubject.cache(1);
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
        .execute((err, records: Campaign[]) => {
            if (err) {
                productionSubject.error(err);
            }

            let campaign = records[0];
            for (let childCampaign of campaign.ChildCampaigns) {
                let heroContent = childCampaign.Hero_Image__c;
                childCampaign.Hero_Image__c =
                    heroContent.replace(/--c\..+\.content\.force\.com/,'.secure.force.com/test');
            }

            productionSubject.next(records[0]);
        });
});
production.subscribe(result => console.log('[LOG] Cached current production.'),
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
                    return observer.next(result);
                });
        });
    });
const products = productsObservable.cache(1);

products.subscribe(result => console.log('[LOG] Cached products.'),
                          err => console.error('[ERROR] while caching products:\n', err));




// Start up the app
export const app = express();
app.use(bodyParser.json());

let appData = new AppData();
const mockData = appData.createDb();
app.get('/api/v1/current/productions', (req, res) => {
    production.subscribe((result) => res.json(result));
});

app.get('/api/v1/current/productions/tickets', (req, res) => {
    products.subscribe((result) => res.json(result));
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
        .cache(1)
        .mergeMap((contacts: any, index) => {
            if (contacts.length === 1) {
                console.log('[LOG] Found existing contact');
                return Observable.of(contacts[0]);
            }

            console.log('[LOG] Creating new Account & Contact');
            return Observable.fromPromise(
                (connection as any)
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

    const opportunity = Observable.combineLatest(
        foundContact,
        production,
        products)
        .mergeMap((data: [Contact, Campaign, PricebookEntry[]]) => {
            console.log('[LOG] Creating new Opportunity');
            return Observable.fromPromise(
                (connection as any)
                    .sobject('Opportunity')
                    .create({
                        CampaignId: reservation.CampaignId,
                        AccountId: data[0].AccountId,
                        Pricebook2Id: data[2][0].Pricebook2Id,
                        Name: 'Reservatie ' + data[1].Name + ' - '
                            + data[0].FirstName + ' ' + data[0].LastName,
                        CloseDate: (new Date()).toJSON(),
                        StageName: 'Registered',
                        RecordTypeId: '012240000002dru' // Simple Sale
                        // TODO Fetch record type instead of hard-coding
                    }));
        });

    const tickets = reservation.Tickets
        .filter(ticket => ticket.amount > 0);

    const lineItems = Observable.forkJoin(
        opportunity.cache(1).map((result: any) => tickets.map(
            ticket => Observable.fromPromise(
                (connection as any)
                    .sobject('OpportunityLineItem')
                    .create({
                        OpportunityId: result.id,
                        PricebookEntryId: ticket.ticketType.Id,
                        Quantity: ticket.amount,
                        UnitPrice: ticket.ticketType.UnitPrice
                    })))));
    lineItems.subscribe(x => console.dir(x), e => console.error('lineitems', e));

    const campaignUpdated = production
        .flatMap((production: any) => production.ChildCampaigns.records)
        .filter((campaign: Campaign) => campaign.Id == reservation.CampaignId)
        .mergeMap((campaign: Campaign) => Observable.fromPromise(
            (connection as any)
                .sobject('Campaign')
                .update({
                    Id: reservation.CampaignId,
                    NumberOfProducts__c: campaign.NumberOfProducts__c +
                        tickets.reduce((sum, t) => sum + t.amount, 0)
                })));
    campaignUpdated.subscribe(x => console.dir(x), e => console.error('campaignupdated', e));

    // Update cached production
    production
        .last()
        .subscribe((campaign: any) => {
            console.log('Updating cached value...');
            let thisCampaign = campaign.ChildCampaigns.records
                .filter((campaign: Campaign) => campaign.Id == reservation.CampaignId)[0];
            thisCampaign.NumberOfProducts__c += reservation.Tickets.reduce(
                (acc, t) => acc + t.amount, 0);
            console.dir(campaign);
            productionSubject.next(campaign);
        });

    // When we're done, send a 201
    Observable.combineLatest(
        lineItems,
        campaignUpdated)
        .subscribe((result: [any, any]) => {
            console.log('[LOG] All done processing the reservation');
        }, (err) => {
            console.error('[ERROR] while processing reservation:');
            console.error(err);
            res.sendStatus(500);
        }, () => {
            res.status(201).json({});
        });

});

app.listen(PORT, _ => {
    console.log('\n[NICE] App listening in port ' + PORT + '!');
});
