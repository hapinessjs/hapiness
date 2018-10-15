import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ExtensionShutdown, ExtensionShutdownPriority } from '../../core';
import { CoreModule, Extension, OnExtensionLoad, OnShutdown } from '../../core/interfaces';
import { EventManager } from './manager';

export class EventManagerExt implements OnExtensionLoad, OnShutdown {

    /**
     * Initialization of the extension
     *
     * @param  {CoreModule} module
     * @returns Observable
     */
    onExtensionLoad(module: CoreModule): Observable<Extension> {
        return of(new EventManager())
            .pipe(
                map(_ => ({
                    instance: this,
                    token: EventManagerExt,
                    value: _
                }))
            );
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
            resolver: of(manager.close())
        }
    }
}
