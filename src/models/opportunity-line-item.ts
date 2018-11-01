export class OpportunityLineItem {
    public Id: String;
    public OpportunityId: String;
    public PricebookEntryId: String;
    public Quantity: Number;
    public UnitPrice: Number;

    constructor(initializer: any) {
        Object.assign(this, initializer);
    }
}
