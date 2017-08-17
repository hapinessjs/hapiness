import { Observable } from 'rxjs';
import { CoreModule, Extension, ExtensionWithConfig } from './interfaces';
import { InternalLogger } from './logger';
import { Type } from './decorators';
import { ExtentionHooksEnum, ModuleEnum } from './enums';
import { ModuleManager } from './module';
import { HookManager } from './hook';

export class Hapiness {

    private static module: CoreModule;

    private static extensions: Extension[];

    private static logger = new InternalLogger('bootstrap');

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
            this
                .checkArg(module)
                .flatMap(_ => ModuleManager.resolve(_))
                .flatMap(moduleResolved =>
                    Observable
                        .from([].concat(extensions).filter(_ => !!_))
                        .map(_ => this.toExtensionWithConfig(_))
                        .flatMap(_ => this.loadExtention(_))
                        .toArray()
                        .do(_ => this.extensions = _)
                        .flatMap(extensionsLoaded =>
                            Observable
                                .from(extensionsLoaded)
                                .map(_ => ({ provide: _.token, useValue: _.value }))
                                .toArray()
                                .flatMap(_ => ModuleManager.instantiate(moduleResolved, _))
                                .do(_ => this.module = _)
                                .flatMap(moduleInstanciated =>
                                    Observable
                                        .from(ModuleManager.getModules(moduleInstanciated))
                                        .filter(_ => !!_.parent)
                                        .filter(_ => HookManager
                                            .hasLifecycleHook(ModuleEnum.OnRegister.toString(), _.token)
                                        )
                                        .flatMap(_ => HookManager
                                            .triggerHook(ModuleEnum.OnRegister.toString(), _.token, _.instance)
                                        )
                                        .toArray()
                                        .flatMap(_ => HookManager.triggerHook(
                                            ModuleEnum.OnStart.toString(),
                                            moduleInstanciated.token,
                                            moduleInstanciated.instance,
                                            null,
                                            false
                                        ))
                                )
                        )
                )
                .subscribe(
                    _ => resolve(),
                    _ => reject(_)
                )
        });
    }

    private static checkArg(module: Type<any>): Observable<Type<any>> {
        return Observable
            .of(module)
            .flatMap(_ => !!_ ?
                Observable.of(_) :
                Observable.throw('Bootstrap failed: no module provided')
            )
            .flatMap(_ => typeof _ === 'function' ?
                Observable.of(_) :
                Observable.throw('Bootstrap failed: module must be a function/class')
            );
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
        return Observable
            .of(Reflect.construct(extension.token, []))
            .do(_ => this.logger.debug(`loading ${extension.token.name}`))
            .switchMap(instance =>
                HookManager
                    .triggerHook(
                        ExtentionHooksEnum.OnExtensionLoad.toString(),
                        extension.token,
                        instance,
                        [ this.module, extension.config ]
                    )
            );
    }

    /**
     * Call the OnModuleInstantiated hook
     * of an extension
     *
     * @param  {Extension} extension
     * @returns Observable
     */
    private static moduleInstantiated(extension: Extension): Observable<void> {
        return HookManager
            .triggerHook(
                ExtentionHooksEnum.OnModuleInstantiated.toString(),
                extension.token,
                extension.instance,
                [ this.module ]
            )
            .do(_ => this.logger.debug(`moduleInstantiated ${extension.token.name}`));
    }

}
