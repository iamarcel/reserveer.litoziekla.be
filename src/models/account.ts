export class Account {
    public Id: String;
    public Name: String;
    public RecordTypeId: String;

    constructor(initializer: any) {
        Object.assign(this, initializer);
    }
}
