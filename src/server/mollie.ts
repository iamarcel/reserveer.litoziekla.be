import * as Mollie from 'mollie-api-node';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';

import Mail from './mail';
import Salesforce from './salesforce.service';

import OpportunityService from './opportunity.service';

import SETTINGS from './settings';

// Set up Mollie
export const api = new Mollie.API.Client();
api.setApiKey(SETTINGS.mollie.api_key);

export const checkPayment = (req, res) => {
  if (!req.body.id) {
    return res.status(400).json({message: 'could not find ID param'});
  }

  api.payments.get(req.body.id, (payment) => {
    const opportunityId = payment.metadata.OpportunityId;
    switch (payment.status) {
    case 'paid':
      Observable.combineLatest(
        // Update Opportunity
        OpportunityService.confirm(opportunityId),
        // Update Mailchimp order status
        Mail.mail.confirmPayment(opportunityId)
      ).subscribe(([opportunity, mail]) => {
          res.status(200).json(opportunity);
        });

      break;
    case 'expired':
    case 'failed':
    case 'cancelled':
    case 'refunded':
    case 'charged_back':
      Salesforce.salesforce.getOpportunity(opportunityId)
        .filter(opportunity => opportunity.PaymentId__c == payment.id)
        .switchMap(
          () => Salesforce.salesforce.patchOpportunity({
            Id: payment.metadata.OpportunityId,
            StageName: 'Closed Lost',
          })).subscribe();
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
