/// <reference path="../typings/index.d.ts" />
"use strict";
var Observable_1 = require('rxjs/Observable');
require('rxjs/add/observable/fromPromise');
require('rxjs/add/observable/concat');
require('rxjs/add/observable/forkJoin');
require('rxjs/add/operator/isEmpty');
require('rxjs/add/operator/first');
exports.addOpportunityItems = function (data) {
    var connection = data[0];
    var opportunityResult = data[1];
    var contact = data[2];
    var reservation = data[3];
    console.log('[LOG] Adding Opportunity items...');
    return Observable_1.Observable.forkJoin(addLineItems(connection, opportunityResult, reservation.Tickets), addContactRole(connection, opportunityResult, contact));
};
var addLineItems = function (connection, opportunityResult, tickets) {
    console.log('[LOG] Adding line items to opportunity...');
    return Observable_1.Observable.forkJoin(tickets
        .filter(function (t) { return t.amount > 0; })
        .map(function (ticket) { return Observable_1.Observable.fromPromise(connection
        .sobject('OpportunityLineItem')
        .create({
        OpportunityId: opportunityResult.id,
        PricebookEntryId: ticket.ticketType.Id,
        Quantity: ticket.amount,
        UnitPrice: ticket.ticketType.UnitPrice
    })); }));
};
var addContactRole = function (connection, opportunityResult, contact) {
    console.log('[LOG] Adding contact role to opportunity...');
    return Observable_1.Observable.fromPromise(connection
        .sobject('OpportunityContactRole')
        .create({
        OpportunityId: opportunityResult.id,
        ContactId: contact.Id,
        IsPrimary: true,
        Role: 'Buyer'
    }));
};
