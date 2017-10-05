import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/switchMap';

import { Opportunity } from './models/opportunity';
import { Campaign } from './models/campaign';
import { Contact } from './models/contact';
import { ReservationService } from './reservation.service';

type PaymentStatusCode = 'unknown' | 'pending' | 'failed' | 'paid';

@Component({
  templateUrl: './order-status.component.html',
  styleUrls: ['./order-status.component.scss'],
})
export class OrderStatusComponent implements OnInit {

  reservation$: Observable<{
    opportunity: Opportunity,
    campaign: Campaign,
    contact: Contact,
  }>;
  paymentStatus$: Observable<{
    message: string,
    code: PaymentStatusCode,
  }>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: ReservationService,
  ) {}

  ngOnInit () {
    this.reservation$ = this.route.paramMap
      .switchMap(
        (params: ParamMap) => this.service.get(params.get('id')));

    this.paymentStatus$ = this.reservation$
      .map(reservation => {
        let message = 'Onbekend';
        let code: PaymentStatusCode = 'unknown';
        let icon = 'warning';

        switch (reservation.opportunity.StageName) {
        case 'Closed Won':
          message = 'Ontvangen. Alles in orde!';
          code = 'paid';
          icon = 'check_circle';
          break;
        case 'Closed Lost':
          message = 'Geannuleerd. Klik hier om te betalen.';
          code = 'failed';
          icon = 'error';
          break;
        case 'Invited':
        case 'Registered':
        default:
          message = 'Nog niet ontvangen. Klik hier om nu te betalen.';
          code = 'pending';
          icon = 'cached';
        }

        return { message, code, icon };
      });
  }

  processPayment (statusCode: PaymentStatusCode, reservationId: string) {
    if (statusCode !== 'paid') {
      this.service.pay(reservationId);
    }
  }

  directionsUrl (query: string) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
  }

}
