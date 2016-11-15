import { BrowserModule } from '@angular/platform-browser';
import { NgModule, LOCALE_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { NgSemanticModule } from 'ng-semantic';

import { AppComponent } from './app.component';
import { ApiService } from './api.service';
import { LogService } from './log.service';
import { TagService } from './tag.service';

import { ReservationsModule } from './reservations/reservations.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    // InMemoryWebApiModule.forRoot(AppData),
    NgSemanticModule,

    ReservationsModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'nl' },
    ApiService,
    TagService,
    LogService
  ],
  exports: [ ],
  bootstrap: [AppComponent]
})
export class AppModule { }
