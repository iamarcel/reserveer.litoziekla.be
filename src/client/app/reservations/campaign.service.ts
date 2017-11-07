import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { ApiService } from '../api.service';
import { LoadingService } from '../loading.service';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/last';
import 'rxjs/add/operator/publishReplay';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

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

  constructor(private http: Http,
              private apiService: ApiService,
              private loader: LoadingService) {
    this.currentProductionUrl = apiService.baseUrl + 'current/productions';
    this.ticketsUrl = apiService.baseUrl + 'current/productions/tickets';
    this.sponsorsUrl = apiService.baseUrl + 'current/productions/sponsors';
  }

  getCurrentProduction(): Observable<Campaign> {
    if (!this._production) {
      this._production = this.http.get(this.currentProductionUrl)
        .map(response => response.json() as Campaign)
        .last().publishReplay(1).refCount();
    }
    this.loader.register(this._production, 'Getting production');
    return this._production;
    // TODO: Catch errors
  }

  getTicketTypes(): Observable<Product2[]> {
    if (!this._ticketTypes) {
      this._ticketTypes = this.http.get(this.ticketsUrl)
        .map(response => response.json() as Product2[])
        .last().publishReplay(1).refCount();
    }
    this.loader.register(this._production, 'Getting ticket types');
    return this._ticketTypes;
    // TODO: Catch errors
  }

  getSponsors(): Observable<Opportunity[]> {
    if (!this._sponsors) {
      this._sponsors = this.http.get(this.sponsorsUrl)
        .map(response => response.json() as Opportunity[])
        .last().publishReplay(1).refCount();
    }

    this.loader.register(this._production, 'Getting sponsors');
    return this._sponsors;
  }
}
