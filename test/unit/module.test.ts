import { suite, test } from 'mocha-typescript';
import { ModuleManager } from '../../src/core/module';
import { ModuleLevel } from '../../src/core/enums';
import { HapinessModule, Lib } from '../../src/core/decorators';
import { DependencyInjection } from '../../src/core/di';
import { Observable } from 'rxjs';
import * as unit from 'unit.js';

import {
    EmptyProvider,
    EmptyModule,
    coreModule,
    InjToken,
    ModuleWithMetadata,
    ModuleWithMetadataWithChild,
    ModuleWithMetadataWithChildThatExportProvider,
    EmptyLib
} from './mocks';

@suite('Unit - Module')
export class ModuleTestSuite {

    @test('toCoreProvider - provide Class and must return CoreProvide')
    testToCoreProvider1() {

        unit
            .value(ModuleManager.toCoreProvider(EmptyProvider))
            .is({ provide: EmptyProvider, useClass: EmptyProvider });

    }

    @test('toCoreProvider - provide CoreProvide and must return CoreProvide')
    testToCoreProvider2() {

        unit
            .value(ModuleManager.toCoreProvider({ provide: EmptyProvider, useClass: EmptyProvider }))
            .is({ provide: EmptyProvider, useClass: EmptyProvider });

    }

    @test('coreModuleParentConfigProviders - with no parent must return the module with same providers')
    testCoreModuleParentConfigProviders1() {

        unit
            .object(ModuleManager['coreModuleParentConfigProviders'](coreModule).providers)
            .is([]);

    }

    @test('coreModuleParentConfigProviders - with parent must return the module with InjectionToken providers')
    testCoreModuleParentConfigProviders2() {

        const module = Object.assign({
            parent: {
                providers: [ { provide: InjToken, useClass: EmptyProvider } ]
            }
        }, coreModule);

        unit
            .object(ModuleManager['coreModuleParentConfigProviders'](module).providers)
            .is([{ provide: InjToken, useClass: EmptyProvider }]);

    }

    @test('metadataToCoreModule - must return an Observable of CoreModule whithout parent')
    testMetadataToCoreModule1() {

        const metadata = {
            version: '1',
        };
        const cmwp = {
            module: EmptyModule,
            providers: [ { provide: InjToken, useClass: EmptyProvider } ]
        };

        ModuleManager['metadataToCoreModule'](metadata, cmwp)
            .subscribe(
                _ => unit
                    .value(_)
                    .is({
                        parent: undefined,
                        token: EmptyModule,
                        name: 'EmptyModule',
                        version: '1',
                        exports: [],
                        declarations: [],
                        providers: [ { provide: InjToken, useClass: EmptyProvider } ],
                        level: ModuleLevel.ROOT
                    })
            );

    }

    @test('metadataToCoreModule - must return an Observable of CoreModule with ROOT parent')
    testMetadataToCoreModule2() {

        const metadata = {
            version: '1',
        };
        const cmwp = {
            module: EmptyModule,
            providers: [ { provide: InjToken, useClass: EmptyProvider } ]
        };

        ModuleManager['metadataToCoreModule'](metadata, cmwp, coreModule)
            .subscribe(
                _ => unit
                    .value(_)
                    .is({
                        parent: coreModule,
                        token: EmptyModule,
                        name: 'EmptyModule',
                        version: '1',
                        exports: [],
                        declarations: [],
                        providers: [ { provide: InjToken, useClass: EmptyProvider } ],
                        level: ModuleLevel.PRIMARY
                    })
            );

    }

    @test('metadataToCoreModule - must return an Observable of CoreModule with PRIMARY parent')
    testMetadataToCoreModule3() {

        const metadata = {
            version: '1',
        };
        const cmwp = {
            module: EmptyModule,
            providers: [ { provide: InjToken, useClass: EmptyProvider } ]
        };
        const module = Object.assign({}, coreModule, { level: ModuleLevel.PRIMARY });

        ModuleManager['metadataToCoreModule'](metadata, cmwp, module)
            .subscribe(
                _ => unit
                    .value(_)
                    .is({
                        parent: module,
                        token: EmptyModule,
                        name: 'EmptyModule',
                        version: '1',
                        exports: [],
                        declarations: [],
                        providers: [ { provide: InjToken, useClass: EmptyProvider } ],
                        level: ModuleLevel.SECONDARY
                    })
            );

    }

    @test('extractMetadata - must return an Observable of HapinessModule')
    testExtractMetadata1() {

        const stub = unit
            .stub(require('../../src/core/metadata'), 'extractMetadataByDecorator')
            .withArgs(ModuleWithMetadata)
            .returns(<HapinessModule>{ version: '123' });

        ModuleManager['extractMetadata'](ModuleWithMetadata)
            .subscribe(
                _ => unit
                    .value(_)
                    .is({ version: '123' })
            );
        stub.parent.restore();

    }

