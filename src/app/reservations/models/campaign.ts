export class Campaign {
    public Id: string;
    public Name: string;
    public Maximum_Opportunities__c: number;
    public MaximumProducts__c: number;
    public Hero_Image__c: string;
    public StartDate: Date;
    public EndDate: Date;
    public NumberOfOpportunities: number;
    public NumberOfProducts__c: number;
    public Location__c: string;
    public RecordTypeId: string;
    public DefaultPricebook2__c: string;

    public ChildCampaigns: Campaign[];

    constructor(initializer?: any) {
        Object.assign(this, initializer || {});
    }
}
