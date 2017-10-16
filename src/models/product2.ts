export class Product2 {
  public Id: string;
  public Name: string;
  public DefaultPrice: number;
  public Description: string;

  constructor(initializer: any) {
    Object.assign(this, initializer);
  }
}
