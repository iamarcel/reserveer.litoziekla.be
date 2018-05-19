
import { combineLatest as observableCombineLatest, Observable } from 'rxjs';

import { switchMap, filter } from 'rxjs/operators';
import * as Mollie from 'mollie-api-node';


import Mail from './mail';
import Salesforce from './salesforce.service';

import { Opportunity } from '../models/opportunity';
import OpportunityService from './opportunity.service';

import SETTINGS from './settings';

// Set up Mollie
export const api = new Mollie.API.Client();
api.setApiKey(SETTINGS.mollie.api_key);

export const checkPayment = (req, res) => {
  if (!req.body.id) {
    return res.status(400).json({ message: 'could not find ID param' });
  }

  api.payments.get(req.body.id, (payment) => {
    const opportunityId = payment.metadata.OpportunityId;
    switch (payment.status) {
      case 'paid':
        observableCombineLatest(
          // Update Opportunity
          OpportunityService.confirm(opportunityId),
          // Update Mailchimp order status
          Mail.mail.confirmPayment(opportunityId),
        ).subscribe(([opportunity, mail]) => {
          // Refresh Salesforce production
          Salesforce.salesforce.queueProductionRefresh();

          // Send response
          res.status(200).json(opportunity);
        });

        break;
      case 'refunded': // deprecated API v1 status
      case 'charged_back': // deprecated API v1 status
      case 'expired':
      case 'failed':
      case 'cancelled':
        if (payment.amountRemaining) {
          const remainingValue = parseFloat(payment.amountRemaining);
          if (remainingValue > 0.0) {
            // Partial refund
            console.log(`[LOG] Reservation ${opportunityId} is partially refunded.`);
            Salesforce.salesforce.postMessage(
              "Hey bestuur! Deze reservatie werd gedeeltelijk terugbetaald. "
              + `Het resterende bedrag is € ${remainingValue}. `
              + "Vergeten jullie niet het aantal tickets aan te passen?",
              opportunityId
            );
          }
        } else {
          // Probably cancellation / expiration
          Salesforce.salesforce.getOpportunity(opportunityId).pipe(
            filter((opportunity: Opportunity) => opportunity.PaymentId__c == payment.id),
            switchMap(
              () => Salesforce.salesforce.patchOpportunity({
                Id: payment.metadata.OpportunityId,
                StageName: 'Closed Lost',
              })), ).subscribe();
        }
      case 'paidout':
      case 'pending':
      case 'open':
      default:
        // Do nothing
        console.log(`[LOG] Payment status for ${payment.metadata.OpportunityId}: ${payment.status}`);
        res.status(200).json({});
    }
  });
};

export const getMethods = (req, res) => {
  api.methods.all((methods) => {
    if (methods.error) {
      console.error(methods.error);
      return res.status(500).json(methods);
    }

    res.status(200).json(methods);
  });
}
