import { Extension } from '../core/extensions';
import { EventManager } from './manager';
import { of } from 'rxjs';
import { ExtensionShutdownPriority } from '..';

export class EventExtension extends Extension<EventManager> {

    /**
     * Load a new instance of EventManager
     * as value of the Extension
     */
    onLoad() {
        return this.setValue(new EventManager());
    }

    /**
     * Gracefully shutdown the Extension
     */
    onShutdown() {
        return {
            priority: ExtensionShutdownPriority.NORMAL,
            resolver: of(this.value.close())
        };
    }

    onBuild() {}
}
