import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

import { combineLatest as observableCombineLatest, Observable } from 'rxjs';
import { switchMap, map, share } from 'rxjs/operators';
import { Angulartics2 } from 'angulartics2';

import { Opportunity } from '../../../models/opportunity';
import { Campaign } from '../../../models/campaign';
import { Contact } from '../../../models/contact';

import { ReservationService, ReservationLookupResult } from './reservation.service';
import { TagService } from '../tag.service';

type PaymentStatusCode = 'unknown' | 'pending' | 'failed' | 'paid';

@Component({
  templateUrl: './order-status.component.html',
  styleUrls: ['./order-status.component.scss'],
})
export class OrderStatusComponent implements OnInit {

  reservation$: Observable<ReservationLookupResult>;
  paymentStatus$: Observable<{
    message: string,
    code: PaymentStatusCode,
  }>;

  shareDescription$: Observable<string>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: ReservationService,
    private tagService: TagService,
    private angulartics: Angulartics2,
  ) {}

  ngOnInit () {
    this.reservation$ = this.route.paramMap.pipe(
      switchMap(
        (params: ParamMap) => this.service.get(params.get('id'))));

    this.paymentStatus$ = this.reservation$.pipe(
      map(reservation => {
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
      }));

    this.reservation$.subscribe(x => {
      if (x.opportunity.StageName !== 'Closed Won') {
        return;
      }

      this.angulartics.eventTrack.next({
        action: 'Purchase',
        properties: {
          'currency': 'EUR',
          'value': x.opportunity.Amount,
          'num_items': x.opportunity.TotalOpportunityQuantity,
          'content_name': x.opportunity.Name,
          'transaction_id': x.opportunity.Id,
        },
      });
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
