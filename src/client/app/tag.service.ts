import { Injectable } from '@angular/core';

declare let dataLayer: Array<{}>;

@Injectable()
export class TagService {

  public push(event: any) {
    dataLayer.push(event);
  }

}
