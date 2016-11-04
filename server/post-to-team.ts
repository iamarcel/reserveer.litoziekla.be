/// <reference path="../typings/index.d.ts" />

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/bindNodeCallback';
import 'rxjs/add/operator/mergeMap';

import { Reservation } from '../src/app/reservations/models/reservation';
import { Campaign } from '../src/app/reservations/models/campaign';

let request = Observable.bindNodeCallback<{}, any>(require('request'));

export const postToTeam = (settings: any, reservation: Reservation, production: Observable<Campaign>): Observable<any> => {
  let nTickets = reservation.Tickets.reduce((sum, t) => sum + t.amount, 0);
  return production.mergeMap(production => {
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
