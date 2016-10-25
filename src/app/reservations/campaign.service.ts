import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { Observable } from 'rxjs/Observable';

import { Campaign } from './models/campaign';

@Injectable()
export class CampaignService {

    private currentProductionUrl = 'app/current-production';

    constructor(private http: Http) { }

    getCurrentProduction(): Observable<Campaign> {
        return this.http.get(this.currentProductionUrl)
            .map(response => response.json().data.campaign as Campaign);
            // TODO: Catch errors
    }
}