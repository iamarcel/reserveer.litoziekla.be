import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { Ticket } from '../../../../models/reservation';

import { TagService } from '../../tag.service';

@Component({
  selector: 'app-ticket-line-item',
  templateUrl: './ticket-line-item.component.html',
  styleUrls: ['./ticket-line-item.component.scss']
})
export class TicketLineItemComponent {

  @Input()
  ticket: Ticket;

  @Input()
  form: FormGroup;

  @Output()
  add = new EventEmitter<Ticket>();

  @Output()
  remove = new EventEmitter<Ticket>();

  constructor(private tagService: TagService) { }

  removeTicket() {
    const field = this.form.get('amount');
    field.markAsDirty();

    if (field.value <= 0) {
      return;
    }

    field.setValue(field.value - 1);
    this.remove.emit(this.ticket);
  }

  addTicket() {
    const field = this.form.get('amount');
    field.setValue(field.value + 1);
    field.markAsDirty();
    this.add.emit(this.ticket);
  }

}
