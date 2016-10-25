export class OpportunityContactRole {
    public Id: String;
    public OpportunityId: String;
    public ContactId: String;
    public IsPrimary: boolean;
    public Role: String;

    constructor(initializer: any) {
        Object.assign(this, initializer);
    }
}