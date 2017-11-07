import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Observable } from 'rxjs/Observable';

import { LogService } from '../log.service';
import { LoadingService } from '../loading.service';

import { Reservation } from '../../../models/reservation';
import { Opportunity } from '../../../models/opportunity';
import { Contact } from '../../../models/contact';
import { Campaign } from '../../../models/campaign';

export interface Method {
  resource: 'method';
  id: string;
  description: string;
  amount: {
    minimum: number;
    maximum: number;
  }
  image: {
    normal: string; // 55x37
    bigger: string; // 110x74
  }
}

@Injectable()
export class ReservationService {

  private submitReservationUrl = 'api/v1/reservations';
  private getReservationUrl = 'api/v1/reservation';
  private getMethodsUrl = 'api/v1/methods';

  constructor(private http: Http,
              private logService: LogService,
              private loader: LoadingService) { }

  put(reservation: Reservation): Observable<any> {
    const req$ = this.http
      .post(this.submitReservationUrl, reservation)
      .map(response => response.json().data);

    this.loader.register(req$, 'Saving Reservation');
    return req$;
  }

  get(id: string): Observable<{
    opportunity: Opportunity,
    campaign: Campaign,
    contact: Contact,
  }> {
    const req$ = this.http
      .get(`${this.getReservationUrl}/${id}`)
      .map(response => response.json());
    this.loader.register(req$, 'Getting Reservation');
    return req$;
  }

  pay(id: string): void {
    window.location.href = `${this.getReservationUrl}/${id}/pay`;
  }

  methods(): Observable<Method[]> {
    const req$ = this.http
      .get(`${this.getMethodsUrl}`)
      .map(response => Array.from(response.json()));
    // TODO Error handling - this is not an array if there's an error

    this.loader.register(req$, 'Getting payment methods');
    return req$;
  }

}
