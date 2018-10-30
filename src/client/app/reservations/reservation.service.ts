import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, pipe } from 'rxjs';
import { map, share, tap } from 'rxjs/operators';

import { LogService } from '../log.service';
import { LoadingService } from '../loading.service';

import { Reservation, ISubmitReservationResponse } from '../../../models/reservation';
import { Opportunity } from '../../../models/opportunity';
import { Contact } from '../../../models/contact';
import { Campaign } from '../../../models/campaign';

export interface ReservationLookupResult {
  opportunity: Opportunity;
  campaign: Campaign;
  contact: Contact;
}

export interface PaymentMethod {
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

  constructor(private http: HttpClient,
              private logService: LogService,
              private loader: LoadingService) { }

  put(reservation: Reservation): Observable<any> {
    const req$ = this.http
      .post(this.submitReservationUrl, reservation).pipe(
        map((response: ISubmitReservationResponse) => response.data),
        share());

    this.loader.register(req$, 'Saving Reservation');
    return req$;
  }

  get(id: string): Observable<ReservationLookupResult> {
    const req$ = this.http
      .get(`${this.getReservationUrl}/${id}`).pipe(
        map((response: ReservationLookupResult) => response),
        share());

    this.loader.register(req$, 'Getting Reservation');
    return req$;
  }

  pay(id: string): void {
    window.location.href = `${this.getReservationUrl}/${id}/pay`;
  }

  methods(): Observable<PaymentMethod[]> {
    const req$ = this.http
      .get(`${this.getMethodsUrl}`).pipe(
        map((response: ArrayLike<PaymentMethod>) => Array.from(response)),
        share());
    // TODO Error handling - this is not an array if there's an error

    this.loader.register(req$, 'Getting payment methods');
    return req$;
  }

  trackPurchase(tagService, reservation) {
    if (reservation.opportunity.StageName !== 'Closed Won') {
      return;
    }

    // Send to GTM
    tagService.push({
      'event': 'purchase',
      'ecommerce': {
        'currencyCode': 'EUR',
        'purchase': {
          'actionField': {
            'id': reservation.opportunity ? reservation.opportunity.Id : 'UNKNOWN_OPPORTUNITY',
            'revenue': reservation.opportunity.Amount,
            'shipping': 0,
            'tax': 0
          }
        }
      }
    });
  }

}
