import { Observable } from 'rxjs/Rx';

export function lightObservable() {
    return Observable.create((observer) => {
        observer.next();
        observer.complete();
    });
}
