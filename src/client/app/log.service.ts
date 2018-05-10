
import {throwError as observableThrowError,  Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';

@Injectable()
export class LogService {

  constructor() { }

  logError(err: any) {
    let message: string = '';

    if (err instanceof HttpResponse) {
      const body = err.body;
      const error = body || JSON.stringify(err);
      message = `${err.status} - ${err.statusText || ''} ${error}`;
    } else {
      message = err.message ? err.message : err.toString();
    }

    console.error(message);
    return observableThrowError(message);
  }

}
