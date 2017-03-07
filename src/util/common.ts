import { Observable } from 'rxjs/Observable';

export function lightObservable(): Observable<void> {
    return Observable.create((observer) => {
        observer.next();
        observer.complete();
    });
}
