import { buildModule } from './module';
import { ReflectiveInjector } from 'injection-js';
import { Server } from 'hapi';

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

export function bootstrap(module: any) {
    const mainModule = <MainModule>buildModule(module);
    mainModule.server = new Server();
    mainModule.server.connection(mainModule.options);
    
}