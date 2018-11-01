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
import { ShareModule, ShareButtonsOptions } from '@ngx-share/core';
import { ShareButtonsModule } from '@ngx-share/buttons';
import { DragScrollModule } from 'ngx-drag-scroll';
import { NgxJsonLdModule } from '@ngx-lite/json-ld';
import { Angulartics2Module } from 'angulartics2';
import { Angulartics2GoogleAnalytics } from 'angulartics2/ga';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faWhatsapp, faTwitter } from '@fortawesome/free-brands-svg-icons';

import { ReservationsComponent } from './reservations.component';
import { OrderStatusComponent } from './order-status.component';
import { SponsorsComponent } from './sponsors.component';

import { CampaignService } from './campaign.service';
import { ReservationService } from './reservation.service';
import { TicketLineItemComponent } from './ticket-line-item/ticket-line-item.component';

library.add(faFacebook, faWhatsapp, faTwitter, faEnvelope);

const options: ShareButtonsOptions = {
  include: ['whatsapp', 'facebook', 'twitter', 'email'],
  theme: 'material-light',
  gaTracking: true,
  twitterAccount: 'litoziekla'
}

const buttonsConfig = {
  facebook: {
    icon: ['fab', 'facebook']
  },
  whatsapp: {
    icon: ['fab', 'whatsapp']
  },
  twitter: {
    icon: ['fab', 'twitter']
  },
  email: {
    icon: ['fas', 'envelope']
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
    ShareButtonsModule.forRoot({
      options,
      prop: buttonsConfig
    }),
    DragScrollModule,
    NgxJsonLdModule,
  ],
  declarations: [
    ReservationsComponent,
    TicketLineItemComponent,
    OrderStatusComponent,
    SponsorsComponent
  ],
  exports: [ ReservationsComponent, OrderStatusComponent ],
  providers: [
    CampaignService,
    ReservationService
  ]
})
export class ReservationsModule { }
