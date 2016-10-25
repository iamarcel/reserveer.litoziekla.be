import { Component } from '@angular/core';

import { Campaign } from './models/campaign';
import { CampaignService } from './campaign.service';

@Component({
    selector: 'app-reservations',
    templateUrl: 'reservations.component.html'
})
export class ReservationsComponent {

    private production: Campaign;

    constructor(private campaignService: CampaignService) {
        campaignService.getCurrentProduction()
            .subscribe(production => this.production = production);
    }

}