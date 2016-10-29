import { Component } from '@angular/core';

import { Campaign } from './models/campaign';
import { Opportunity } from './models/opportunity';
import { Account } from './models/account';
import { Contact } from './models/contact';
import { Product2 } from './models/product2';
import { OpportunityLineItem } from './models/opportunity-line-item';
import { Reservation, Ticket } from './models/reservation';

import { CampaignService } from './campaign.service';
import { ReservationService } from './reservation.service';

@Component({
    selector: 'app-reservations',
    templateUrl: './reservations.component.html'
})
export class ReservationsComponent {

    private production: Campaign;
    private show: Campaign;
    private reservation: Reservation = new Reservation();

    private loading: number = 0;
    private submitting: boolean = false;
    private submitted: boolean = false;

    constructor(private campaignService: CampaignService,
                private reservationService: ReservationService) {

        this.loading++;
        campaignService.getCurrentProduction()
            .subscribe(production => {
                console.log('Got the production', production);
                this.production = production;
                this.loading--;
            });

        this.loading++;
        campaignService.getTicketTypes()
            .map((tts: Product2[]) =>
                 tts.map(t => new Ticket({ticketType: t}))
                )
            .subscribe(tickets => {
                console.log('Got ticket types', tickets);
                this.reservation.Tickets = tickets;
                this.loading--;
            });

    }

    showIsFull(show: Campaign) {
        return show.NumberOfProducts__c >= show.MaximumProducts__c;
    }

    setShow(show: Campaign) {
        if (this.showIsFull(show)) {
            return;
        }

        this.show = show;
        this.reservation.CampaignId = show.Id;
    }

    submit() {
        this.loading++;
        this.submitting = true;
        this.reservationService.put(this.reservation)
            .subscribe((result: any) => {
                this.submitted = true;
                this.submitting = false;
                this.loading--;

                console.log(result);

                this.reservation = new Reservation();
            });
    }

}
