export class Contact {
    public Id: string;
    public AccountId: string;
    public RecordTypeId: string;
    public FirstName: string;
    public LastName: string;
    public Phone: string;
    public Email: string;

    constructor(initializer: any) {
        Object.assign(this, initializer);
    }
}
