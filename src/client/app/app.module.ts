import { BrowserModule } from '@angular/platform-browser';
import { NgModule, LOCALE_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule, MatProgressBarModule } from '@angular/material';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { ApiService } from './api.service';
import { LogService } from './log.service';
import { LoadingService } from './loading.service';
import { TagService } from './tag.service';

import { ReservationsModule } from './reservations/reservations.module';
import { ReservationsComponent } from './reservations/reservations.component';
import { OrderStatusComponent } from './reservations/order-status.component';

const appRoutes: Routes = [
  {
    path: 'order/:id',
    component: OrderStatusComponent,
  },
  {
    path: 'order',
    component: ReservationsComponent
  },
  {
    path: '',
    redirectTo: '/order',
    pathMatch: 'full',
  }
];

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    RouterModule.forRoot(
      appRoutes
    ),
    BrowserModule,
    FormsModule,
    HttpModule,
    BrowserAnimationsModule,
    // InMemoryWebApiModule.forRoot(AppData),
    MatToolbarModule,
    MatProgressBarModule,

    ReservationsModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'nl' },
    ApiService,
    TagService,
    LogService,
    LoadingService
  ],
  exports: [ ],
  bootstrap: [AppComponent]
})
export class AppModule { }
