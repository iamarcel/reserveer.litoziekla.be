import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Observable } from 'rxjs/Observable';

import { PricebookEntry } from './models/pricebook-entry';

@Injectable()
export class ReservationService {

    private submitReservationUrl = 'api/v1/reservations';

    constructor(private http: Http) { }

    put(reservation: Reservation): Observable<any> {
        return this.http.post(this.submitReservationUrl,
                              reservation)
            .map(response => response.json().data);
    }

}

export class Reservation {

    public FirstName: string;
    public LastName: string;
    public Email: string;
    public Phone: string;

    public CampaignId: string;
    public Tickets: Ticket[];

    constructor() { }

}

export class Ticket {

    public ticketType: PricebookEntry;
    public amount: number = 0;

    constructor(values: Object) {
        Object.assign(this, values);
    }
}
