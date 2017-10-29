import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  MatSnackBarModule,
  MatRadioModule,
  MatButtonModule,
  MatInputModule,
  MatIconModule,
  MatCardModule,
  MatListModule,
  MatStepperModule,
  MatCheckboxModule,
  MatToolbarModule,
} from '@angular/material';

import { ReservationsComponent } from './reservations.component';
import { OrderStatusComponent } from './order-status.component';

import { CampaignService } from './campaign.service';
import { ReservationService } from './reservation.service';
import { TicketLineItemComponent } from './ticket-line-item/ticket-line-item.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatRadioModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatListModule,
    MatStepperModule,
    MatCheckboxModule,
    MatToolbarModule,
  ],
  declarations: [
    ReservationsComponent,
    TicketLineItemComponent,
    OrderStatusComponent,
  ],
  exports: [ ReservationsComponent, OrderStatusComponent ],
  providers: [
    CampaignService,
    ReservationService
  ]
})
export class ReservationsModule { }
