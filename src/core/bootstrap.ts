import 'rxjs/add/observable/forkJoin';
import { HapinessModule, Type } from './decorators';
import { ExtentionHooksEnum, ModuleEnum } from './enums';
import { HookManager } from './hook';
import { CoreModule, CoreProvide, ModuleManager } from './module';
import * as Hoek from 'hoek';
import { Observable } from 'rxjs/Rx';
const debug = require('debug')('hapiness:bootstrap');

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
export interface OnModuleInstantiated { onModuleInstantiated(module: CoreModule): Observable<any> }

export class Hapiness {

    private static module: CoreModule;

    private static extensions: Extension[];

    /**
     * Entrypoint to bootstrap a module
     * will load the extentions and trigger
     * module's hooks
     *
     * @param  {Type<any>} module
     * @param  {Array<Type<any>|ExtensionWithConfig>} extensions?
     * @returns Promise
     */
    public static bootstrap(module: Type<any>, extensions?: Array<Type<any> | ExtensionWithConfig>): Promise<{}> {
        return new Promise((resolve, reject) => {
            Hoek.assert(!!module, 'Please provide a module to bootstrap');
            Hoek.assert(typeof module === 'function', 'Wrong module to bootstrap');
            debug(`bootstrapping ${module.name}`);
            this.module = ModuleManager.resolveModule(module);
            let errors = [];
            const extensionsObs = (extensions || [])
                .map(ext => this.toExtensionWithConfig(ext))
                .map(ext => this.loadExtention(ext))
                .map(ext => ext.catch(e => errors = errors.concat(e)));
            let _extensions = [];
            Observable.merge(...extensionsObs).subscribe(result => {
                _extensions = [].concat(_extensions, result).filter(_ => !(_ instanceof Error));
            }, /* istanbul ignore next */ _ => reject(_), () => {
                this.extensions = [].concat(_extensions).filter(_ => !!_);
                if (errors.length) {
                    reject(errors.shift());
                }
                const providers = this.extensions.map(ext => {
                    return <CoreProvide>{ provide: ext.token, useValue: ext.value };
                });
                ModuleManager.instantiateModule(this.module, providers).subscribe(instance => {
                    this.module = instance;
                    Observable.forkJoin(
                            ModuleManager.getModules(this.module)
                                .filter(m => !!m.parent)
                                .filter(m => HookManager.hasLifecycleHook(ModuleEnum.OnRegister.toString(), m.token))
                                .map(m => HookManager.triggerHook(ModuleEnum.OnRegister.toString(), m.token, m.instance))
                                .concat(
                                    HookManager.triggerHook(ModuleEnum.OnStart.toString(), this.module.token,
                                        this.module.instance, null, false)
                                )
                                .concat(this.extensions.map(ext => this.moduleInstantiated(ext)))
                    ).subscribe(_ => resolve(), _ => this.handleError(_, reject));
                }, /* istanbul ignore next */ _ => reject(_));
            });
        });
    }

    private static handleError(error: Error, reject) {
        debug('an error occured', error.message);
        ModuleManager.instantiateModule(this.module).subscribe(_ => {
            HookManager.triggerHook(ModuleEnum.OnError.toString(), _.token, _.instance, [ error ], false);
            reject(error);
        }, /* istanbul ignore next */ _ => reject(_));
    }

    /**
     * Convert an extension type to ExtensionWithConfig
     *
     * @param  {} extension
     * @returns ExtensionWithConfig
     */
    private static toExtensionWithConfig(extension): ExtensionWithConfig {
        if (extension && <ExtensionWithConfig>extension.token) {
            return <ExtensionWithConfig>extension;
        }
        return {
            token: <Type<any>>extension,
            config: {}
        };
    }

    /**
     * Call the OnExtensionLoad hook
     * of an extension
     *
     * @param  {ExtensionWithConfig} extension
     * @returns Observable
     */
    private static loadExtention(extension: ExtensionWithConfig): Observable<Extension> {
        debug(`loading ${extension.token.name}`);
        const instance = Reflect.construct(extension.token, []);
        return HookManager.triggerHook(ExtentionHooksEnum.OnExtensionLoad.toString(),
            extension.token, instance, [ this.module, extension.config ]);
    }

    /**
     * Call the OnModuleInstantiated hook
     * of an extension
     *
     * @param  {Extension} extension
     * @returns Observable
     */
    private static moduleInstantiated(extension: Extension): Observable<any> {
        debug('moduleInstantiated', extension.token.name);
        return HookManager.triggerHook(ExtentionHooksEnum.OnModuleInstantiated.toString(),
            extension.token, extension.instance, [ this.module ]);
    }
}
