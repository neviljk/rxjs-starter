import {EMPTY, BehaviorSubject, Observable, of, throwError, fromEvent, timer, interval} from 'rxjs';
import {
    retry,
    expand,
    delay,
    delayWhen,
    filter,
    switchMap,
    mergeMap,
    retryWhen,
    tap,
    catchError,
    map,
    take,
    concat,
    finalize,
    repeatWhen, timestamp
} from "rxjs/internal/operators";

Array.prototype.sample = function(){
    return this[Math.floor(Math.random()*this.length)];
}

const click$ = fromEvent(document.getElementById('button2'), 'click');

const store = new BehaviorSubject();
let storeObs = store.asObservable();

let counter = 0;

click$.pipe(
    tap(x => {
        counter+=1;
        console.log('you clicked! '+ 'sending request -- '+ counter);
        store.next(counter);
    })
).subscribe()

// of('Hello', 'RxJS').subscribe(console.log);

let responses = [
    {
        "status": "ERR",
        "data": []
    },
    {
        "status": "OK",
        "data": []
    },
    {
        "status": "OK",
        "data": [{
            status: 'RUNNING'
        }]
    },
    {
        "status": "OK",
        "data": [{
            status: 'FAILED'
        }]
    },
    {
        "status": "OK",
        "data": [{
            status: 'FINISHED'
        }]
    },
]

let startTime = performance.now(), endTime;

const makeResponse = reqid => {
    console.log('reqid ' + reqid + ' made at ' + ((performance.now() - startTime)/1000).toString() )
    let resp = Object.assign({}, responses.sample())
    if (resp.data.length > 0) {
        resp.data[0]['jobId'] = reqid
    }
    return resp
}


const mockHTTPRequest = reqid => {
    return of(reqid)
        .pipe(
            map(reqid => makeResponse(reqid)),
            // map(resp => {
            //         console.log('reqid: ' + reqid + ' server response was ' + JSON.stringify(resp))
            //
            //         if ( resp.status === 'ERR' ) { //|| retryAttempt > maxRetryAttempts
            //             throw new Error("reqid: " + reqid + " got error: " + resp.status);
            //         }
            //         if (resp.data && resp.data[0].status === 'FAILED') {
            //         ),
            //             throw new Error("reqid: " + reqid + " got error: " + resp.status);
            //         }
            // }
            // switchMap(resp => {
            //     console.log('reqid: ' + reqid + ' server response was ' + JSON.stringify(resp))
            //     if (resp.status === 'ERR' ) { //|| retryAttempt > maxRetryAttempts
            //         return throwError(error);
            //     }
            //     if (resp.data && resp.data[0].status === 'FAILED') {
            //         return throwError(error);
            //     }
            //     return of(resp)
            // }),
            delay(Math.random() * 1000),
        )
}


const maxRetryAttempts = 5;
// For retrying
export const genericRetryStrategy = attempts => {
    return attempts.pipe(
        mergeMap((error, i) => {
            const retryAttempt = i + 1;
            // if maximum number of retries have been met
            // or response is a status code we don't wish to retry, throw error
            // if ( error.status === 'ERR' ) { //|| retryAttempt > maxRetryAttempts
            //     return throwError(error);
            // }

            if (error.data && error.data.length === 0 ||
                error.data && error.data[0].status === 'RUNNING') {
                console.log('Retrying this : ' + JSON.stringify(error) +  ` Attempt ${retryAttempt}: `);
                return timer(1000);
            }

            return of(error);
        }),
        finalize(() => console.log('We are done!'))
    );
};

export const genericRetryStrategy2 = attempts => {
    return attempts.pipe(
        mergeMap((error, i) => {
            const retryAttempt = i + 1;
            // if maximum number of retries have been met
            // or response is a status code we don't wish to retry, throw error
            // if ( error.status === 'ERR' ) { //|| retryAttempt > maxRetryAttempts
            //     return throwError(error);
            // }

            if (error.data && error.data.length === 0 ||
                error.data && error.data[0].status === 'RUNNING') {
                console.log('Retrying this : ' + JSON.stringify(error) +  ` Attempt ${retryAttempt}: `);
                return timer(1000);
            }

            return of(error);
        }),
        finalize(() => console.log('We are done!'))
    );
};
//
// const inner$ =  mockHTTPRequest.pipe(
//
// )

const isRunning = (resp) => {
    let status = resp && resp.status === "OK" &&
        (resp.data.length === 0 ||
            resp.data.length > 0 && resp.data[0].status === 'RUNNING')
    return status
}


storeObs.pipe(
    filter(req => req!== undefined),

    mergeMap(req =>
        mockHTTPRequest(req).pipe(
            // timestamp(),
            expand((resp, i) => {
                if (isRunning(resp)) {
                    console.log('req: ' + req + ' was running (retrying): '+  i )
                    return mockHTTPRequest(req).pipe(delay(3000));
                }
                return EMPTY
            }),
            filter(resp => !isRunning(resp)),
            tap(resp => {
                console.log('req: ' + req + ' completed: ' + JSON.stringify(resp))
            }),

            // repeatWhen(completed => interval(1000)),
            // filter(resp => !isRunning(resp)),
            // // take(1),
            catchError((err, caught) => {
                console.log('caught the error da ' + err);
                return EMPTY;
            })
        )
    ),
).subscribe(val => console.log(val),
    (error)=>{
        console.log(' error' + error)
    }, ()=> {
        console.log('finished')
    });

const repeatInterval$ = interval(1000).pipe(take(5))


//
// storeObs.pipe(
//     filter(reqid => reqid !== undefined),
//     // mergeMap(reqid =>
//         mockHTTPRequest(reqid)
//             .pipe(
//                 // retry(3),
//                 // tap(resp => console.log('reqid: '+ reqid+ '  response was: ' + resp.status)),
//                 mergeMap(resp => {
//                     console.log('reqid: ' + reqid + ' response was ' + JSON.stringify(resp))
//                     if (resp.status === 'OK' && resp.data && resp.data[0].status === 'FINISHED') {
//                         return of(resp);
//                     } else {
//                         return throwError(resp);
//                     }
//
//                 }),
//                 // map(resp => {
//                 //
//                 //     if (resp.status === 'RUNNING') {
//                 //         throw new Error(`Error response for reqid: ` + reqid)
//                 //     }
//                 //     return resp;
//                 // }),
//                 // retryWhen(errors => {
//                 //     return errors.pipe(
//                 //         delay(retryINTERVAL),
//                 //         take(retryCOUNT),
//                 //         concat(throwError("Giving up Retry.!")));
//                 // }),
//
//                 // retryWhen(errors => {
//                 //    return errors.pipe(
//                 //        mergeMap((error, i) => {
//                 //            console.log('mergemap error ' + error)
//                 //            const retryAttempt = i + 1;
//                 //            // if maximum number of retries have been met
//                 //            // or response is a status code we don't wish to retry, throw error
//                 //            if (error.status === 'ERR' || retryAttempt > maxRetryAttempts) {
//                 //                return throwError(error);
//                 //            }
//                 //            console.log(`Attempt ${retryAttempt}: `);
//                 //            return timer(1000);
//                 //        }),
//                 //    )
//                 // }),
//
//                 retryWhen(genericRetryStrategy),
//                 catchError((err, caught) => {
//                     console.log('caught the error da ' + err);
//                     return EMPTY;
//                 })
//             // )
//     ),
// ).subscribe(val => console.log(val),
//     (error)=>{
//     console.log(' error' + error)
// }, ()=> {
//     console.log('finished')
// });
//

