export class Contact {
    public Id: String;
    public AccountId: String;
    public RecordTypeId: String;
    public FirstName: String;
    public LastName: String;
    public Phone: String;
    public Email: String;

    constructor(initializer: any) {
        Object.assign(this, initializer);
    }
}