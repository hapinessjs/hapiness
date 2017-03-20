import { Observable } from 'rxjs/Observable';
import { reflector } from 'injection-js/reflection/reflection';
import { Type } from 'injection-js/facade/type';
import { CoreModule } from '../core';
import * as Boom from 'boom';
import * as Debug from 'debug';
const debug = Debug('module/hook');

export enum eRouteLifecycleHooks {
  OnGet,
  OnPost,
  OnPut,
  OnPatch,
  OnOptions,
  OnDelete
}

export class RouteLifecycleHook {

  /**
   * Check if a route has a hook implemented
   *
   * @param  {ModuleLifecycleHooks} hook
   * @param  {any} token
   * @returns boolean
   */
  public static hasLifecycleHook(hook: eRouteLifecycleHooks, token: any): boolean {
    debug('Check hook', this.getHookName(hook), token.name);
    return reflector.hasLifecycleHook(token, this.getHookName(hook));
  }

  /**
   * Trigger the hook if
   * it is implemented
   *
   * @param  {ModuleLifecycleHooks} hook
   * @param  {CoreModule} module
   * @param  {any[]} args
   * @returns Observable
   */
  public static triggerHook(hook: eRouteLifecycleHooks, token: Type<any>, instance: any, args: any[]): Observable<any> {
    debug('Trigger hook', this.getHookName(hook), token.name, this.hasLifecycleHook(hook, token), instance);
    if (this.hasLifecycleHook(hook, token)) {
      const result = Reflect.apply(instance[this.getHookName(hook)], instance, args);
      if (result instanceof Observable) {
        return result;
      } else {
        return Observable.create((observer) => {
          observer.next();
          observer.complete();
        });
      }
    } else {
      throw Boom.create(500, `${this.getHookName(hook)} is not implemented in ${token.name}`);
    }
  }

  public static enumByMethod(method: string): eRouteLifecycleHooks {
    switch (method) {
      case 'get':
        return eRouteLifecycleHooks.OnGet;
      case 'post':
        return eRouteLifecycleHooks.OnPost;
      case 'put':
        return eRouteLifecycleHooks.OnPut;
      case 'patch':
        return eRouteLifecycleHooks.OnPatch;
      case 'options':
        return eRouteLifecycleHooks.OnOptions;
      case 'delete':
        return eRouteLifecycleHooks.OnDelete;
      default:
        throw Boom.create(500, 'Method does not exist');
    }
  }

  /**
   * Convert hook enum into
   * the matching method name
   *
   * @param  {eRouteLifecycleHooks} hook
   * @returns string
   */
  private static getHookName(hook: eRouteLifecycleHooks): string {
    switch (hook) {
      case eRouteLifecycleHooks.OnGet:
        return 'onGet';
      case eRouteLifecycleHooks.OnPost:
        return 'onPost';
      case eRouteLifecycleHooks.OnPut:
        return 'onPut';
      case eRouteLifecycleHooks.OnPatch:
        return 'onPatch';
      case eRouteLifecycleHooks.OnOptions:
        return 'onOptions';
      case eRouteLifecycleHooks.OnDelete:
        return 'onDelete';
      default:
        throw Boom.create(500, 'Hook does not exist');
    }
  }

}

/**
 * Route Handler
 * called on Http Get request
 *
 * @returns void
 */
export interface OnGet { onGet(request, reply): void; }

/**
 * Route Handler
 * called on Http Post request
 *
 * @returns void
 */
export interface OnPost { onPost(request, reply): void; }

/**
 * Route Handler
 * called on Http Put request
 *
 * @param  {Error} error
 * @returns void
 */
export interface OnPut { onPut(request, reply): void; }

/**
 * Route Handler
 * called on Http Patch request
 *
 * @param  {string} module
 * @returns void
 */
export interface OnPatch { onPatch(request, reply): void; }

/**
 * Route Handler
 * called on Http Options request
 *
 * @param  {string} module
 * @returns void
 */
export interface OnOptions { onOptions(request, reply): void; }

/**
 * Route Handler
 * called on Http Delete request
 *
 * @param  {string} module
 * @returns void
 */
export interface OnDelete { onDelete(request, reply): void; }
