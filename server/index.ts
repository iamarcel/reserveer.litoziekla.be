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

import { AppData } from '../src/app/app-data';
import { Account } from '../src/app/reservations/models/account';
import { Contact } from '../src/app/reservations/models/contact';
import { Campaign } from '../src/app/reservations/models/campaign';
import { PricebookEntry } from '../src/app/reservations/models/pricebook-entry';
import { Reservation } from '../src/app/reservations/models/reservation';

import { resolveContact } from './resolve-contact';
import { addOpportunityItems } from './add-opportunity-items';




const PORT = 3000;





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
    let r = Observable.of(reservation);
    const contact = Observable
        .forkJoin(login, r)
        .mergeMap(resolveContact)
        .last().cache(1);
    contact.subscribe(x => console.log('[LOG] Contact updated.'));

    const opportunity = Observable.forkJoin(
        contact, production, products).last()
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
        }).last().cache(1);
    opportunity.subscribe(x => console.log('[LOG] Opportunity created.'));

    let opportunityCompleted = Observable.combineLatest(login, opportunity, contact, r)
        .mergeMap(addOpportunityItems)
        .last().cache(1);
    opportunityCompleted.subscribe(x => console.log('[LOG] Added contact role & line items to opportunity.'));

    const tickets = reservation.Tickets
        .filter(ticket => ticket.amount > 0);

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
    campaignUpdated.subscribe(x => console.log('[LOG] Campaign updated.'));

    // When we're done, send a 201
    Observable.combineLatest(
        opportunityCompleted,
        campaignUpdated)
        .subscribe((result: [any, any]) => {
            // Update cached production
            production
                .subscribe((campaign: any) => {
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
        }, (err) => {
            console.error('[ERROR] while processing reservation:');
            console.error(err);
            res.sendStatus(500);
        });
});

app.listen(PORT, _ => {
    console.log('\n[NICE] App listening in port ' + PORT + '!');
});
