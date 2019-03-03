// import { from, Observable, of, throwError } from 'rxjs';
// import {
//     catchError,
//     concatMap,
//     defaultIfEmpty,
//     filter,
//     flatMap,
//     ignoreElements,
//     map,
//     tap,
//     timeout,
//     toArray
// } from 'rxjs/operators';
// import { Type } from './decorators';
// import { ExtentionHooksEnum, ModuleEnum, ModuleLevel } from './enums';
// import { HookManager } from './hook';
// import { BootstrapOptions, CoreModule, ExtensionShutdown, CoreProvide } from './interfaces';
// import { InternalLogger } from './logger';
// import { ModuleManager } from './module';
// import { ShutdownUtils } from './shutdown';
// import { Extension, ExtensionValue, ExtensionWithConfig, ExtensionLogger, ExtensionConfig, TokenDI } from './extensions';
// import { cleanArray } from './utils';
// import { ReflectiveInjector } from 'injection-js';
// import { DependencyInjection } from './di';
// import * as Url from 'url';
// import { extractMetadataAndName } from './metadata';

// function extensionError(error: Error, name: string): Error {
//     error.message = `[${name}] ${error.message}`;
//     return error;
// }

// export class Hapiness {

// }

// export class Hapiness2 {

//     private static module: CoreModule;
//     private static extensions: ExtensionValue<any>[];
//     private static logger = new InternalLogger();
//     private static shutdownUtils = new ShutdownUtils();
//     private static defaultTimeout = 5000;

//     /**
//      * Entrypoint to bootstrap a module
//      * will load the extentions and trigger
//      * module's hooks
//      *
//      * @param  {Type<any>} module
//      * @param  {Array<Type<any>|ExtensionWithConfig>} extensions?
//      * @param  {BootstrapOptions} options?
//      * @returns Promise
//      */
//     public static bootstrap(module: Type<any>, extensions?: Array<Type<any> | ExtensionWithConfig<any>>,
//                             options: BootstrapOptions = {}): Promise<void> {

//         if (options.shutdown !== false) {
//             this.handleShutdownSignals();
//         }
//         this.logger.debug(`bootstrap begin for '${module.name}'`);
//         return new Promise((resolve, reject) => {
//             this
//                 .checkArg(module)
//                 .pipe(
//                     flatMap(_ => ModuleManager.resolve(_)),
//                     flatMap(_ => this.loadExtensions(extensions, _, options)),
//                     ignoreElements()
//                 )
//                 .subscribe(
//                     null,
//                     _ => {
//                         this.logger.debug(`bootstrap error catched [${_.message}]`);
//                         this
//                             .shutdown()
//                             .subscribe(
//                                 () => reject(_),
//                                 err => {
//                                     this.logger.debug(`bootstrap error catched [${err.message}], shutting down extensions...`);
//                                     reject(err);
//                                     process.exit(1);
//                                 }
//                             );
//                     },
//                     () => resolve()
//                 );
//         });
//     }

//     /**
//      * Force a shutdown
//      *
//      * @returns Observable
//      */
//     public static shutdown(): Observable<boolean> {
//         return this
//             .getShutdownHooks()
//             .pipe(
//                 flatMap(_ => this.shutdownUtils.shutdown(_))
//             );
//     }

//     private static handleShutdownSignals(): void {
//         this
//             .shutdownUtils
//             .events$
//             .pipe(
//                 flatMap(_ => this.shutdown())
//             )
//             .subscribe(
//                 _ => {
//                     this.logger.debug('process shutdown triggered');
//                     process.exit(0);
//                 },
//                 _ => {
//                     errorHandler(_);
//                     process.exit(1);
//                 }
//             );
//     }

//     /**
//      * Retrieve all shutdown hooks
//      *
//      * @returns ExtensionShutdown[]
//      */
//     private static getShutdownHooks(): Observable<ExtensionShutdown[]> {
//         return from([].concat(this.extensions).filter(e => !!e))
//             .pipe(
//                 filter(_ => !!_ && HookManager
//                     .hasLifecycleHook(
//                         ExtentionHooksEnum.OnShutdown.toString(),
//                         _.token
//                     )
//                 ),
//                 flatMap(_ => HookManager
//                     .triggerHook(
//                         ExtentionHooksEnum.OnShutdown.toString(),
//                         _.token,
//                         _.instance,
//                         [ module, _.value ]
//                     )
//                 ),
//                 toArray()
//             );
//     }

