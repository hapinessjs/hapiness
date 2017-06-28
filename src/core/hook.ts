import { reflector } from '../externals/injection-js/reflection/reflection';
import { Observable } from 'rxjs/Observable';
import { Type } from './decorators';
import * as Hoek from 'hoek';
const debug = require('debug')('hapiness:hook');

export class HookManager {

  /**
   * Check if a token has a hook implemented
   *
   * @param  {string} hook
   * @param  {Type} token
   * @returns boolean
   */
  public static hasLifecycleHook<T>(hook: string, token: Type<T>): boolean {
    debug('checking hook', hook, token ? token.name : null);
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
   * @returns Observable
   */
  public static triggerHook<T>(hook: string, token: Type<any>, instance: T, args?: any[], throwErr?: boolean): Observable<any> {
    debug('triggering hook', hook, token ? token.name : null);
    Hoek.assert((!!token && !!instance), 'Cannot trigger without token/instance');
    if (this.hasLifecycleHook<T>(hook, token)) {
      const result = Reflect.apply(instance[hook], instance, args || []);
      if (result instanceof Observable) {
        return result;
      } else {
        return Observable.create(observer => {
            observer.next(result);
            observer.complete();
        });
      }
    }
    return Observable.create((observer) => {
      if (throwErr) {
        observer.error(new Error(`Hook missing ${hook} on ${token.name}`));
      } else {
        observer.next();
      }
      observer.complete();
    });
  }
}
