import { Component, ViewContainerRef } from '@angular/core';
import { MdSnackBar, MdSnackBarConfig } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';

import { Campaign } from './models/campaign';
import { Opportunity } from './models/opportunity';
import { Account } from './models/account';
import { Contact } from './models/contact';
import { Product2 } from './models/product2';
import { OpportunityLineItem } from './models/opportunity-line-item';
import { Reservation, Ticket } from './models/reservation';

import { CampaignService } from './campaign.service';
import { ReservationService } from './reservation.service';
import { TagService } from '../tag.service';

@Component({
  selector: 'app-reservations',
  templateUrl: './reservations.component.html'
})
export class ReservationsComponent {

  private production: Campaign;
  private show: Campaign;
  private reservation: Reservation = new Reservation();
  private sponsors: Opportunity[];

  private loading: number = 0;
  private submitting: boolean = false;
  private submitted: boolean = false;

  private formErrors = [];

  constructor(private campaignService: CampaignService,
              private reservationService: ReservationService,
              private tagService: TagService,
              public snackBar: MdSnackBar,
              public viewContainerRef: ViewContainerRef) {

    this.loading++;
    campaignService.getCurrentProduction()
      .subscribe(production => {
        console.log('Got the production', production);
        this.production = production;
        this.loading--;
      }, err => this.displayError(err));

    this.loading++;
    campaignService.getTicketTypes()
      .map((tts: Product2[]) =>
           tts.map(t => new Ticket({ticketType: t}))
          )
      .subscribe(tickets => {
        console.log('Got ticket types', tickets);
        this.reservation.Tickets = tickets;
        this.loading--;
      }, err => this.displayError(err));

    this.loading++;
    campaignService.getSponsors()
      .subscribe(sponsors => {
        this.sponsors = sponsors;
        this.loading--;
      }, this.displayError);

    // Send sponsor impressions to GTM
    campaignService.getSponsors()
      .subscribe(sponsors => {
        this.tagService.push({
          'ecommerce': {
            'currencyCode': 'EUR',
            'impressions': sponsors.map(s => ({
              'name': s.Name,
              'id': s.Id,
              'category': 'sponsor'
            }))
          }
        });
      });
  }

  displayError(err: any) {
    let config = new MdSnackBarConfig(this.viewContainerRef);
    this.snackBar.open('Woeps, er is iets foutgelopen! ' + err, null, config);
  }

  showIsFull(show: Campaign) {
    return show.NumberOfProducts__c >= show.MaximumProducts__c;
  }

  setShow(show: Campaign) {
    if (this.showIsFull(show)) {
      return;
    }

    this.show = show;
    this.reservation.CampaignId = show.Id;

    // Send impressions to GTM
    Observable.combineLatest(
      this.campaignService.getTicketTypes(),
      this.campaignService.getCurrentProduction(),
      this.campaignService.getSponsors())
      .subscribe(data => {
        let tickets = data[0];
        let production = data[1];
        let sponsors = data[2];

        this.tagService.push({
          'ecommerce': {
            'currencyCode': 'EUR',
            'impressions': this._ticketsForGTM(this.reservation.Tickets)
          }
        });
      });
  }

  addTicket(ticket: Ticket) {
    ticket.amount++;

    // Send to GTM
    this.tagService.push({
      'ecommerce': {
        'currencyCode': 'EUR',
        'add': {
          'products': [{
            'name': ticket.ticketType.Name,
            'id': ticket.ticketType.Id,
            'category': this.show.Name,
            'price': ticket.ticketType.UnitPrice,
            'amount': 1
          }]
        }
      }
    });
  }

  removeTicket(ticket: Ticket) {
    if (ticket.amount <= 0) {
      return;
    }

    ticket.amount--;

    // Send to GTM
    this.tagService.push({
      'ecommerce': {
        'currencyCode': 'EUR',
        'remove': {
          'products': [{
            'name': ticket.ticketType.Name,
            'id': ticket.ticketType.Id,
            'category': this.show.Name,
            'price': ticket.ticketType.UnitPrice,
            'amount': 1
          }]
        }
      }
    });
  }

  submit(form) {
    console.log('submitted form', form.value);

    this.reservation.Email = form.value['email'];
    this.reservation.FirstName = form.value['first-name'] || '';
    this.reservation.LastName = form.value['last-name'];
    this.reservation.Phone = form.value['phone'] || '';

    this.formErrors = [];
    if (this.reservation.Tickets.reduce((sum, t) => sum += t.amount, 0) <= 0) {
      this.formErrors.push({
        message: 'Je moet minstens 1 ticket kiezen.'
      });
    }

    if (this.formErrors.length > 0) {
      return;
    }

    this.loading++;
    this.submitting = true;
    this.reservationService.put(this.reservation)
      .subscribe((result: any) => {
        this.submitted = true;
        this.submitting = false;
        this.loading--;

        console.log(result);

        this.reservation = new Reservation();
      });

    // Send to GTM
    this.tagService.push({
      'event': 'purchase',
      'ecommerce': {
        'purchase': {
          'products': this._ticketsForGTM(this.reservation.Tickets)
        }
      }
    })
  }

  private _ticketsForGTM(tickets: Ticket[]) {
    return tickets.map(t => ({
      'name': t.ticketType.Name,
      'id': t.ticketType.Id,
      'category': this.show.Name,
      'price': t.ticketType.UnitPrice,
      'quantity': t.amount
    }));
  }

}
