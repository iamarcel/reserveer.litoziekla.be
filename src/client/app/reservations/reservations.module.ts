import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
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
import { ShareButtonModule, ShareButtonsModule, ShareButtonsOptions } from 'ngx-sharebuttons';

import { ReservationsComponent } from './reservations.component';
import { OrderStatusComponent } from './order-status.component';

import { CampaignService } from './campaign.service';
import { ReservationService } from './reservation.service';
import { TicketLineItemComponent } from './ticket-line-item/ticket-line-item.component';

const options: ShareButtonsOptions = {
  include: ['whatsapp', 'facebook', 'twitter', 'email'],
  theme: 'material-light',
  gaTracking: true,
  twitterAccount: 'litoziekla'
}

const buttonsConfig = {
  facebook: {
    icon: 'fab fa-facebook'
  },
  whatsapp: {
    icon: 'fab fa-whatsapp'
  },
  twitter: {
    icon: 'fab fa-twitter'
  }
};

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
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
    ShareButtonsModule.forRoot(options, buttonsConfig)
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
