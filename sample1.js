import { mergeMap, flatMap, concatMap, switchMap,  exhaustMap, delay} from  "rxjs/internal/operators";
import {EMPTY, BehaviorSubject, Observable,  throwError, fromEvent, timer, finalize, take, of, from} from 'rxjs';


console.log('loaded');

const example = operator => () =>
	from([0,1,2,3,4])
        .pipe(
            operator(x => of(x).pipe(delay(500)))
        )
        .subscribe(console.log, (err) => {console.log(err);}, () => console.log(`${operator.name} completed`));

module.exports = {
	mergeMap : example(mergeMap),
	flatMap : example(flatMap),
	concatMap : example(concatMap),
	switchMap : example(switchMap),
	exhaustMap : example(exhaustMap),
}
