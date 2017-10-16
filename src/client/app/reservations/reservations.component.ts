import { Component, ViewContainerRef } from '@angular/core';
import { FormControl, FormBuilder, FormGroup, FormArray,
         AbstractControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';

import { Campaign } from '../../../models/campaign';
import { Opportunity } from '../../../models/opportunity';
import { Product2 } from '../../../models/product2';
import { Reservation, Ticket } from '../../../models/reservation';

import { CampaignService } from './campaign.service';
import { ReservationService } from './reservation.service';
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

  production: Campaign;
  show: Campaign;
  reservation: Reservation = new Reservation();
  sponsors: Opportunity[];

  loading: number = 0;
  submitting: boolean = false;
  submitted: boolean = false;

  formErrors: string[] = [];

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
        this._buildForm();
      }, err => this.displayError(err));

    this.loading++;
    campaignService.getSponsors()
      .subscribe(sponsors => {
        this.sponsors = sponsors;
        this.loading--;
      }, this.displayError);

    this._buildForm();

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
        this.tagService.push({
          'ecommerce': {
            'currencyCode': 'EUR',
            'impressions': this._ticketsForGTM(this.reservation.Tickets)
          }
        });
      });
  }

  addTicket(ticket: Ticket) {
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

    this.reservationService.put(this.reservation)
      .subscribe((result: any) => {
        this.submitted = true;
        this.submitting = false;
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