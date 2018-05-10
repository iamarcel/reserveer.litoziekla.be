import { PricebookEntry } from './pricebook-entry';

export class Reservation {

  public FirstName: string;
  public LastName: string;
  public Email: string;
  public Phone: string;
  public Comments: string;
  public OptIn: boolean;

  public CampaignId: string;
  public Tickets: Ticket[];

  constructor() { }

  get totalPrice(): number {
    return this.getTotalPrice();
  }

  getTotalPrice(): number {
    return (this.Tickets || []).reduce(
      (sum, t) => sum + t.amount * t.ticketType.UnitPrice, 0.0);
  }

  get totalAmount(): number {
    return (this.Tickets || []).reduce(
      (sum, t) => sum + t.amount, 0.0);
  }

}

export class Ticket {

  public ticketType: PricebookEntry;
  public amount: number = 0;

  constructor(values: Object) {
    Object.assign(this, values);
  }
}

export interface ISubmitReservationResponse {
  error?: any;
  data: {
    location: string;
  }
}
