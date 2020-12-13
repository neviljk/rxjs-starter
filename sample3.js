import {fromEvent, of} from 'rxjs';
import {delay, mergeMap} from "rxjs/internal/operators";

// RxJS v6+

// faking network request for save
const saveLocation = location => {
    return of(location).pipe(delay(300));
};
// streams
const click$ = fromEvent(document.getElementById('button1'), 'click');

click$
    .pipe(
        mergeMap((e) => {
            return saveLocation({
                x: e.clientX,
                y: e.clientY,
                timestamp: new Date().getTime() / 1000
            });
        })
    )
    // Saved! {x: 98, y: 170, ...}
    .subscribe(r => console.log('Saved!', r));
