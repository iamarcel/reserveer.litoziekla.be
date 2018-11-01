import { Component, ViewContainerRef, ViewChild } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, FormArray,
         AbstractControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';

import {combineLatest as observableCombineLatest,  Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Angulartics2 } from 'angulartics2';

import { Campaign } from '../../../models/campaign';
import { Opportunity } from '../../../models/opportunity';
import { Product2 } from '../../../models/product2';
import { Reservation, Ticket } from '../../../models/reservation';

import { CampaignService } from './campaign.service';
import { ReservationService, PaymentMethod } from './reservation.service';
import { LogService } from '../log.service';
import { TagService } from '../tag.service';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&’*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

const emailValidator = (control: AbstractControl): {[key: string]: any} => {
  const email = control.value;
  return EMAIL_REGEX.test(control.value) ? null : {'email': {email}};
};

const ticketAmountValidator = (tickets: Ticket[]) => {
  return (control: AbstractControl): {[key: string]: any} => {
    if (!tickets) {
      return null;
    }

    const totalAmount = tickets.reduce((sum, t, i) => {
      return sum + control.get([i, 'amount']).value;
    }, 0);
    return (totalAmount > 0) ? null : { 'ticketAmount': {totalAmount} };
  };
};


@Component({
  selector: 'app-reservations',
  templateUrl: './reservations.component.html',
  styleUrls: ['./reservations.component.scss']
})
export class ReservationsComponent {

  form: FormGroup;
  error: string;
  methods$: Observable<PaymentMethod[]>;

  production: Campaign;
  show: Campaign;
  reservation: Reservation = new Reservation();
  sponsors: Opportunity[];

  loading = 0;
  submitting = false;
  submitted = false;

  formErrors: string[] = [];

  schema = {
    "@context": "http://schema.org",
    "@type": "TheaterEvent",
    "name": "",
    // "description": "Sint San gaat over twee broers die in Sint-Jozef Cafasso leven, onder leiding van Moeder Overste. Tijdens de oorlog verloren de broers hun moeder door een bombardement en stierf hun vader aan stoflong, maar ondanks alle tegenslagen gaven ze niet op en gingen ze op zoek naar een nieuwe kracht, het geloof in Sint San. De broers vertellen u hun verhaal: een wirwar van mirakels en sprookjes, van verstoppen en vluchten en ergens onder al die verhalen ligt de echte werkelijkheid... ",
    "location": {
      "@type": "Place",
      "name": "",
      "address": "9700 Oudenaarde",
    },
    "offers": [
    ],
    "inLanguage": "nl-BE",
    "startDate": "",
    "endDate": "",
    // "image": "https://i.imgur.com/3CA40TU.jpg",
    "performer": {
      "logo": "http://reserveer.litoziekla.be/client/assets/logo-white.svg",
      "email": "info@litoziekla.be",
      "sameAs": "http://litoziekla.be",
      "legalName": "Jeugdtheater Litoziekla* vzw",
      "name": "Litoziekla",
      "description": "Jeugdtheater LITOZIEKLA* vzw is een jonge, dynamische theatergroep uit Oudenaarde die op 26 februari 1986 is opgericht. Wat ooit begon als een onschuldig toneeltje in een garage is nu uitgegroeid tot een bekend begrip in Oudenaarde."
    }
  };

  get stepper(): AbstractControl | null {
    return this.form.get('stepper');
  }

  get stepShow(): AbstractControl | null {
    return this.stepper.get('show');
  }

  get stepTickets(): AbstractControl | null {
    return this.stepper.get('tickets');
  }

  get stepContact(): AbstractControl | null {
    return this.stepper.get('contact');
  }

  private validationMessages = {
    'stepper.show.ShowId': {
      'required': 'Je hebt geen voorstelling aangeduid.'
    },
    'stepper.contact.LastName': {
      'required': 'Achternaam is verplicht.'
    },
    'stepper.contact.Email': {
      'required': 'E-mailadres is verplicht.',
      'email': 'E-mailadres moet een geldig adres zijn.'
    },
    'stepper.tickets.Tickets': {
      'ticketAmount': 'Je moet minstens één ticket kiezen.'
    },
    'stepper.contact.Comments': {}
  };


  constructor(private campaignService: CampaignService,
              private reservationService: ReservationService,
              private fb: FormBuilder,
              private tagService: TagService,
              private logSerivce: LogService,
              private snackBar: MatSnackBar,
              private angulartics: Angulartics2,
              public viewContainerRef: ViewContainerRef) {

    this.methods$ = reservationService.methods();

    this.loading++;
    campaignService.getCurrentProduction()
      .subscribe(production => {
        this.production = production;
        this.loading--;

        this.schema = {
          ...this.schema,
          name: production.Name,
          location: {
            "@type": "Place",
            name: production.Location__c,
            address: "Oudenaarde"
          },
          startDate: production.ChildCampaigns[0].StartDate,
          endDate: production.ChildCampaigns[production.ChildCampaigns.length - 1].EndDate
        }
      }, err => this.displayError(err));

    this.loading++;
    campaignService.getTicketTypes().pipe(
      map((tts: Product2[]) =>
           tts.map(t => new Ticket({ticketType: t}))
          ))
      .subscribe(tickets => {
        this.schema = {
          ...this.schema,
          offers: tickets.map(ticket => ({
            "@type": "Offer",
            "price": ticket.ticketType.UnitPrice,
            "priceCurrency": "EUR",
            "url": "https://reserveer.litoziekla.be"
          }))
        }
        this.reservation.Tickets = tickets;
        this.loading--;
        this._buildForm();
      }, err => this.displayError(err));

    this._buildForm();

  }

