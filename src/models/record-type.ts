export class RecordType {
    public Id: String;
    public DeveloperName: String;
    public Name: String;
    public SobjectType: String;

    constructor(initializer: any) {
        Object.assign(this, initializer);
    }
}