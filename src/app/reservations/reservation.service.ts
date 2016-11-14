import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Observable } from 'rxjs/Observable';

import { LogService } from '../log.service';

import { Reservation } from './models/reservation';

@Injectable()
export class ReservationService {

  private submitReservationUrl = 'api/v1/reservations';

  constructor(private http: Http,
              private logService: LogService) { }

  put(reservation: Reservation): Observable<any> {
    return this.http
      .post(this.submitReservationUrl, reservation)
      .map(response => response.json().data);
  }

}
