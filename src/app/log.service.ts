import { Injectable } from '@angular/core';
import { Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class LogService {

  constructor() { }

  logError(err: any) {
    let message: string = '';

    if (err instanceof Response) {
      const body = err.json();
      const error = body.error || JSON.stringify(body);
      message = `${err.status} - ${err.statusText || ''} ${error}`;
    } else {
      message = err.message ? err.message : err.toString();
    }

    console.error(message);
    return Observable.throw(message);
  }

}
