import { EMPTY, merge, Observable, of, throwError } from 'rxjs';
import { filter, flatMap, map, tap } from 'rxjs/operators';
import { Type } from './decorators';
import { InternalLogger } from './logger';

export class HookManager {

    private static logger = new InternalLogger('hook');

    /**
     * Check if a token has a hook implemented
     *
     * @param  {string} hook
     * @param  {Type} token
     * @returns boolean
     */
    public static hasLifecycleHook<T>(hook: string, token: Type<T>): boolean {
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
    public static triggerHook<T>(hook: string, token: Type<any>, instance: T, args?: any[], throwErr?: boolean): Observable<any> {
        return merge(
            of(this.hasLifecycleHook(hook, token))
                .pipe(
                    filter(_ => !!_),
                    map(_ => Reflect.apply(instance[ hook ], instance, args || [])),
                    flatMap(_ =>
                        (_ instanceof Observable) ?
                            _ : !!_ ?
                            of(_) :
                            EMPTY
                    )
                ),
            of(this.hasLifecycleHook(hook, token))
                .pipe(
                    filter(_ => !_ && throwErr),
                    flatMap(_ => throwError(new Error(`Hook missing ${hook} on ${token.name}`)))
                )
        )
            .pipe(
                tap(_ => this.logger.debug(`Triggering hook '${hook}' on '${token.name}'`))
            );
    }
}
