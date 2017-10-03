import { Connection } from 'jsforce';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/concat';
import 'rxjs/add/operator/isEmpty';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/mergeMap';

import { Contact } from '../src/app/reservations/models/contact';
import { Reservation, Ticket } from '../src/app/reservations/models/reservation';

export const resolveContact = (data: [Connection, Reservation]): Observable<Contact> => {
    console.log('[LOG] Resolving contact...')
    return Observable.concat(findContact(data[0], data[1]), createContact(data[0], data[1]))
        .first();
}

const findContact = (connection: Connection, reservation: Reservation): Observable<Contact> =>
    Observable.create(
        (observer: Observer<Contact>) => (connection as any)
            .sobject('Contact')
            .find({
                Email: reservation.Email
            })
            .limit(1)
            .on('record', (r) => {
                observer.next(r);
            })
            .on('end', () => {
                observer.complete();
            })
            .on('error', (err) => {
                observer.error(err);
            }));

const createContact = (connection: Connection, reservation: Reservation): Observable<Contact> => Observable.fromPromise(
    (connection as any)
        .sobject('Account')
        .create({
            Name: reservation.LastName,
            Description: 'Aangemaakt tijdens een reservatie, door Libo.'
        })
        .then((result) => (connection as any)
              .sobject('Contact')
              .create({
                  AccountId: result.id,
                  FirstName: reservation.FirstName || '',
                  LastName: reservation.LastName,
                  Email: reservation.Email,
                  Phone: reservation.Phone || ''
              })))
    .mergeMap(result => findContact(connection, reservation));
