import { CoreModule, Extension, OnExtensionLoad, OnShutdown } from '../../core/interfaces';
import { Observable } from 'rxjs/Observable';
import { ExtensionShutdown, ExtensionShutdownPriority } from '../../core';
import { EventManager } from './manager';

export class EventManagerExt implements OnExtensionLoad, OnShutdown {

    /**
     * Initilization of the extension
     *
     * @param  {CoreModule} module
     * @returns Observable
     */
    onExtensionLoad(module: CoreModule): Observable<Extension> {
        return Observable
            .of(new EventManager())
            .map(_ => ({
                instance: this,
                token: EventManagerExt,
                value: _
            }));
    }

    /**
     * Shutdown Event manager
     *
     * @param  {CoreModule} module
     * @param  {EventManager} manager
     * @returns ExtensionShutdown
     */
    onShutdown(module: CoreModule, manager: EventManager): ExtensionShutdown {
        return {
            priority: ExtensionShutdownPriority.NORMAL,
            resolver: Observable.of(manager.close())
        }
    }
}
