import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '@angular/material';

import { ReservationsComponent } from './reservations.component';

import { CampaignService } from './campaign.service';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        MaterialModule
    ],
    declarations: [
        ReservationsComponent
    ],
    exports: [ ReservationsComponent ],
    providers: [
        CampaignService
    ]
})
export class ReservationsModule { }
