"use strict";
var campaign_1 = require('./reservations/models/campaign');
var pricebook2_1 = require('./reservations/models/pricebook2');
var product2_1 = require('./reservations/models/product2');
var record_type_1 = require('./reservations/models/record-type');
var AppData = (function () {
    function AppData() {
    }
    AppData.prototype.createDb = function () {
        var productionRecordType = new record_type_1.RecordType({
            Id: 'zosw-record-type',
            Name: 'production',
            DeveloperName: 'Production',
            SobjectType: 'Campaign'
        });
        var currentPricebook2 = new pricebook2_1.Pricebook2({
            Id: 'zoswpricebook',
            IsStandard: false
        });
        var ticketTypes = [
            new product2_1.Product2({
                Id: 'zosw-p-default',
                Name: 'Standaardticket',
                DefaultPrice: 8
            }),
            new product2_1.Product2({
                Id: 'zosw-p-sym',
                Name: 'Sympathiepakketje',
                DefaultPrice: 15
            })
        ];
        var currentProduction = new campaign_1.Campaign({
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
                new campaign_1.Campaign({
                    Name: 'Première',
                    StartDate: new Date(Date.now() + this.days(1)),
                    EndDate: new Date(Date.now() + this.days(2)),
                    Hero_Image__c: '<img src="//placekitten.com/400/150">',
                    MaximumProducts__c: 100,
                    NumberOfProducts__c: 10
                }),
                new campaign_1.Campaign({
                    Name: 'Vootstelling 2',
                    StartDate: new Date(Date.now() + this.days(2)),
                    EndDate: new Date(Date.now() + this.days(3)),
                    Hero_Image__c: '<img src="//placekitten.com/400/150">',
                    MaximumProducts__c: 100,
                    NumberOfProducts__c: 24
                })
            ]
        });
        var recordTypes = [
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
    };
    AppData.prototype.days = function (n) {
        return 1000 * 3600 * 24 * n;
    };
    return AppData;
}());
exports.AppData = AppData;
