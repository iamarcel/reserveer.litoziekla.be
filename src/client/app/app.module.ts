import { NgModule, LOCALE_ID, ErrorHandler } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule, MatProgressBarModule, MatDialogModule } from '@angular/material';
import { RouterModule, Routes } from '@angular/router';
import localeNLBE from '@angular/common/locales/nl-BE';
import { DragScrollModule } from 'ngx-drag-scroll';
import { Angulartics2Module } from 'angulartics2';
import { Angulartics2GoogleGlobalSiteTag } from 'angulartics2/gst';
import { Angulartics2Facebook } from 'angulartics2/facebook';

import { AppErrorHandler } from './app-error-handler';
import { AppComponent } from './app.component';
import { ErrorModalComponent } from './error-modal.component';
import { ApiService } from './api.service';
import { LogService } from './log.service';
import { LoadingService } from './loading.service';
import { TagService } from './tag.service';

import { ReservationsModule } from './reservations/reservations.module';
import { ReservationsComponent } from './reservations/reservations.component';
import { OrderStatusComponent } from './reservations/order-status.component';
import { Angulartics2GoogleAnalytics } from 'angulartics2/ga/ga';

registerLocaleData(localeNLBE);

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
    AppComponent,
    ErrorModalComponent
  ],
  entryComponents: [
    ErrorModalComponent
  ],
  imports: [
    RouterModule.forRoot(
      appRoutes
    ),
    BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    // InMemoryWebApiModule.forRoot(AppData),
    MatToolbarModule,
    MatProgressBarModule,
    MatDialogModule,

    DragScrollModule,
    Angulartics2Module.forRoot(),

    ReservationsModule
  ],
  providers: [
    {
      provide: ErrorHandler,
      useClass: AppErrorHandler
    },
    { provide: LOCALE_ID, useValue: 'nl-be' },
    ApiService,
    TagService,
    LogService,
    LoadingService
  ],
  exports: [ ],
  bootstrap: [AppComponent]
})
export class AppModule { }