//     /**
//      * Load extensions
//      *
//      * @param  {Array<Type<any>|ExtensionWithConfig>} extensions
//      * @param  {CoreModule} moduleResolved
//      * @param  {BootstrapOptions} options?
//      * @returns Observable
//      */
//     private static loadExtensions(extensions: Array<Type<any> | ExtensionWithConfig<any>>,
//             moduleResolved: CoreModule, options: BootstrapOptions): Observable<void> {
//         return from(cleanArray(extensions)).pipe(
//             map(_ => this.toExtensionWithConfig(_)),
//             concatMap(ewc => this.buildDIExt(ewc).pipe(
//                 flatMap(_ => this.loadExtension(ewc, moduleResolved, _).pipe(
//                     timeout(options.extensionTimeout || this.defaultTimeout),
//                     catchError(err => throwError(extensionError(err, ewc.token.name)))
//                 ))
//             )),
//             toArray(),
//             flatMap(_ => this.instantiateModule(_, moduleResolved, options))
//         );
//     }

//     private static buildDIExt(ext: ExtensionWithConfig<any>): Observable<ReflectiveInjector> {
//         const conf = { name: ext.token.name };
//         const providers = cleanArray(this.extensions)
//             .filter(_ => !!_.instance.config.type)
//             .map(_ => (<CoreProvide>{ provide: TokenDI(_.instance.config.type), useValue: _.value }));

//         return DependencyInjection.createAndResolve(cleanArray(providers)
//             .concat([
//                 { provide: ExtensionConfig, useValue: Object.assign(conf, ext.config) },
//                 { provide: ExtensionLogger, useClass: ExtensionLogger }
//             ])
//         );
//     }

//     /**
//      * Instantiate module
//      *
//      * @param  {Extension[]} extensionsLoaded
//      * @param  {CoreModule} moduleResolved
//      * @param  {BootstrapOptions} options
//      * @returns Observable
//      */
//     private static instantiateModule(extensionsLoaded: ExtensionValue<any>[], moduleResolved: CoreModule,
//                                      options: BootstrapOptions): Observable<void> {
//         return from(extensionsLoaded)
//             .pipe(
//                 map(_ => ({ provide: _.token, useValue: _.value })),
//                 toArray(),
//                 flatMap(_ => ModuleManager.instantiate(moduleResolved, _)),
//                 flatMap(_ => this.callRegister(_)),
//                 flatMap(moduleInstantiated =>
//                     from(extensionsLoaded)
//                         .pipe(
//                             flatMap(_ => this
//                                 .moduleInstantiated(_, moduleInstantiated)
//                                 .pipe(
//                                     timeout(options.extensionTimeout || this.defaultTimeout),
//                                     catchError(err => throwError(extensionError(err, _.token.name)))
//                                 )
//                             ),
//                             toArray(),
//                             map(_ => moduleInstantiated)
//                         )
//                 ),
//                 tap(_ => this.module = _),
//                 flatMap(_ => this.callStart(_))
//             );
//     }

//     /**
//      * Call Register Hooks
//      *
//      * @param  {CoreModule} moduleInstantiated
//      * @returns Observable
//      */
//     private static callRegister(moduleInstantiated: CoreModule): Observable<CoreModule> {
//         return from(ModuleManager.getModules(moduleInstantiated))
//             .pipe(
//                 filter(_ => _.level !== ModuleLevel.ROOT),
//                 filter(_ => HookManager
//                     .hasLifecycleHook(ModuleEnum.OnRegister.toString(), _.token)
//                 ),
//                 flatMap(_ => HookManager
//                     .triggerHook(ModuleEnum.OnRegister.toString(), _.token, _.instance)
//                 ),
//                 toArray(),
//                 map(_ => moduleInstantiated)
//             );
//     }

//     /**
//      * Call Start Hooks
//      *
//      * @param  {CoreModule} moduleInstantiated
//      * @returns Observable
//      */
//     private static callStart(moduleInstantiated: CoreModule): Observable<void> {
//         return of(moduleInstantiated)
//             .pipe(
//                 flatMap(_ => HookManager
//                     .triggerHook(
//                         ModuleEnum.OnStart.toString(),
//                         _.token,
//                         _.instance,
//                         null,
//                         false
//                     )
//                 )
//             );
//     }

