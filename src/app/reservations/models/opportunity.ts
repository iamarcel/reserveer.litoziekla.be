export class Opportunity {
    public Id: String;
    public CampaignId: String;
    public AccountId: String;
    public RecordTypeId: String;
    public Pricebook2Id: String;
    public Name: String;
    public CloseDate: Date;
    public StageName: String;
    public TotalOpportunityQuantity: Number;
    public Logo__c?: string;

    constructor(initializer: any) {
        Object.assign(this, initializer);
    }
}
