import { Connection } from 'jsforce';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import 'rxjs/add/observable/fromPromise';

import { Campaign } from '../src/app/reservations/models/campaign';
import { Opportunity } from '../src/app/reservations/models/opportunity';

export const getSponsors = (data: [Connection, Campaign]) => {
    const connection = data[0];
    const campaign = data[1];

    console.log('[LOG] Getting sponsors...');
    return Observable.create(
        (observer: Observer<Opportunity>) => (connection as any)
            .sobject('Opportunity')
            .find({
                CampaignId: campaign.Id,
                'RecordType.DeveloperName': 'Partnership'
            })
            .on('record', (r) => {
                observer.next(r);
            })
            .on('end', () => {
                observer.complete();
            })
            .on('error', (err) => {
                observer.error(err);
            }))
        .filter((o: Opportunity) => o.Logo__c)
        .map((o: Opportunity) => {
            o.Logo__c = o.Logo__c.replace(/--c\..+\.content\.force\.com/,'.secure.force.com/test');
            return o;
        })
        .toArray();
};
