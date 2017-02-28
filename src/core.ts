import { buildModule } from './module';
import { ReflectiveInjector } from 'injection-js';
import { Server } from 'hapi';
import { Observable } from 'rxjs';

/**
 * CoreProvide Type
 * Used by CoreModule Type
 */
export interface CoreProvide {
    provide: any;
    useClass?: any;
    useValue?: any;
    useExisting?: any;
    useFactory?: any;
    deps?: any[];
}

/**
 * CoreModule Type
 * Represents a Module
 */
export interface CoreModule {
    di: ReflectiveInjector;
    name: string;
    version: string;
    options: any;
    providers?: CoreProvide[];
    modules?: CoreModule[];
}

/**
 * MainModule type
 * Same as CoreModule but
 * with HapiJS server instance
 */
export interface MainModule extends CoreModule {
    server: Server;
}

/**
 * CoreApp
 */
class Core {
    private mainModule: MainModule;

    bootstrap(module: any) {
        this.mainModule = <MainModule>buildModule(module);
        this.mainModule.server = new Server();
        this.mainModule.server.connection(this.mainModule.options);
    }


}

export function bootstrap(module: any) {

}



export function registerPlugin(module: CoreModule) {
   
}