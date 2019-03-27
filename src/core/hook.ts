import { Observable, of, throwError, isObservable } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';
import { Type } from 'injection-js';
import { TokenExt } from './extensions';

export class HookManager {

    /**
     * Check if a token has a hook implemented
     *
     * @param  {string} hook
     * @param  {Type} token
     * @returns boolean
     */
    public static hasLifecycleHook<T>(hook: string, token: Type<T> | TokenExt<any>): boolean {
        return token instanceof Type && hook in token.prototype;
    }

    /**
     * Trigger the hook if
     * it is implemented
     *
     * @param  {string}   hook
     * @param  {Type}     token
     * @param  {T}        instance
     * @param  {any[]}    args
     * @param  {boolean}  throwErr
     * @returns Observable
     */
    public static triggerHook<Instance, R>(hook: string, token: Type<Instance> | TokenExt<Instance>,
            instance: Instance, args?: any[], throwErr?: boolean): Observable<R> {
        return of(this.hasLifecycleHook(hook, token)).pipe(
            flatMap(bool => !bool ?
                throwErr ?
                    throwError(new Error(`Hook missing ${hook} on ${token.name}`)) :
                    of(<R>null) :
                of(bool).pipe(
                    map(_ => <R>Reflect.apply(instance[ hook ], instance, args || [])),
                    flatMap(_ => this.wrapObservable(_))
                )
            )
        );
    }

    private static wrapObservable<R>(value: Observable<R> | R): Observable<R> {
        return isObservable(value) ?
            value : of(value || null);
    }
}
