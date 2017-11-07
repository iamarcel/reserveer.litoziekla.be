import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/finally';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/scan';
import 'rxjs/add/operator/map';

export interface IProcess {
  name: string;
  isCompleted$: Observable<boolean>;
}

@Injectable()
export class LoadingService {

  processes$: Observable<IProcess[]>;
  registration$: Subject<IProcess>;
  progress$: Observable<number>;

  constructor () {
    this.registration$ = new Subject();
    this.processes$ = this.registration$.asObservable()
      .scan((acc, curr) => acc.concat([curr]), []);

    this.progress$ = this.processes$
      .map(ps => ps.map(p => p.isCompleted$))
      .switchMap(
        curr => Observable.combineLatest(
          ...curr,
          (...completions) => completions.filter(c => c === true).length /
              completions.length));
  }

  register (obs$: Observable<any>, name: string) {
    const isCompleted$ = new BehaviorSubject<boolean>(false);
    obs$.subscribe({
      complete: () => isCompleted$.next(true)
    });

    this.registration$.next({
      isCompleted$,
      name
    });
  }

}
