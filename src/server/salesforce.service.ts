
import {from as observableFrom, combineLatest as observableCombineLatest, interval as observableInterval,  Observable ,  Observer ,  Subject } from 'rxjs';

import {publishReplay, map, startWith, toArray, filter, mergeMap, refCount, switchMap} from 'rxjs/operators';
import 'core-js';
import * as JSForce from 'jsforce';
import { UserInfo } from 'jsforce/connection';












import { Campaign } from '../models/campaign';
import { Opportunity } from '../models/opportunity';
import { OpportunityLineItem } from '../models/opportunity-line-item';
import { Product2 } from '../models/product2';
import { PricebookEntry } from '../models/pricebook-entry';
import { Contact } from '../models/contact';

import SETTINGS from './settings';

type CampaignQuantityCount = {
  CampaignId: string,
  TotalQuantity: number
};

// Fetch & store information we'll be using
const CAMPAIGN_FIELDS = 'Id,Name,Maximum_Opportunities__c,MaximumProducts__c,Hero_Image__c,'
  + 'StartDate,EndDate,NumberOfOpportunities,'
  + 'Location__c,RecordTypeId,RecordType.Name,RecordType.DeveloperName,'
  + 'DefaultPricebook2__c,Entrance__c,IsActive';

const PRICEBOOKENTRY_FIELDS = 'Id,Name,Pricebook2Id,Product2Id,'
    + 'UnitPrice,UseStandardPrice,'
    + 'Product2.Id,Product2.Description,Product2.Name';

export default class SalesforceService {

  public static salesforce: SalesforceService;

  private connection: JSForce.Connection;
  private _login$: Observable<JSForce.Connection>;
  private _production$: Subject<Campaign>;
  private _productionRefresh$: Subject<any>;
  public production$: Observable<Campaign>;
  public sponsors$: Observable<Opportunity[]>;
  public pricebookEntries$: Observable<PricebookEntry[]>;

  public static setup () {
    SalesforceService.salesforce = new SalesforceService();
    return SalesforceService.salesforce;
  }

  constructor () {
    this.connection = new JSForce.Connection({
      loginUrl: SETTINGS.salesforce.url,
    });
    const connection = this.connection;

    // Log in every hour
    this._login$ = observableInterval(1000 * 60 * 60).pipe(
      startWith(0),
      map(() => connection),
      switchMap(this.login),
      publishReplay(1),refCount(),);

    // Log login data
    this._login$.subscribe(
      result => console.log('[LOG] Logged in to Salesforce.'),
      err => console.error('[ERR] while logging in to Salesforce:\n', err)
    );

    // Refresh production when login changed
    this._production$ = new Subject<Campaign>();
    this._productionRefresh$ = new Subject<any>();
    this.connectProductionObservable(
      this._productionRefresh$.pipe(startWith(null)),
      this._production$);
    this.production$ = this
      ._production$
      .asObservable().pipe(
      switchMap(this.addTotalQuantity.bind(this)),
      publishReplay(1),refCount(),);
    this.production$.subscribe(
      result => console.log('[LOG] Production updated.'),
      err => console.error('[ERR] while caching production:\n', err)
    );

    // Refresh sponsors & production
    this.sponsors$ = observableCombineLatest(this._login$, this.production$).pipe(
      mergeMap(this.getSponsors),
      publishReplay(1),refCount(),);

    // Refresh products
    this.pricebookEntries$ = this.production$.pipe(
      switchMap<Campaign, PricebookEntry[]>(production => this.getPricebookEntries(connection, production)),
      publishReplay(1),refCount(),);
    this.pricebookEntries$.subscribe(
      result => console.log('[LOG] Products updated.'),
      err => console.error('[ERR] while caching products:\n', err)
    );
  }

  login (connection: JSForce.Connection): Observable<JSForce.Connection> {
    console.log('[LOG] Logging in to Salesforce...');
    return observableFrom(
      connection.login(SETTINGS['salesforce']['auth']['user'],
                       SETTINGS['salesforce']['auth']['pass'])
        .then(x => connection));
  }

  request <T>(query: any): Observable<T> {
    return Observable.create(
      (observer: Observer<T>) =>
        query.execute({}, (err, result) => {
          if (err) {
            return observer.error(err);
          }
          if (result.totalSize < 1) {
            return observer.error('No results found');
          }

          observer.next(result.records);
          observer.complete();
        }));
  }

  connectProductionObservable (refresh$: Observable<any>, subject: Subject<Campaign>): void {
    observableCombineLatest(
      this._login$,
      refresh$
    ).subscribe(([connection, _]) => {
      console.log('[LOG] Caching current production...');
      connection.sobject('Campaign')
        .find<Campaign>({
          'RecordType.DeveloperName': 'Production'
        }, CAMPAIGN_FIELDS)
        .include('ChildCampaigns')
        .select(CAMPAIGN_FIELDS)
        .where({
          'RecordType.DeveloperName': 'Show'
        })
        .sort('EndDate')
        .end()
        .sort('-StartDate')
        .limit(1)
        .execute({}, (err, records) => {
          console.log('[LOG] Received answer about current production.');
          if (err) {
            return subject.error(err);
          }

          let campaign = records[0];
          let html = campaign.Hero_Image__c;
          campaign.Hero_Image__c =
            (html || '').replace(/--c\.documentforce\.com/, '.secure.force.com/test');

          // JSForce stores child relationships one level deeper in `records`
          campaign.ChildCampaigns = (campaign.ChildCampaigns as any).records;

          console.log('[LOG] Parsed current production');
          subject.next(records[0]);
        });
    });
  }

