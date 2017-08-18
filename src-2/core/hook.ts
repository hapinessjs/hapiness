import { reflector } from '../externals/injection-js/reflection/reflection';
import { Observable } from 'rxjs';
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
        return reflector.hasLifecycleHook(token, hook);
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
        this.logger.debug(`Triggering hook '${hook}' on '${token ? token.name : null}'`);
        return Observable
            .merge(
                Observable
                    .of(this.hasLifecycleHook(hook, token))
                    .filter(_ => !!_)
                    .map(_ => Reflect.apply(instance[hook], instance, args || []))
                    .flatMap(_ =>
                        (_ instanceof Observable) ?
                        _ : !!_ ?
                        Observable.of(_) :
                        Observable.empty()
                    ),

                Observable
                    .of(this.hasLifecycleHook(hook, token))
                    .filter(_ => !_ && throwErr)
                    .flatMap(_ => Observable.throw(new Error(`Hook missing ${hook} on ${token ? token.name : null}`)))
            )
    }
}
