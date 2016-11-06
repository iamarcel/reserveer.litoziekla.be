export class PricebookEntry {
  public Id: string;
  public Name: string;
  public Product2Id: string;
  public Pricebook2Id: string;
  public UnitPrice: Number;

  constructor(initializer: any) {
    Object.assign(this, initializer);
  }
}
