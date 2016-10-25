import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Observable } from 'rxjs/Observable';

import { Product2 } from './models/product2';

@Injectable()
export class ReservationService {

    private submitReservationUrl = 'app/reservation';

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

    public ticketType: Product2;
    public amount: number = 0;

    constructor(values: Object) {
        Object.assign(this, values);
    }
}
