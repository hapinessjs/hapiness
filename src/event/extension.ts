import { Extension } from '../core/extensions';
import { EventManager } from './manager';
import { of } from 'rxjs';
import { ExtensionShutdownPriority } from '../core';

export class EventExtension extends Extension<EventManager> {

    onLoad() {
        return of(this.loadedResult(new EventManager()));
    }

    onBuild() { return of(null); }

    onShutdown() {
        return {
            priority: ExtensionShutdownPriority.NORMAL,
            resolver: of(this.value.close())
        };
    }
}
