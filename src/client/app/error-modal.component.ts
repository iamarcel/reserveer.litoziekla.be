import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'error-modal',
  templateUrl: './error-modal.component.html'
})
export class ErrorModalComponent {

  message: string = 'Onbekende foutmelding.';

  constructor(private dialogRef: MatDialogRef<ErrorModalComponent>,
              @Inject(MAT_DIALOG_DATA) private data: any) {
    if (data) {
      this.message = data.message;
    }
  }

}
