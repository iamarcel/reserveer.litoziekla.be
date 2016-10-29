import { PricebookEntry } from './pricebook-entry';

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
