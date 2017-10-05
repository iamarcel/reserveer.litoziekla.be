import { Product2 } from './product2';

export class PricebookEntry {
  public Id: string;
  public Name: string;
  public Product2Id: string;
  public Pricebook2Id: string;
  public UnitPrice: number;

  public Product2: Product2;

  constructor(initializer: any) {
    Object.assign(this, initializer);
  }
}
