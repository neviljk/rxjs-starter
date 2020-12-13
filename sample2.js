import {BehaviorSubject, EMPTY, fromEvent, of} from 'rxjs';
import {catchError, delay, expand, filter, map, mergeMap, tap} from "rxjs/internal/operators";

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
            delay(Math.random() * 1000),
        )
}

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


