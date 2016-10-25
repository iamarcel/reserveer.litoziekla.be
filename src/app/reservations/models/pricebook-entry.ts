export class PricebookEntry {
    public Id: String;
    public Product2Id: String;
    public Pricebook2Id: String;
    public UnitPrice: Number;

    constructor(initializer: any) {
        Object.assign(this, initializer);
    }
}