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
    debug('checking hook', hook, token.name);
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
  public static triggerHook<T>(hook: string, token: Type<T>, instance: T, args?: any[]): Observable<any> {
    Hoek.assert((!!token && !!instance), 'Cannot trigger without token/instance');
    debug('triggering hook', hook, token.name);
    if (this.hasLifecycleHook<T>(hook, token)) {
      const result = Reflect.apply(instance[hook], instance, args);
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
      observer.error(new Error('Hook missing'));
      observer.complete();
    });
  }
}
