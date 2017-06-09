import { ModuleBuilder } from './module';
import { ExtentionHooksEnum } from './enums';
import 'reflect-metadata';
import 'rxjs/add/observable/forkJoin';
import { Observable } from 'rxjs/Observable';
import { HapinessModule, Extention, Type } from './decorators';
import { HookManager } from './hook';
import * as Hoek from 'hoek';
const debug = require('debug')('hapiness:bootstrap');

export interface ExtentionWithConfig {
    token: Type<Extention>,
    config: any;
}

export interface OnExtentionLoad { onExtentionLoad(config: any): Observable<any> }

export class Hapiness {

    public static bootstrap(module: Type<any>, extentions?: Array<Type<any> | ExtentionWithConfig>): Promise<{}> {
        return new Promise((resolve, reject) => {
            Hoek.assert(!!module, 'Please provide a module to bootstrap');
            Hoek.assert(typeof module === 'function', 'Wrong module to bootstrap');
            debug(`bootstrapping ${module.name}`);
            const extentionsObs = extentions
                .map(ext => this.toExtentionWithConfig(ext))
                .map(ext => this.loadExtention(ext));
            Observable.forkJoin(extentionsObs).subscribe(() => {
                ModuleBuilder.buildModule(module);
                resolve();
            }, err => {
                reject(err);
            });
        });
    }

    private static toExtentionWithConfig(extention): ExtentionWithConfig {
        if (extention && <ExtentionWithConfig>extention.token) {
            return <ExtentionWithConfig>extention;
        }
        return {
            token: <Type<Extention>>extention,
            config: {}
        };
    }

    private static loadExtention(extention: ExtentionWithConfig): Observable<any> {
        debug(`loading ${extention.token.name}`);
        const instance = Reflect.construct(extention.token, []);
        return HookManager.triggerHook(ExtentionHooksEnum.OnExtentionLoaded, extention.token, instance, [ extention.config ]);
    }
}
