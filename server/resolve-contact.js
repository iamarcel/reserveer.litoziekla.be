/// <reference path="../typings/index.d.ts" />
"use strict";
var Observable_1 = require('rxjs/Observable');
require('rxjs/add/observable/fromPromise');
require('rxjs/add/observable/concat');
require('rxjs/add/operator/isEmpty');
require('rxjs/add/operator/first');
require('rxjs/add/operator/mergeMap');
exports.resolveContact = function (data) {
    console.log('[LOG] Resolving contact...');
    return Observable_1.Observable.concat(findContact(data[0], data[1]), createContact(data[0], data[1]))
        .first();
};
var findContact = function (connection, reservation) {
    return Observable_1.Observable.create(function (observer) { return connection
        .sobject('Contact')
        .find({
        Email: reservation.Email
    })
        .limit(1)
        .on('record', function (r) {
        observer.next(r);
    })
        .on('end', function () {
        observer.complete();
    })
        .on('error', function (err) {
        observer.error(err);
    }); });
};
var createContact = function (connection, reservation) { return Observable_1.Observable.fromPromise(connection
    .sobject('Account')
    .create({
    Name: reservation.LastName,
    Description: 'Aangemaakt tijdens een reservatie, door Libo.'
})
    .then(function (result) { return connection
    .sobject('Contact')
    .create({
    AccountId: result.id,
    FirstName: reservation.FirstName || '',
    LastName: reservation.LastName,
    Email: reservation.Email,
    Phone: reservation.Phone || ''
}); }))
    .mergeMap(function (result) { return findContact(connection, reservation); }); };
