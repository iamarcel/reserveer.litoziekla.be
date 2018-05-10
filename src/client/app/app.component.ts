
import {delay, map} from 'rxjs/operators';
import { Component } from '@angular/core';

import { Observable } from 'rxjs';


import { LoadingService } from './loading.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  title = 'Litoziekla reservaties';
  barValue$: Observable<number>;

  constructor (private loader: LoadingService) {
    this.barValue$ = this.loader.progress$.pipe(map(x => x * 100),delay(0),);
  }

}
