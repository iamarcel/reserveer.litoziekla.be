import { InMemoryDbService } from 'angular-in-memory-web-api';

import { Campaign } from '../../models/campaign';
import { Pricebook2 } from '../../models/pricebook2';
import { Product2 } from '../../models/product2';
import { RecordType } from '../../models/record-type';

export class AppData implements InMemoryDbService {

    createDb() {

        let productionRecordType = new RecordType({
            Id: 'zosw-record-type',
            Name: 'production',
            DeveloperName: 'Production',
            SobjectType: 'Campaign'
        });

        let currentPricebook2 = new Pricebook2({
            Id: 'zoswpricebook',
            IsStandard: false
        });

        let ticketTypes: Product2[] = [
            new Product2({
                Id: 'zosw-p-default',
                Name: 'Standaardticket',
                DefaultPrice: 8
            }),
            new Product2({
                Id: 'zosw-p-sym',
                Name: 'Sympathiepakketje',
                DefaultPrice: 15
            })
        ];

        let currentProduction = new Campaign({
            Name: 'Zebra\'s op sterk water',
            StartDate: new Date(Date.now()),
            EndDate: new Date(Date.now() + 3600 * 3),
            Hero_Image__c: '<img src="//placekitten.com/400/150">',
            NumberOfOpportunities: 0,
            Maximum_Opportunities__c: 10,
            RecordTypeId: productionRecordType.Id,
            Location: 'BrandWoeker',
            DefaultPricebook2__c: currentPricebook2.Id,
            Campaigns: [
                new Campaign({
                    Name: 'Première',
                    StartDate: new Date(Date.now() + this.days(1)),
                    EndDate: new Date(Date.now() + this.days(2)),
                    Hero_Image__c: '<img src="//placekitten.com/400/150">',
                    MaximumProducts__c: 100,
                    NumberOfProducts__c: 10
                }),
                new Campaign({
                    Name: 'Vootstelling 2',
                    StartDate: new Date(Date.now() + this.days(2)),
                    EndDate: new Date(Date.now() + this.days(3)),
                    Hero_Image__c: '<img src="//placekitten.com/400/150">',
                    MaximumProducts__c: 100,
                    NumberOfProducts__c: 24
                })
            ]
        });

        let recordTypes: RecordType[] = [
            productionRecordType
        ];

        return {
            'current-production': {
                'campaign': currentProduction,
                'products': ticketTypes
            },
            'record-types': recordTypes,
            'reservation': []
        };

    }

    private days(n: number) {
        return 1000 * 3600 * 24 * n;
    }

}
