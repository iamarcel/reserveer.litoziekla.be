import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '@angular/material';
import { NgSemanticModule } from 'ng-semantic';

import { ReservationsComponent } from './reservations.component';

import { CampaignService } from './campaign.service';
import { ReservationService } from './reservation.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    NgSemanticModule
  ],
  declarations: [
    ReservationsComponent
  ],
  exports: [ ReservationsComponent ],
  providers: [
    CampaignService,
    ReservationService
  ]
})
export class ReservationsModule { }
