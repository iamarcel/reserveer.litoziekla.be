import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { ApiService } from '../api.service';

import { Observable } from 'rxjs/Observable';

import { Campaign } from './models/campaign';
import { Product2 } from './models/product2';

@Injectable()
export class CampaignService {

    private currentProductionUrl: string;

    constructor(private http: Http,
                private apiService: ApiService) {
        this.currentProductionUrl = apiService.baseUrl + 'current/productions';
    }

    getCurrentProduction(): Observable<Campaign> {
        return this.http.get(this.currentProductionUrl)
            .map(response => response.json().campaign as Campaign);
            // TODO: Catch errors
    }

    getTicketTypes(): Observable<Product2[]> {
        return this.http.get(this.currentProductionUrl)
            .map(response => response.json().products as Product2[]);
        // TODO: Catch errors
    }
}
