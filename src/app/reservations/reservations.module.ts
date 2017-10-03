import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  MdSnackBarModule,
  MdRadioModule,
  MdButtonModule,
  MdInputModule
} from '@angular/material';

import { ReservationsComponent } from './reservations.component';

import { CampaignService } from './campaign.service';
import { ReservationService } from './reservation.service';
import { TicketLineItemComponent } from './ticket-line-item/ticket-line-item.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MdSnackBarModule,
    MdRadioModule,
    MdButtonModule,
    MdInputModule
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
