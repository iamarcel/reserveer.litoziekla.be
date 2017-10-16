export class Opportunity {
  public Id: string;
  public CampaignId: string;
  public AccountId: string;
  public RecordTypeId: string;
  public Pricebook2Id: string;
  public Name: string;
  public CloseDate: Date;
  public StageName: string;
  public TotalOpportunityQuantity: Number;
  public Logo__c?: string;
  public Amount: number;
  public PaymentId__c?: string;

  constructor(initializer: any) {
    Object.assign(this, initializer);
  }
}
