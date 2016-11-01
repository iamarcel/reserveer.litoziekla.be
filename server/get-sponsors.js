/// <reference path="../typings/index.d.ts" />
"use strict";
var Observable_1 = require('rxjs/Observable');
require('rxjs/add/observable/fromPromise');
exports.getSponsors = function (data) {
    var connection = data[0];
    var campaign = data[1];
    console.log('[LOG] Getting sponsors...');
    return Observable_1.Observable.create(function (observer) { return connection
        .sobject('Opportunity')
        .find({
        CampaignId: campaign.Id,
        'RecordType.DeveloperName': 'Partnership'
    })
        .on('record', function (r) {
        observer.next(r);
    })
        .on('end', function () {
        observer.complete();
    })
        .on('error', function (err) {
        observer.error(err);
    }); })
        .filter(function (o) { return o.Logo__c; })
        .map(function (o) {
        o.Logo__c = o.Logo__c.replace(/--c\..+\.content\.force\.com/, '.secure.force.com/test');
        return o;
    });
};