//     /**
//      * Check if the provided module
//      * is right
//      *
//      * @param  {Type<any>} module
//      * @returns Observable
//      */
//     private static checkArg(module: Type<any>): Observable<Type<any>> {
//         return of(module)
//             .pipe(
//                 tap(_ => this.module = null),
//                 tap(_ => this.extensions = null),
//                 flatMap(_ => !!_ ?
//                     of(_) :
//                     throwError(new Error('Bootstrap failed: no module provided'))
//                 ),
//                 flatMap(_ => typeof _ === 'function' ?
//                     of(_) :
//                     throwError(new Error('Bootstrap failed: module must be a function/class'))
//                 )
//             );
//     }

//     /**
//      * Convert an extension type to ExtensionWithConfig
//      *
//      * @param  {} extension
//      * @returns ExtensionWithConfig
//      */
//     private static toExtensionWithConfig(extension): ExtensionWithConfig<any> {
//         if (extension && <ExtensionWithConfig<any>>extension.token) {
//             return <ExtensionWithConfig<any>>extension;
//         }
//         return {
//             token: <Type<Extension<any>>>extension,
//             config: {}
//         };
//     }

//     /**
//      * Call the OnLoad hook
//      * of an extension
//      *
//      * @param  {ExtensionWithConfig} extension
//      * @param  {CoreModule} module
//      * @returns Observable
//      */
//     private static formatConfig(config: ExtensionConfig): string {
//         if (config.uri) {
//             return Url.parse(config.uri).host;
//         } else if (config.host) {
//             return config.host + (config.port ? `:${config.port}` : '');
//         }
//     }
//     private static loadExtension(extension: ExtensionWithConfig<any>, module: CoreModule,
//             di: ReflectiveInjector): Observable<ExtensionValue<any>> {
//         return of(<Extension<any>>Reflect.apply((<any>extension.token).instantiate, extension.token, [di])).pipe(
//             tap(_ => _.logger.info(`loading extension '${extension.token.name}'` +
//                 `${this.formatConfig(_.config) ? `, using ${this.formatConfig(_.config)}` : ''}`)),
//             flatMap(instance => HookManager
//                 .triggerHook(
//                     ExtentionHooksEnum.OnLoad.toString(),
//                     extension.token,
//                     instance,
//                     [ module, extension.config ]
//                 ).pipe(
//                     catchError(err => {
//                         // this.extensions = cleanArray(this.extensions).concat(instance);
//                         return this.shutdown().pipe(flatMap(() => throwError(err)))
//                     })
//                 )
//             ),
//             tap(_ => this.extensions = cleanArray(this.extensions).concat(_))
//         );
//     }

//     /**
//      * Call the OnModuleInstantiated hook
//      * of an extension
//      *
//      * @param  {Extension} extension
//      * @returns Observable
//      */
//     private static moduleInstantiated(extension: ExtensionValue<any>, module: CoreModule): Observable<void> {
//         extension.instance.logger.info(`extension '${extension.token.name}' is building`);
//         const decorators = extension.instance.decorators || [];
//         const metadata = ModuleManager.getModules(module)
//             .map(_ => _.declarations)
//             .reduce((a, c) => a.concat(c), <any>[])
//             .map(_ => extractMetadataAndName(_))
//             .filter(_ => decorators.indexOf(_.name) > -1);
//         return HookManager
//             .triggerHook(
//                 ExtentionHooksEnum.OnBuild.toString(),
//                 <Type<any>>extension.token,
//                 extension.instance,
//                 [ module, metadata ]
//             )
//             .pipe(
//                 tap(_ => this.logger.debug(`moduleInstantiated ${extension.token.name}`)),
//                 defaultIfEmpty(null)
//             );
//     }

// }

// /**
//  * Error handler
//  * Call onError of Root module
//  * Or log in console
//  *
//  * @param  {Error} error
//  * @param  {any} data
//  * @returns void
//  */
// export function errorHandler(error: Error, data?: any): void {
//     of(Hapiness[ 'module' ])
//         .pipe(
//             filter(_ => !!(_ && _.instance)),
//             flatMap(_ =>
//                 HookManager
//                     .hasLifecycleHook(ModuleEnum.OnError.toString(), _.token) ?
//                     HookManager
//                         .triggerHook(
//                             ModuleEnum.OnError.toString(),
//                             _.token,
//                             _.instance,
//                             [ error, data ],
//                             false
//                         ) :
//                     throwError(error)
//             )
//         )
//         .subscribe(null, _ => console.error(_));
// }
