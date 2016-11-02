/// <reference path="../typings/index.d.ts" />

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/bindNodeCallback';

import { Reservation } from '../src/app/reservations/models/reservation';
import { Campaign } from '../src/app/reservations/models/campaign';

let request = Observable.bindNodeCallback<{}, any>(require('request'));

export const postToTeam = (settings: any, reservation: Reservation, production: Campaign): Observable<any> => {
  return request({
    url: settings.team.zosw.hookUrl,
    method: 'POST',
    json: {
      title: "Joepie, " + reservation.FirstName + " " + reservation.LastName + " heeft gereserveerd voor"
        + production.Name + "!",
      text: "Dat zijn dan " + reservation.Tickets.reduce((sum, t) => sum + t.amount, 0) + "nieuwe tickets."
    }
  });
};
