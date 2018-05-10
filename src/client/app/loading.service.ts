
import {combineLatest as observableCombineLatest,  Observable ,  Subject ,  BehaviorSubject } from 'rxjs';

import {scan, map, switchMap} from 'rxjs/operators';
import { Injectable } from '@angular/core';






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
    this.processes$ = this.registration$.asObservable().pipe(
      scan<IProcess, any[]>((acc, curr) => acc.concat([curr]), []));

    this.progress$ = this.processes$.pipe(
      map(ps => ps.map(p => p.isCompleted$)),
      switchMap(
        curr => observableCombineLatest(
          ...curr,
          (...completions) => completions.filter(c => c === true).length /
              completions.length)),);
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
