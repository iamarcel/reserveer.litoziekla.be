import { Connection } from 'jsforce';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/concat';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/isEmpty';
import 'rxjs/add/operator/first';

import { Contact } from '../src/app/reservations/models/contact';
import { Opportunity } from '../src/app/reservations/models/opportunity';
import { Reservation, Ticket } from '../src/app/reservations/models/reservation';

export const addOpportunityItems = (data: [Connection, any, Contact, Reservation]) => {
    const connection = data[0];
    const opportunityResult = data[1];
    const contact = data[2];
    const reservation = data[3];

    console.log('[LOG] Adding Opportunity items...');
    return Observable.forkJoin(
        addLineItems(connection, opportunityResult, reservation.Tickets),
        addContactRole(connection, opportunityResult, contact));
};

const addLineItems = (connection: Connection, opportunityResult, tickets: Ticket[]) => {
    console.log('[LOG] Adding line items to opportunity...');
    return Observable.forkJoin(
        tickets
            .filter(t => t.amount > 0)
            .map(ticket => Observable.fromPromise(
                (connection as any)
                    .sobject('OpportunityLineItem')
                    .create({
                        OpportunityId: opportunityResult.id,
                        PricebookEntryId: ticket.ticketType.Id,
                        Quantity: ticket.amount,
                        UnitPrice: ticket.ticketType.UnitPrice
                    }))))
};

const addContactRole = (connection: Connection, opportunityResult, contact: Contact) => {
    console.log('[LOG] Adding contact role to opportunity...');
    return Observable.fromPromise(
        (connection as any)
            .sobject('OpportunityContactRole')
            .create({
                OpportunityId: opportunityResult.id,
                ContactId: contact.Id,
                IsPrimary: true,
                Role: 'Buyer'
            }));
};
