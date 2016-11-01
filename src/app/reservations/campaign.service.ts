import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { ApiService } from '../api.service';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/throw';

import { Campaign } from './models/campaign';
import { Opportunity } from './models/opportunity';
import { Product2 } from './models/product2';

@Injectable()
export class CampaignService {

    private currentProductionUrl: string;
    private ticketsUrl: string;
    private sponsorsUrl: string;

    constructor(private http: Http,
                private apiService: ApiService) {
        this.currentProductionUrl = apiService.baseUrl + 'current/productions';
        this.ticketsUrl = apiService.baseUrl + 'current/productions/tickets';
        this.sponsorsUrl = apiService.baseUrl + 'current/productions/sponsors';
    }

    getCurrentProduction(): Observable<Campaign> {
        return this.http.get(this.currentProductionUrl)
            .map(response => response.json() as Campaign);
            // TODO: Catch errors
    }

    getTicketTypes(): Observable<Product2[]> {
        return this.http.get(this.ticketsUrl)
            .map(response => response.json() as Product2[]);
        // TODO: Catch errors
    }

    getSponsors(): Observable<Opportunity[]> {
        return this.http.get(this.sponsorsUrl)
            .map(response => response.json() as Opportunity[]);
    }
}
