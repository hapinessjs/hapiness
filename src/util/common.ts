import { Observable } from 'rxjs/Rx';

export function lightObservable(): Observable<void> {
    return Observable.create((observer) => {
        observer.next();
        observer.complete();
    });
}
