import { Component } from '@angular/core';

import { Campaign } from './models/campaign';
import { Opportunity } from './models/opportunity';
import { Contact } from './models/contact';
import { Product2 } from './models/product2';
import { OpportunityLineItem } from './models/opportunity-line-item';

import { CampaignService } from './campaign.service';

@Component({
    selector: 'app-reservations',
    templateUrl: './reservations.component.html'
})
export class ReservationsComponent {

    private production: Campaign;
    private show: Campaign;
    private opportunity: Opportunity = new Opportunity({});;
    private contact: Contact = new Contact({});

    private ticketTypes: Product2[];
    private tickets: Ticket[];

    constructor(private campaignService: CampaignService) {
        campaignService.getCurrentProduction()
            .subscribe(production => this.production = production);
        campaignService.getTicketTypes()
            // .map(ticketTypes => ) // TODO Map each element to a Ticket
            .subscribe(ticketTypes => this.ticketTypes = ticketTypes);
    }

    setShow(show: Campaign) {
        this.show = show;
        this.opportunity.CampaignId = show.Id;
    }

}

interface Ticket {
    ticketType: Product2;
    amount: number;
}
