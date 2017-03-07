import { reflector } from 'injection-js/reflection/reflection';

import * as Debug from 'debug';
const debug = Debug('module/hook');

export enum eModuleLifecycleHooks {
  OnRegister,
  OnStart,
  OnError,
  OnModuleResolved
}

export class ModuleLifecycleHook {

  /**
   * Check if a module has a hook implemented
   *
   * @param  {ModuleLifecycleHooks} hook
   * @param  {any} token
   * @returns boolean
   */
  public static hasLifecycleHook(hook: eModuleLifecycleHooks, token: any): boolean {
    debug('Check hook', this.getHookName(hook), token.name);
    return reflector.hasLifecycleHook(token, this.getHookName(hook));
  }

  /**
   * Trigger the hook if
   * it is implemented
   *
   * @param  {ModuleLifecycleHooks} hook
   * @param  {any} token
   * @param  {any} instance
   * @param  {any[]} args
   * @returns void
   */
  public static triggerHook(hook: eModuleLifecycleHooks, token: any, instance: any, args: any[]): void {
    debug('Trigger hook', this.getHookName(hook), token.name, this.hasLifecycleHook(hook, token), instance);
    if (this.hasLifecycleHook(hook, token)) {
      Reflect.apply(instance[this.getHookName(hook)], instance, args);
    }
  }

  /**
   * Convert hook enum into
   * the matching method name
   *
   * @param  {eModuleLifecycleHooks} hook
   * @returns string
   */
  private static getHookName(hook: eModuleLifecycleHooks): string {
    switch (hook) {
      case eModuleLifecycleHooks.OnRegister:
        return 'onRegister';
      case eModuleLifecycleHooks.OnStart:
        return 'onStart';
      case eModuleLifecycleHooks.OnError:
        return 'onError';
      case eModuleLifecycleHooks.OnModuleResolved:
        return 'onModuleResolved';
    }
  }

}

/**
 * Module Lifecycle Hook
 * called once the module has been
 * registered into the server
 *
 * @returns void
 */
export interface OnRegister { onRegister(): void; }

/**
 * Module Lifecycle Hook
 * called once the server has started
 * only for the MainModule
 *
 * @returns void
 */
export interface OnStart { onStart(): void; }

/**
 * Module Lifecycle Hook
 * called when error are catched
 *
 * @param  {Error} error
 * @returns void
 */
export interface OnError { onError(error: Error): void; }

/**
 * Module Lifecycle Hook
 * called each time an imported
 * module has been registered
 *
 * @param  {string} module
 * @returns void
 */
export interface OnModuleResolved { onModuleResolved(module: string): void; }
