import 'reflect-metadata';
import 'rxjs/add/observable/forkJoin';
import { HapinessModule, Type } from './decorators';
import { ExtentionHooksEnum, ModuleEnum } from './enums';
import { HookManager } from './hook';
import { CoreModule, CoreProvide, ModuleManager } from './module';
import * as Hoek from 'hoek';
import { Observable } from 'rxjs/Observable';
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

export interface OnExtensionLoad { onExtensionLoad(module: CoreModule, config: any): Observable<Extension> }
export interface OnModuleInstantiated { onModuleInstantiated(module: CoreModule): Observable<any> }

export class Hapiness {

    private static module: CoreModule;

    private static extensions: Extension[];

    public static bootstrap(module: Type<any>, extensions?: Array<Type<any> | ExtensionWithConfig>): Promise<{}> {
        return new Promise((resolve, reject) => {
            Hoek.assert(!!module, 'Please provide a module to bootstrap');
            Hoek.assert(typeof module === 'function', 'Wrong module to bootstrap');
            debug(`bootstrapping ${module.name}`);
            this.module = ModuleManager.resolveModule(module);
            const extensionsObs = extensions
                .map(ext => this.toExtensionWithConfig(ext))
                .map(ext => this.loadExtention(ext));
            Observable.forkJoin(extensionsObs).subscribe(results => {
                this.extensions = results;
                const providers = this.extensions.map(ext => {
                    return <CoreProvide>{ provide: ext.token, useValue: ext.value };
                });
                ModuleManager.instantiateModule(this.module, providers).subscribe(() => {
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
                    ).subscribe(_ => resolve(), _ => reject(_));
                }, _ => reject(_));
            }, err => {
                ModuleManager.instantiateModule(this.module).subscribe(_ => {
                    HookManager.triggerHook(ModuleEnum.OnError.toString(), this.module.token, this.module.instance, [ err ], false);
                    reject(err);
                }, _ => reject(_));
            });
        });
    }

    private static toExtensionWithConfig(extension): ExtensionWithConfig {
        if (extension && <ExtensionWithConfig>extension.token) {
            return <ExtensionWithConfig>extension;
        }
        return {
            token: <Type<any>>extension,
            config: {}
        };
    }

    private static loadExtention(extension: ExtensionWithConfig): Observable<any> {
        debug(`loading ${extension.token.name}`);
        const instance = Reflect.construct(extension.token, []);
        return HookManager.triggerHook(ExtentionHooksEnum.OnExtensionLoad.toString(),
            extension.token, instance, [ this.module, extension.config ]);
    }

    private static moduleInstantiated(extension: Extension): Observable<any> {
        debug('moduleInstantiated', extension.token.name);
        return HookManager.triggerHook(ExtentionHooksEnum.OnModuleInstantiated.toString(),
            extension.token, extension.instance, [ this.module ]);
    }
}