  getSponsors (data: [JSForce.Connection, Campaign]) {
    // @types/jsforce doesn't have a Connection.on(...) declaration
    const connection = data[0] as any;
    const campaign = data[1];

    console.log('[LOG] Getting sponsors...');
    return (Observable.create(
      (observer: Observer<Opportunity>) => connection
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
        })) as Observable<Opportunity>).pipe(
          filter((o: Opportunity) => !!(o.Logo__c)),
          map((o: Opportunity) => {
        o.Logo__c = o.Logo__c.replace(/--c\.documentforce\.com/, '.secure.force.com');
        return o;
      }),
      toArray(),);
  };

  queueProductionRefresh () {
    this._productionRefresh$.next(null);
  }

  getPricebookEntries (connection: JSForce.Connection, campaign: Campaign): Observable<PricebookEntry[]> {
    console.log('[LOG] Caching products...');
    return Observable.create((observer: Observer<PricebookEntry[]>) => {
      connection.sobject('PricebookEntry')
        .find<PricebookEntry>({
          'Pricebook2Id': campaign.DefaultPricebook2__c
        }, PRICEBOOKENTRY_FIELDS)
        .execute({}, (err, result) => {
          if (err) return observer.error(err);
          observer.next(result);
          observer.complete();
        });
    });
  }

  getOpportunity (id: string): Observable<Opportunity> {
    return Observable.create((observer: Observer<Opportunity>) => {
      return this.connection
        .sobject('Opportunity')
        .find<Opportunity>({
          'Id': id
        })
        .execute({}, (err, result) => {
          if (err) {
            return observer.error(err);
          }
          if (result.length < 1) {
            return observer.error('Reservation not found.');
          }

          observer.next(result[0]);
          observer.complete();
        })
    });
  }

  getOpportunityContactIds (opportunityId: string) {
    return Observable.create((observer: Observer<string[]>) => {
      return this.connection
        .sobject('OpportunityContactRole')
        .find({
          OpportunityId: opportunityId,
        })
        .limit(1)
        .execute({}, (err, result: any) => {
          if (err) {
            return observer.error(err);
          }
          if (result.length < 1) {
            return observer.error('Opportunity Contact Roles not found.');
          }

          observer.next(result.map(role => role.ContactId));
          observer.complete();
        });
    });
  }

  getOpportunityContact (opportunityId: string): Observable<Contact> {
    return this.getOpportunityContactIds(opportunityId).pipe(
      switchMap(contactIds => {
        const contactId = contactIds[0];

        return Observable.create((observer: Observer<Contact>) => {
          this.connection
            .sobject('Contact')
            .find<Contact>({
              Id: contactId
            })
            .limit(1)
            .execute({}, (err, result) => {
              if (err) {
                return observer.error(err);
              }
              if (result.length < 1) {
                return observer.error('Contact not found.');
              }

              observer.next(result[0]);
              observer.complete();
            })
        })
      }))
  }

  getCampaign (id: string): Observable<Campaign> {
    return Observable.create(
      (observer: Observer<Campaign>) =>
        this.connection
        .sobject('Campaign')
        .find<Campaign>({ Id: id })
        .limit(1)
        .execute({}, (err, result) => {
          if (err) {
            return observer.error(err);
          }
          if (result.length < 1) {
            return observer.error('Campaign not found.');
          }

          observer.next(result[0]);
          observer.complete();
        }));
  }

  getOpportunityLineItems (opportunityId: string): Observable<OpportunityLineItem[]> {
    return Observable.create(
      (observer: Observer<OpportunityLineItem[]>) =>
        this.connection
        .sobject('OpportunityLineItem')
        .find<OpportunityLineItem>({
          OpportunityId: opportunityId
        })
        .execute({}, (err, result) => {
          if (err) {
            return observer.error(err);
          }
          if (result.length < 1) {
            return observer.error('Campaign not found.');
          }

          observer.next(result);
          observer.complete();
        }));
  }

  getProduct (productId: string) {
    return this.request<Product2>(
      this.connection.sobject('Product2').find<Product2>({
        Id: productId
      }));
  }

  patchOpportunity (opportunity: Partial<Opportunity>) {
    return Observable.create((observer: Observer<string>) => {
      this.connection.sobject('Opportunity')
        .update(opportunity, (err, result) => {
          if (err) {
            return observer.error(err);
          }
          observer.next(result.id);
          observer.complete();
        });
    })
  }

  countTotalQuantity () {
    return this.request<CampaignQuantityCount[]>(
      this.connection.query('SELECT CampaignId, SUM(TotalOpportunityQuantity) TotalQuantity ' +
                            'FROM Opportunity WHERE IsWon = true ' +
                            'GROUP BY CampaignId')
    );
  }

  addTotalQuantity (campaign: Campaign) {
    return this.countTotalQuantity().pipe(
      map((quantities: CampaignQuantityCount[]) => {
        campaign.ChildCampaigns = campaign.ChildCampaigns.map(childCampaign => {
          const quantityForThisCampaign = quantities.find(q => q.CampaignId == childCampaign.Id);
          if (quantityForThisCampaign) {
            childCampaign.TotalQuantity = quantityForThisCampaign.TotalQuantity;
          } else {
            childCampaign.TotalQuantity = 0;
          }
          return childCampaign;
        });
        return campaign;
      }));
  }

  postMessage (text: string, subjectId: string) {
    (this.connection as any).chatter
      .resource('/feed-elements')
      .create({
        body: {
          messageSegments: [{
            type: 'Text',
            text
          }, {
            type: 'Mention',
            id: '0F91p000000QOa4CAG'
          }]
        },
        feedElementType: 'FeedItem',
        subjectId
      }, (err, result) => {
        if (err) {
          throw new Error(err);
        }
        console.log(`Posted message: ${text}`);
      })
  }

}
