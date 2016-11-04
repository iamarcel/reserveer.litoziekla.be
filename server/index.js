/// <reference path="../typings/index.d.ts" />
"use strict";
require('core-js');
var express = require('express');
var bodyParser = require('body-parser');
var JSForce = require('jsforce');
var ApplicationInsights = require('applicationinsights');
var SETTINGS = require('./settings.json');
var Observable_1 = require('rxjs/Observable');
var Subject_1 = require('rxjs/Subject');
require('rxjs/add/observable/bindNodeCallback');
require('rxjs/add/observable/forkJoin');
require('rxjs/add/observable/fromPromise');
require('rxjs/add/observable/combineLatest');
require('rxjs/add/observable/of');
require('rxjs/add/observable/from');
require('rxjs/add/operator/last');
require('rxjs/add/operator/map');
require('rxjs/add/operator/mergeMap');
require('rxjs/add/operator/switchMap');
require('rxjs/add/operator/filter');
require('rxjs/add/operator/reduce');
require('rxjs/add/operator/cache');
require('rxjs/add/operator/do');
require('rxjs/add/operator/toArray');
var RxHttpRequest = require('rx-http-request').RxHttpRequest;
var app_data_1 = require('../src/app/app-data');
var get_sponsors_1 = require('./get-sponsors');
var post_to_team_1 = require('./post-to-team');
var PORT = process.env.PORT || 3000;
// Set up app insights
ApplicationInsights.setup('4a53ccb5-c5c0-4921-a764-de3bf06f910e').start();
// Set up a Salesforce connection
console.log('[LOG] Logging in to Salesforce...');
var connection = new JSForce.Connection({
    loginUrl: SETTINGS['salesforce']['url']
});
var login = Observable_1.Observable.fromPromise(connection.login(SETTINGS['salesforce']['auth']['user'], SETTINGS['salesforce']['auth']['pass']))
    .map(function (x) { return connection; }).last().cache(1);
login.subscribe(function (result) { return console.log('[LOG] Logged in to Salesforce.'); }, function (err) { return console.error('[ERROR] while logging in to Salesforce:\n', err); });
// Fetch & store information we'll be using
var CAMPAIGN_FIELDS = 'Id,Name,Maximum_Opportunities__c,MaximumProducts__c,Hero_Image__c,'
    + 'StartDate,EndDate,NumberOfOpportunities,NumberOfProducts__c,'
    + 'Location__c,RecordTypeId,RecordType.Name,RecordType.DeveloperName,'
    + 'DefaultPricebook2__c,Entrance__c';
var productionSubject = new Subject_1.Subject();
var production = productionSubject.last().cache(1);
login.last().subscribe(function (_) {
    console.log('[LOG] Caching current production...');
    connection.sobject('Campaign')
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
        .execute(function (err, records) {
        console.log('[LOG] Received answer about current production.');
        if (err) {
            return productionSubject.error(err);
        }
        var campaign = records[0];
        var html = campaign.Hero_Image__c;
        campaign.Hero_Image__c =
            html.replace(/--c\..+\.content\.force\.com/, '.secure.force.com/test');
        console.log('[LOG] Parsed current production\n');
        productionSubject.next(records[0]);
        productionSubject.complete();
    });
});
production.subscribe(function (result) { return console.log('[LOG] Production updated.'); }, function (err) { return console.error('[ERROR] while caching production:\n', err); });
var PRICEBOOKENTRY_FIELDS = 'Id,Name,Pricebook2Id,Product2Id,'
    + 'UnitPrice,UseStandardPrice,'
    + 'Product2.Id,Product2.Description,Product2.Name';
var productsObservable = production
    .mergeMap(function (campaign) {
    console.log('[LOG] Caching products...');
    return Observable_1.Observable.create(function (observer) {
        connection.sobject('PricebookEntry')
            .find({
            'Pricebook2Id': campaign.DefaultPricebook2__c
        }, PRICEBOOKENTRY_FIELDS)
            .execute(function (err, result) {
            if (err)
                return observer.error(err);
            observer.next(result);
            observer.complete();
        });
    });
});
var products = productsObservable.last().cache(1);
products.subscribe(function (result) { return console.log('[LOG] Products updated.'); }, function (err) { return console.error('[ERROR] while caching products:\n', err); });
var sponsors = Observable_1.Observable.forkJoin(login, production)
    .mergeMap(get_sponsors_1.getSponsors)
    .toArray()
    .last().cache(1);
// Start up the app
exports.app = express();
exports.app.use(bodyParser.json());
exports.app.use(express.static(__dirname + '/dist'));
var appData = new app_data_1.AppData();
var mockData = appData.createDb();
exports.app.get('/api/v1/current/productions', function (req, res) {
    production.subscribe(function (result) { return res.json(result); });
});
exports.app.get('/api/v1/current/productions/tickets', function (req, res) {
    products.subscribe(function (result) { return res.json(result); });
});
exports.app.get('/api/v1/current/productions/sponsors', function (req, res) {
    sponsors.subscribe(function (sponsors) { return res.json(sponsors); });
});
exports.app.get('/api/v1/recordTypes', function (req, res) {
    res.json(mockData['record-types']);
});
var request = require('request');
exports.app.post('/api/v1/reservations', function (req, res) {
    var reservation = req.body;
    post_to_team_1.postToTeam(SETTINGS, reservation, production)
        .subscribe(function (x) { return console.log('[LOG] Sent out that there\'s a new reservation to the team!'); });
    RxHttpRequest.post(SETTINGS.salesforce.endpoints.reservation, {
        method: 'POST',
        json: true,
        body: reservation
    })
        .subscribe(function (data) {
        if (data.response.statusCode != 201) {
            res.status(data.response.statusCode).json({
                error: data.body
            });
        }
        else {
            production.subscribe(function (campaign) {
                console.log('[LOG] Updating cached available seats');
                var thisCampaign = campaign.ChildCampaigns.records
                    .filter(function (campaign) { return campaign.Id == reservation.CampaignId; })[0];
                thisCampaign.NumberOfProducts__c += reservation.Tickets.reduce(function (acc, t) { return acc + t.amount; }, 0);
                productionSubject.next(campaign);
            });
            console.log('[NICE] All done processing the reservation\n\n');
            res.status(201).json({
                status: 'Created'
            });
        }
    });
});
exports.app.listen(PORT, function (_) {
    console.log('\n[NICE] App listening in port ' + PORT + '!');
});
