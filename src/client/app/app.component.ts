import { Component } from '@angular/core';

import { Observable } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Angulartics2GoogleGlobalSiteTag } from 'angulartics2/gst';
import { Angulartics2Facebook } from 'angulartics2/facebook';

import { LoadingService } from './loading.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  title = 'Litoziekla reservaties';
  barValue$: Observable<number>;

  constructor (private loader: LoadingService,
               private angularticsGoogle: Angulartics2GoogleGlobalSiteTag,
               private angularticsFacebook: Angulartics2Facebook) {
    this.barValue$ = this.loader.progress$.pipe(map(x => x * 100),delay(0),);
    angularticsGoogle.startTracking();
    angularticsFacebook.startTracking();
  }

}
