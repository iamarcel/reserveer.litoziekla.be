import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { MatDialog } from '@angular/material';
import { HttpErrorResponse } from '@angular/common/http';

import { ErrorModalComponent } from './error-modal.component';

@Injectable()
export class AppErrorHandler implements ErrorHandler {

  constructor (private injector: Injector) {}

  handleError(error) {
    let dialog: MatDialog = this.injector.get(MatDialog);

    let dialogRef = dialog.open(ErrorModalComponent, {
      data: {
        message: error.statusText || error.message || error.toString()
      }
    });

    throw error;
  }

}
