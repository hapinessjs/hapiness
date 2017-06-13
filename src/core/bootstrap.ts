import 'reflect-metadata';
import 'rxjs/add/observable/forkJoin';
import { ModuleManager, CoreModule } from './module';
import { ExtentionHooksEnum, ModuleEnum } from './enums';
import { Observable } from 'rxjs/Observable';
import { HapinessModule, Type } from './decorators';
import { HookManager } from './hook';
import * as Hoek from 'hoek';
const debug = require('debug')('hapiness:bootstrap');

export interface ExtentionWithConfig {
    token: Type<any>;
    config: any;
}

export interface Extention {
    instance: any;
}

export interface OnExtentionLoad { onExtentionLoad(module: CoreModule, config: any): Observable<Extention> }

export class Hapiness {

    private static module: CoreModule;

    private static extentions: Extention[];

    public static bootstrap(module: Type<any>, extentions?: Array<Type<any> | ExtentionWithConfig>): Promise<{}> {
        return new Promise((resolve, reject) => {
            Hoek.assert(!!module, 'Please provide a module to bootstrap');
            Hoek.assert(typeof module === 'function', 'Wrong module to bootstrap');
            debug(`bootstrapping ${module.name}`);
            this.module = ModuleManager.resolveModule(module);
            const extentionsObs = extentions
                .map(ext => this.toExtentionWithConfig(ext))
                .map(ext => this.loadExtention(ext));
            Observable.forkJoin(extentionsObs).subscribe(results => {
                this.extentions = results;
                ModuleManager.instantiateModule(this.module);
                HookManager.triggerHook(ModuleEnum.OnStart.toString(), this.module.token, this.module.instance);
                resolve();
            }, err => {
                ModuleManager.instantiateModule(this.module);
                HookManager.triggerHook(ModuleEnum.OnError.toString(), this.module.token, this.module.instance, [ err ]);
                reject(err);
            });
        });
    }

    private static toExtentionWithConfig(extention): ExtentionWithConfig {
        if (extention && <ExtentionWithConfig>extention.token) {
            return <ExtentionWithConfig>extention;
        }
        return {
            token: <Type<any>>extention,
            config: {}
        };
    }

    private static loadExtention(extention: ExtentionWithConfig): Observable<any> {
        debug(`loading ${extention.token.name}`);
        const instance = Reflect.construct(extention.token, []);
        return HookManager.triggerHook(ExtentionHooksEnum.OnExtentionLoad.toString(),
            extention.token, instance, [ this.module, extention.config ]);
    }
}
