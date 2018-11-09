import { Type } from '../decorators';
import { Observable } from 'rxjs';
import { CoreModule } from './module';
import { ExtensionShutdownPriority } from '../enums';
import { Extension } from '../extensions';

export interface ExtensionWithConfig {
    token: Type<Extension<any>>;
    config: any;
}

export interface Extension {
    value: any;
    instance: any;
    token: Type<any>;
}

export interface ExtensionShutdown {
    priority: ExtensionShutdownPriority;
    resolver: Observable<any>;
}

/**
 * OnExtensionLoad Hook
 *
 * @param  {CoreModule} module
 * @param  {any} config
 * @returns Observable
 */
export interface OnExtensionLoad { onExtensionLoad(module: CoreModule, config: any): Observable<Extension<any>> }

/**
 * OnModuleInstantiated Hook
 *
 * @param  {CoreModule} module
 * @param  {any} server
 * @returns Observable
 */
export interface OnModuleInstantiated { onModuleInstantiated(module: CoreModule, server: any): Observable<void> }

/**
 * OnShutdown Hook
 *
 * @param  {CoreModule} module
 * @param  {any} server
 * @returns Observable
 */
export interface OnShutdown { onShutdown(module: CoreModule, server: any): ExtensionShutdown }