  _buildForm(): void {
    this.form = this.fb.group({
      stepper: this.fb.group({
        show: this.fb.group({
          'ShowId': ['', [Validators.required]],
        }),
        tickets: this.fb.group({
          'Tickets': this.fb.array((this.reservation.Tickets || []).map(
            t => this.fb.group({
              'amount': [0],
              'ticketType': [t.ticketType, Validators.required]
            })), ticketAmountValidator(this.reservation.Tickets))
        }),
        contact: this.fb.group({
          'FirstName': '',
          'LastName': ['', Validators.required],
          'Email': ['', [Validators.required, emailValidator]],
          'Phone': '',
          'Comments': '',
          'OptIn': false,
        }),
      })
    });

    this.form.valueChanges
      .subscribe(data => this.validate());
    this.validate();
  }

  displayError(err: any) {
    this.error = err;
  }

  showIsFull(show: Campaign): boolean {
    return show.TotalQuantity >= show.MaximumProducts__c;
  }

  isShowPast(show: Campaign): boolean {
    const now = Date.now();
    const endDate = Date.parse(show.EndDate);

    return now > endDate;
  }

  isShowReservable(show: Campaign): boolean {
    return !this.showIsFull(show) && !this.isShowPast(show);
  }

  setShow(show: Campaign) {
    if (this.showIsFull(show)) {
      return;
    }

    this.show = show;
    this.reservation.CampaignId = show.Id;

    // Send impressions to GTM
    observableCombineLatest(
      this.campaignService.getTicketTypes(),
      this.campaignService.getCurrentProduction(),
      this.campaignService.getSponsors())
      .subscribe(data => {
        this.tagService.push({
          'ecommerce': {
            'currencyCode': 'EUR',
            'impressions': this._ticketsForGTM(this.reservation.Tickets)
          }
        });
      });
  }

  addTicket(ticket: Ticket) {
    this.angulartics.eventTrack.next({
      action: 'AddToCart',
      properties: {
        'content_ids': [ticket.ticketType.Id],
        'content_name': ticket.ticketType.Name,
        'content_type': 'ticket',
        'currency': 'EUR',
        'value': ticket.ticketType.UnitPrice
      },
    });

    this.angulartics.eventTrack.next({
      action: 'add_to_cart',
      properties: {
        'items': [{
          'name': ticket.ticketType.Name,
          'id': ticket.ticketType.Id,
          'category': this.show.Name,
          'price': ticket.ticketType.UnitPrice,
          'quantity': 1
        }]
      },
    });
  }

  removeTicket(ticket: Ticket) {
    this.angulartics.eventTrack.next({
      action: 'remove_from_cart',
      properties: {
        'items': [{
          'name': ticket.ticketType.Name,
          'id': ticket.ticketType.Id,
          'category': this.show.Name,
          'price': ticket.ticketType.UnitPrice,
          'quantity': 1
        }]
      },
    });
  }

  totalAmount() {
    let r = new Reservation();
    Object.assign(r, this.form.value);
    return r.totalAmount;
  }

  totalPrice() {
    let r = new Reservation();
    Object.assign(r, this.form.value);
    return r.totalPrice;
  }

  validate(ignoreDirty?: boolean) {
    if (!this.form) {
      return;
    }
    const form = this.form;

    this.formErrors = [];
    for (const fieldName in this.validationMessages) {
      const control = form.get(fieldName);

      if (ignoreDirty) {
        control.markAsDirty();
        control.markAsTouched();
      }

      if (control && (control.dirty || ignoreDirty) && !control.valid) {
        for (const key in control.errors) {
          this.formErrors.push(this.validationMessages[fieldName][key]);
        }
      }
    }

    return form.valid;
  }

  submit(form: FormGroup) {
    if (!form.valid) {
      return;
    }

    const value = {
      ...form.value.stepper.contact,
      ...form.value.stepper.tickets
    };

    Object.assign(this.reservation, value);
    console.log('submitted form', value);

    this.loading++;
    this.submitting = true;

    this.angulartics.eventTrack.next({
      action: 'InitiateCheckout',
      properties: {
        'currency': 'EUR',
        'value': this.reservation.getTotalPrice(),
        'num_items': this.reservation.Tickets.length,
      },
    });

    this.angulartics.eventTrack.next({
      action: 'begin_checkout',
      properties: {
        'currency': 'EUR',
        'value': this.reservation.getTotalPrice(),
        'num_items': this.reservation.Tickets.length,
        'items': this.reservation.Tickets.map(t => ({
          'name': t.ticketType.Name,
          'id': t.ticketType.Id,
          'category': this.show.Name,
          'price': t.ticketType.UnitPrice,
          'quantity': 1
        }))
      },
    })

    this.reservationService.put(this.reservation)
      .subscribe((result: any) => {
        this.submitted = true;
        this.loading--;

        console.log(result);
        window.location.href = result.location;

        let opportunity = result as Opportunity;
      }, (error: any) => {
        this.submitting = false;
        this.snackBar.open('Oepsie! ' + error);
      });
  }

  private _ticketsForGTM(tickets: Ticket[]) {
    if (!tickets) {
      return [];
    }
    return tickets.map(t => ({
      'name': t.ticketType.Name,
      'id': t.ticketType.Id,
      'category': this.show.Name,
      'list': this.show.Name,
      'price': t.ticketType.UnitPrice,
      'quantity': t.amount
    }));
  }

}
