
import { pipe, combineLatest as observableCombineLatest,  AsyncSubject ,  Observable } from 'rxjs';

import {take, mergeMap, switchMap} from 'rxjs/operators';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as ApplicationInsights from 'applicationinsights';
import * as Mollie from 'mollie-api-node';
import SETTINGS from './settings';


















import { RxHR } from '@akanass/rx-http-request';

import { Account } from '../models/account';
import { Contact } from '../models/contact';
import { Campaign } from '../models/campaign';
import { PricebookEntry } from '../models/pricebook-entry';
import { Reservation } from '../models/reservation';
import { Opportunity } from '../models/opportunity';

import * as mollie from './mollie';
import Salesforce from './salesforce.service';
import Mail from './mail';




const PORT = process.env.PORT || 3000;





// Set up app insights
ApplicationInsights.setup(SETTINGS.applicationinsights.api_key);
ApplicationInsights.start();

// Start up the app
const app = express();
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

app.get('/api/v1/current/productions', (req, res) => {
  salesforce.production$.pipe(take(1)).subscribe((result) => res.json(result));
});

app.get('/api/v1/current/productions/tickets', (req, res) => {
  salesforce.pricebookEntries$.pipe(take(1)).subscribe((result) => res.json(result));
});

app.get('/api/v1/current/productions/sponsors', (req, res) => {
  salesforce.sponsors$.pipe(take(1)).subscribe(sponsors => res.json(sponsors));
});

app.post('/api/v1/payments/check', mollie.checkPayment);

const salesforce = Salesforce.setup();
const mail = Mail.setup(
    SETTINGS.mailchimp.api_key,
    SETTINGS.mailchimp.store_id,
    SETTINGS.mailchimp.list_id
);

// Update products on MailChimp
salesforce.pricebookEntries$.subscribe(
  entries => entries.forEach(entry => mail.upsertProduct(entry).subscribe(() => console.log('[LOG] Updated product in Mailchimp'))));

const request = require('request');

app.get('/api/v1/reservation/:id', (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ message: 'Missing param: id' });
  }


  observableCombineLatest(
    salesforce.getOpportunity(id),
    salesforce.getOpportunityContact(id),
  ).subscribe(results => {
    const [opportunity, contact] = results;
    salesforce.getCampaign(opportunity.CampaignId)
      .subscribe(campaign => {
        res.json({
          opportunity,
          contact,
          campaign,
        });
      });
  });
});

app.get('/api/v1/reservation/:id/contact', (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ message: 'Missing param: id' });
  }

  salesforce.getOpportunityContact(id).subscribe(c => res.json(c));
});

app.get('/api/v1/reservation/:id/campaign', (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ message: 'Missing param: id' });
  }

  salesforce
    .getOpportunity(id).pipe(
      switchMap<Opportunity, Campaign>(
      opportunity => salesforce.getCampaign(opportunity.CampaignId)))
    .subscribe(c => res.json(c));
});

const redirectToPayment = (res, payment) => {
  res.writeHead(302, { Location: payment.getPaymentUrl() })
  return res.end();
};

const createPayment = (res, opportunity) =>
  mollie.api.payments.create({
    amount: opportunity.Amount,
    description: opportunity.Name,
    redirectUrl: `${SETTINGS.root}/order/${opportunity.Id}`,
    webhookUrl: `${SETTINGS.root}/api/v1/payments/check`,
    metadata: {
      OpportunityId: opportunity.Id,
    },
  }, payment => {
    salesforce.patchOpportunity({
      ...opportunity,
      PaymentId__c: payment.id,
    });
    redirectToPayment(res, payment);
  });

const upsertPayment = (res, opportunity) =>
  // Fetch the payment
  mollie.api.payments.get(opportunity.PaymentId__c, (payment) => {
    if (payment.error || payment.status !== 'open') {
      createPayment(res, opportunity);
    } else {
      redirectToPayment(res, payment);
    }
  });



app.get('/api/v1/reservation/:id/pay', (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).json({ message: 'Missing param: id' });
  }

  salesforce.getOpportunity(id)
    .subscribe(opportunity => {
      if (opportunity.PaymentId__c) {
        upsertPayment(res, opportunity);
      } else {
        createPayment(res, opportunity);
      }
    });
});

app.get('/api/v1/methods', mollie.getMethods);

app.post('/api/v1/reservations', (req, res) => {
  let reservation = new Reservation();
  Object.assign(reservation, req.body);

  // postToTeam(SETTINGS, reservation, production)
  //   .subscribe(x => console.log('[LOG] Sent out that there\'s a new reservation to the team!'));

  let salesforceReservation = { ...reservation };
  delete salesforceReservation.OptIn;

  RxHR.post(SETTINGS.salesforce.endpoints.reservation, {
    method: 'POST',
    json: true,
    body: salesforceReservation
  })
    .subscribe(data => {
      if (data.response.statusCode != 201) {
        res.status(data.response.statusCode).json({
          error: data.body ? JSON.stringify(data.body) : 'Unknown error.',
        });
      } else {
        const opportunity = JSON.parse(data.body);

        const orderUrl = `${SETTINGS.root}/order/${opportunity.Id}`;

        // Add to Mailchimp
        observableCombineLatest(
          salesforce.getOpportunityContact(opportunity.Id),
          salesforce.getOpportunityLineItems(opportunity.Id),
          salesforce.pricebookEntries$,
        ).pipe(mergeMap(
          ([contact, lines, entries]) => mail.insertReservation(
            reservation,
            opportunity,
            contact,
            lines,
            entries,
            orderUrl
          )))
          .subscribe(data => console.dir(data), err => console.error(err));

        // Create the payment
        if (reservation.getTotalPrice() > 0) {
          mollie.api.payments.create({
            amount: reservation.getTotalPrice(),
            description: opportunity.Name,
            redirectUrl: `${SETTINGS.root}/order/${opportunity.Id}`,
            webhookUrl: `${SETTINGS.root}/api/v1/payments/check`,
            metadata: {
              OpportunityId: opportunity.Id,
            },
          }, (payment) => {
            if (payment.error) {
              console.error(payment.error);
              throw new Error(payment.error);
            }

            salesforce.patchOpportunity({
              ...opportunity,
              PaymentId__c: payment.id,
            }).subscribe();

            res.status(201).json({
              data: {
                location: payment.getPaymentUrl(),
              }
            });
          });
        } else {
          salesforce.patchOpportunity({
            Id: opportunity.Id,
            StageName: 'Closed Won'
          }).subscribe(() => res.status(201).json({
            data: {
              location: `${SETTINGS.root}/order/${opportunity.Id}`
            }
          }));
        }
      }
    });
});

app.use(express.static('../../'));
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: '../../' });
});

app.listen(PORT, _ => {
    console.log('\n[NICE] App listening in port ' + PORT + '!');
});
