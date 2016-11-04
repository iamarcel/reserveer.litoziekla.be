/// <reference path="../typings/index.d.ts" />
"use strict";
var Observable_1 = require('rxjs/Observable');
require('rxjs/add/observable/bindNodeCallback');
require('rxjs/add/operator/mergeMap');
var request = Observable_1.Observable.bindNodeCallback(require('request'));
exports.postToTeam = function (settings, reservation, production) {
    var nTickets = reservation.Tickets.reduce(function (sum, t) { return sum + t.amount; }, 0);
    return production.mergeMap(function (production) {
        return request({
            url: settings.team.zosw.hookUrl,
            method: 'POST',
            json: {
                summary: 'Nieuwe reservatie voor ' + nTickets + ' tickets.',
                title: 'Joepie, nieuwe reservatie!',
                sections: [
                    {
                        activityTitle: 'Op naam van ' + reservation.FirstName + ' ' + reservation.LastName,
                        activitySubtitle: production.Name,
                        activityText: '' + nTickets + ' nieuwe plaatsen'
                    }
                ]
            }
        });
    });
};
