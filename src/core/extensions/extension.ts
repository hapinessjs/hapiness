import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Inject, createDecorator, createPropDecorator } from '../decorators';
import { ExtensionLogger } from './logger';
import { ReflectiveInjector } from 'injection-js';
import { DependencyInjection } from '../di';
import { ExtensionHooksEnum, ExtensionType } from '../enums';
import { ExtensionResult, ExtensionConfig, ExtensionWithConfig, ExtensionShutdown } from './interfaces';
import { CoreModule } from '../interfaces';
import { extractMetadataAndName, MetadataAndName } from '../metadata';

export abstract class Extension<T, C = ExtensionConfig> {

    public static LOGGER = 'logger';
    static createDecorator = createDecorator;
    static createPropDecorator = createPropDecorator;
    static extractMetadata = extractMetadataAndName;
    static type: ExtensionType = ExtensionType.DEFAULT;

    protected value: T;
    public decorators: string[] = [];

    static instantiate<T, C extends ExtensionConfig>(di: ReflectiveInjector): Extension<T, C> {
        if (this.name === 'Extension') {
            throw new Error('Cannot instantiate an abstract class');
        }
        const handler = {
            get(target, prop, receiver) {
                const method = target[prop];
                if (!method) {
                    return method;
                }
                if (typeof method === 'function' && prop === ExtensionHooksEnum.OnLoad.toString()) {
                    return function(...args) {
                        return (<Observable<ExtensionResult<T>>>method.apply(this, args)).pipe(
                            tap(_ => receiver.value = _.value)
                        );
                    };
                } else {
                    return method;
                }
            }
        };
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
    static setConfig<C extends ExtensionConfig>(config: C): ExtensionWithConfig<Extension<any, C>> {
        return {
            token: this,
            config
        };
    }


    constructor(
        @Inject(ExtensionLogger) public logger: ExtensionLogger,
        @Inject(ExtensionConfig) public config: C
    ) {}

    abstract onLoad(module: CoreModule): Observable<ExtensionResult<T>>;

    abstract onBuild(module: CoreModule, decorators: MetadataAndName<any>[]): Observable<void> | void;

    abstract onShutdown(module: CoreModule): ExtensionShutdown | void;

    /**
     * Helper to build an ExtensionValue used
     * in the onLoad method of an extension.
     *
     * @example
     * class CustomExtension extends Extension<string> {
     *    ...
     *    onLoad(module: CoreModule): Observable<ExtensionValue<string>> {
     *        return of('my value').pipe(
     *            flatMap(_ => this.setValue(_))
     *        );
     *    }
     *    ...
     * }
     *
     */
    setValue(value: T): Observable<ExtensionResult<T>> {
        return of({
            value,
            instance: this,
            token: this.constructor
        });
    }

}
