export class Pricebook2 {
    public Id: String;
    public IsStandard: boolean;

    constructor(initializer: any) {
        Object.assign(this, initializer);
    }
}