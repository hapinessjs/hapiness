import { Type } from '../decorators';
import { Observable } from 'rxjs';
import { CoreModule } from './module';

export interface ExtensionWithConfig {
    token: Type<any>;
    config: any;
}

export interface Extension {
    value: any;
    instance: any;
    token: Type<any>;
}

/**
 * OnExtensionLoad Hook
 *
 * @param  {CoreModule} module
 * @param  {any} config
 * @returns Observable
 */
export interface OnExtensionLoad { onExtensionLoad(module: CoreModule, config: any): Observable<Extension> }

/**
 * OnModuleInstantiated Hook
 *
 * @param  {CoreModule} module
 * @returns Observable
 */
export interface OnModuleInstantiated { onModuleInstantiated(module: CoreModule, server: any): Observable<void> }
