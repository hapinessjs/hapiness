import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Inject, CoreDecorator, createDecorator } from '../decorators';
import { ExtensionLogger } from './logger';
import { ReflectiveInjector } from 'injection-js';
import { DependencyInjection } from '../di';
import { ExtentionHooksEnum } from '../enums';
import { ExtensionValue, ExtensionConfig, ExtensionWithConfig } from './interfaces';
import { CoreModule } from '../interfaces';
import { extractMetadataAndName } from '../metadata';

export abstract class Extension<T> {

    public static LOGGER = 'logger';
    static createDecorator = createDecorator;
    static extractMetadata = extractMetadataAndName;

    protected value: T;
    public decorators: string[] = [];

    static instantiate<T>(di: ReflectiveInjector): Extension<T> {
        if (this.name === 'Extension') {
            throw new Error('Cannot instantiate an abstract class');
        }
        const handler = {
            get(target, prop, receiver) {
                const method = target[prop];
                if (!method) {
                    return method;
                }
                if (typeof method === 'function' && prop === ExtentionHooksEnum.OnLoad.toString()) {
                    return function(...args) {
                        return (<Observable<ExtensionValue<T>>>method.apply(this, args)).pipe(
                            tap(_ => receiver.value = _.value)
                        )
                    }
                } else {
                    return method;
                }
            }
        }
        // DI instantiation
        const instance = DependencyInjection.instantiateExtension(<any>this, di);
        return new Proxy(instance, handler);
    }

    /**
     * Allow to link a config to an extension while
     * bootstraping
     *
     * @param config
     */
    static setConfig(config: ExtensionConfig): ExtensionWithConfig<Extension<any>> {
        return {
            token: this,
            config
        };
    }


    constructor(
        @Inject(ExtensionLogger) public logger: ExtensionLogger,
        @Inject(ExtensionConfig) public config: ExtensionConfig
    ) {}

    abstract onLoad(module: CoreModule): Observable<ExtensionValue<T>>;

    abstract onBuild(module: CoreModule, decorators: CoreDecorator<any>[]): Observable<void>;

    abstract onShutdown(module: CoreModule): Observable<void>;

    /**
     * Helper to build an ExtensionValue used
     * in the onLoad method of an extension.
     *
     * @example
     * class CustomExtension extends Extension<string> {
     *    ...
     *    onLoad(module: CoreModule): Observable<ExtensionValue<string>> {
     *        return of('my value').pipe(
     *            map(_ => this.loadedResult(_))
     *        );
     *    }
     *    ...
     * }
     *
     */
    loadedResult(value: T): ExtensionValue<T> {
        return {
            value,
            instance: this,
            token: this.constructor
        }
    }

}
