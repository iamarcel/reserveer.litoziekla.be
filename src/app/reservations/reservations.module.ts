import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgSemanticModule } from 'ng-semantic';

import { ReservationsComponent } from './reservations.component';

import { CampaignService } from './campaign.service';
import { ReservationService } from './reservation.service';
import { TicketLineItemComponent } from './ticket-line-item/ticket-line-item.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgSemanticModule
  ],
  declarations: [
    ReservationsComponent,
    TicketLineItemComponent
  ],
  exports: [ ReservationsComponent ],
  providers: [
    CampaignService,
    ReservationService
  ]
})
export class ReservationsModule { }
