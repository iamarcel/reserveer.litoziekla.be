import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Observable } from 'rxjs/Observable';

import { LogService } from '../log.service';

import { Reservation } from './models/reservation';
import { Opportunity } from './models/opportunity';
import { Contact } from './models/contact';
import { Campaign } from './models/campaign';

@Injectable()
export class ReservationService {

  private submitReservationUrl = 'api/v1/reservations';
  private getReservationUrl = 'api/v1/reservation';

  constructor(private http: Http,
              private logService: LogService) { }

  put(reservation: Reservation): Observable<any> {
    return this.http
      .post(this.submitReservationUrl, reservation)
      .map(response => response.json().data);
  }

  get(id: string): Observable<{
    opportunity: Opportunity,
    campaign: Campaign,
    contact: Contact,
  }> {
    return this.http
      .get(`${this.getReservationUrl}/${id}`)
      .map(response => response.json());
  }

  pay(id: string): void {
    window.location.href = `${this.getReservationUrl}/${id}/pay`;
  }

}
