/// <reference path="../typings/index.d.ts" />
"use strict";
var Observable_1 = require('rxjs/Observable');
require('rxjs/add/observable/bindNodeCallback');
require('rxjs/add/operator/mergeMap');
var request = Observable_1.Observable.bindNodeCallback(require('request'));
exports.postToTeam = function (settings, reservation, production) {
    return production.mergeMap(function (production) {
        return request({
            url: settings.team.zosw.hookUrl,
            method: 'POST',
            json: {
                title: "Joepie, " + reservation.FirstName + " " + reservation.LastName + " heeft gereserveerd voor"
                    + production.Name + "!",
                text: "Dat zijn dan " + reservation.Tickets.reduce(function (sum, t) { return sum + t.amount; }, 0) + "nieuwe tickets."
            }
        });
    });
};
