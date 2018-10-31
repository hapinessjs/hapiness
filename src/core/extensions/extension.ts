import { Observable } from 'rxjs';
import { Type } from '../decorators';
import { CoreModule } from '../interfaces';
import { tap } from 'rxjs/operators';

export interface ExtensionConfig {
    port?: number;
    host?: string;
    uri?: string;
}

export interface ExtensionValue<T> {
    value: T;
    instance: Extension<T>;
    token: Type<any>;
}

export abstract class Extension<T> {

    protected value: T;

    static instantiate<T>(token: Type<Extension<T>>): Extension<T> {
        const handler = {
            get(target, prop, receiver) {
                const method = target[prop];
                return function(...args) {
                    return (<Observable<ExtensionValue<T>>>method.apply(this, args)).pipe(
                        tap(_ => receiver.value = _.value)
                    )
                }
            }
        }
        return new Proxy(Reflect.construct(token, []), handler);
    }

    abstract onLoad(module: CoreModule, config: ExtensionConfig): Observable<ExtensionValue<T>>;

    abstract onBuild(module: CoreModule): Observable<void>;

    abstract onShutdown(module: CoreModule): Observable<void>;

}
