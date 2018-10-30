import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, pipe } from 'rxjs';
import {refCount, publishReplay, last, map} from 'rxjs/operators';

import { ApiService } from '../api.service';
import { LoadingService } from '../loading.service';

import { Campaign } from '../../../models/campaign';
import { Opportunity } from '../../../models/opportunity';
import { Product2 } from '../../../models/product2';

@Injectable()
export class CampaignService {

  private currentProductionUrl: string;
  private ticketsUrl: string;
  private sponsorsUrl: string;

  private _production: Observable<Campaign> = null;
  private _ticketTypes: Observable<Product2[]> = null;
  private _sponsors: Observable<Opportunity[]> = null;

  constructor(private http: HttpClient,
              private apiService: ApiService,
              private loader: LoadingService) {
    this.currentProductionUrl = apiService.baseUrl + 'current/productions';
    this.ticketsUrl = apiService.baseUrl + 'current/productions/tickets';
    this.sponsorsUrl = apiService.baseUrl + 'current/productions/sponsors';
  }

  getCurrentProduction(): Observable<Campaign> {
    if (!this._production) {
      this._production = this.http.get(this.currentProductionUrl).pipe(
        map(response => response as Campaign),
        last(),publishReplay(1),refCount(),);
    }
    this.loader.register(this._production, 'Getting production');
    return this._production;
    // TODO: Catch errors
  }

  getTicketTypes(): Observable<Product2[]> {
    if (!this._ticketTypes) {
      this._ticketTypes = this.http.get(this.ticketsUrl).pipe(
        map(response => response as Product2[]),
        last(),publishReplay(1),refCount(),);
    }
    this.loader.register(this._production, 'Getting ticket types');
    return this._ticketTypes;
    // TODO: Catch errors
  }

  getSponsors(): Observable<Opportunity[]> {
    if (!this._sponsors) {
      this._sponsors = this.http.get(this.sponsorsUrl).pipe(
        map(response => response as Opportunity[]),
        last(),publishReplay(1),refCount(),);
    }

    this.loader.register(this._sponsors, 'Getting sponsors');
    return this._sponsors;
  }
}