    @test('extractMetadata - must return an Observable with error')
    testExtractMetadata2() {

        const stub = unit
            .stub(require('../../src/core/metadata'), 'extractMetadataByDecorator')
            .withArgs(null).returns(null)
            .withArgs(EmptyModule).returns(null);

        ModuleManager['extractMetadata'](null)
            .subscribe(
                _ => {},
                _ => unit
                    .object(_)
                    .isInstanceOf(Error)
                    .hasProperty('message', 'Module \'null\' resolution failed: No metadata')
            );

        ModuleManager['extractMetadata'](EmptyModule)
            .subscribe(
                _ => {},
                _ => unit
                    .object(_)
                    .isInstanceOf(Error)
                    .hasProperty('message', 'Module \'EmptyModule\' resolution failed: No metadata')
            );
        stub.parent.restore();

    }

    @test('toCoreModuleWithProviders - provide a Class and must return an CoreModuleWithProviders')
    testToCoreModuleWithProviders1() {

        unit
            .value(ModuleManager['toCoreModuleWithProviders'](EmptyModule))
            .is({ module: EmptyModule, providers: [] });

    }

    @test('toCoreModuleWithProviders - provide a CoreModuleWithProviders and must return an CoreModuleWithProviders')
    testToCoreModuleWithProviders2() {

        unit
            .value(ModuleManager['toCoreModuleWithProviders']({ module: EmptyModule, providers: [] }))
            .is({ module: EmptyModule, providers: [] });

    }

    @test('resolution - provide a Class module with metadata that got 1 child and ' +
            'must return an Observable of CoreModule with a child module')
    testResolution1() {

        ModuleManager['resolution'](ModuleWithMetadataWithChild)
            .subscribe(
                _ => {
                    unit
                        .object(_)
                        .hasProperty('name', 'ModuleWithMetadataWithChild');

                    unit
                        .array(_.modules)
                        .hasLength(1);

                    unit
                        .object(_.modules.pop())
                        .hasProperty('name', 'ModuleWithMetadata');
                }
            );

    }

    @test('collectProviders - provide a CoreModule and must return array of CoreProvide')
    testCollectProviders1() {

        const cmodule = Object.assign({}, coreModule, { providers: [{ provide: EmptyModule, useClass: EmptyModule }] });
        const stub = unit
            .stub(ModuleManager, 'extractExportedProviders')
            .withArgs(cmodule)
            .returns([]);

        unit
            .array(ModuleManager['collectProviders'](cmodule))
            .hasLength(1)
            .is([{ provide: EmptyModule, useClass: EmptyModule }]);

        stub.parent.restore();

    }

    @test('extractExportedProviders - provide a CoreModule and must return array of CoreProvide exported by children')
    testExtractExportedProviders1() {

        ModuleManager
            .resolve(ModuleWithMetadataWithChildThatExportProvider)
            .subscribe(
                _ => {
                    unit
                        .array(ModuleManager['extractExportedProviders'](_))
                        .hasLength(2)
                        .is([
                            { provide: EmptyProvider, useClass: EmptyProvider },
                            { provide: InjToken, useValue: 0 }
                        ]);
                }
            );

    }

    @test('instantiation - provide a CoreModule and must return an Observable of CoreModule with di and instance')
    testInstantiation1() {

        ModuleManager
            .resolve(ModuleWithMetadataWithChild)
            .flatMap(_ => ModuleManager.instantiate(_))
            .subscribe(
                _ => {
                    unit
                        .object(_)
                        .hasProperty('di');
                    unit
                        .object(_.instance)
                        .isInstanceOf(ModuleWithMetadataWithChild);
                }
            );

    }

    @test('getModules - provide a CoreModule and must return array of module')
    testGetModules1() {

        const module = Object.assign({}, coreModule, { modules: {} });

        unit
            .array(ModuleManager.getModules(module))
            .is([ module, {} ]);

    }

    @test('instantiateLibs - provide a CoreModule and must return an Observable of CoreModule')
    testInstantiateLibs1() {

        const module = Object.assign({}, coreModule, { declarations: [ EmptyLib ], di: { stub: true } });
        const stub = unit
            .stub(DependencyInjection, 'instantiateComponent')
            .withArgs(EmptyLib, { stub: true })
            .returns(Observable.of(null))

        ModuleManager['instantiateLibs'](module)
            .subscribe(_ =>
                unit
                    .object(_)
                    .is(module)
            );

        stub.parent.restore();

    }

    @test('instantiateLibs - provide a CoreModule and must thrown an error')
    testInstantiateLibs2() {

        @Lib()
        class LibWithError {
            constructor() {
                throw new Error('Oops');
            }
        }

        const module = Object.assign({}, coreModule, { declarations: [ LibWithError ], di: { stub: true } });
        const stub = unit
            .stub(DependencyInjection, 'instantiateComponent')
            .withArgs(LibWithError, { stub: true })
            .returns(Observable.of(null))

        ModuleManager['instantiateLibs'](module)
            .subscribe(
                null,
                _ => unit
                    .object(_)
                    .isInstanceOf(Error)
                    .hasProperty('message', 'Oops')
            );

        stub.parent.restore();

    }
}
