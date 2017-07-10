import { suite, test } from 'mocha-typescript';
import * as unit from 'unit.js';
import { ModuleManager, ModuleLevel, HapinessModule, InjectionToken } from '../../src/core';

@suite('Unit - Module')
class Module {

    @test('findNestedModule')
    test1() {

        const cm = {
            name: 'TestModule',
            modules: [{
                name: 'SubTestModule',
                parent: this
            }]
        }

        unit.must(ModuleManager.findNestedModule('TestModule', <any>cm))
            .equal(undefined);

        unit.must(ModuleManager.findNestedModule('SubTestModule', <any>cm).name)
            .is('SubTestModule');

    }

    @test('getElements')
    test2() {

        class Comp1 {}
        class Comp2 {}
        class Comp3 {}

        const cm = {
            name: 'TestModule',
            declarations: [ Comp1, Comp2 ],
            modules: [{
                name: 'SubTestModule',
                declarations: [ Comp3 ]
            }]
        }

        unit.array(ModuleManager.getElements(<any>cm, 'providers'))
            .is([]);

        unit.array(ModuleManager.getElements(<any>cm, 'declarations'))
            .is([ Comp3, Comp1, Comp2 ]);

        unit.error(ModuleManager.getElements, /You need to provide the element you want to get/);

    }

    @test('getModules')
    test3() {

        const cm = {
            name: 'TestModule',
            modules: [{
                name: 'SubTestModule',
                modules: [{
                    name: 'SubSubModule1'
                }, {
                    name: 'SubSubModule2'
                }]
            }]
        }

        unit.array(ModuleManager.getModules(<any>cm))
            .hasLength(4);

    }

    @test('coreModuleFromMetadata')
    test4() {

        class ModuleTest {}
        class ServiceTest {}

        const data = {
            version: '1.0.0',
            exports: [],
            declarations: [ 'declaration' ]
        };

        const module = {
            module: ModuleTest,
            providers: [ ServiceTest ]
        };

        unit.object(ModuleManager['coreModuleFromMetadata'](data, <any>module))
            .is({
                parent: undefined,
                token: ModuleTest,
                name: 'ModuleTest',
                version: '1.0.0',
                exports: [],
                declarations: [ 'declaration' ],
                providers: [{ provide: ServiceTest, useClass: ServiceTest }],
                level: ModuleLevel.ROOT
            });

    }

    @test('metadataFromModule')
    test5() {

        @HapinessModule({
            version: 'xxx',
        })
        class ModuleTest {}

        unit.object(ModuleManager['metadataFromModule'](ModuleTest))
            .contains({
                version: 'xxx',
                declarations: undefined,
                providers: undefined,
                imports: undefined,
                exports: undefined
            });

    }

    @test('collectProviders - extractExportedProviders')
    test6() {

        class Service1 {}
        class Service2 {}
        class Service3 {}
        const token = new InjectionToken('config');

        const module = {
            providers: [ Service1 ],
            modules: [{
                exports: [ Service3 ],
                providers: [{ provide: token, useValue: 'test' }]
            }]
        };

        const providers = [
            { provide: Service2, useClass: Service2 }
        ];

        unit.array(ModuleManager['collectProviders'](<any>module, providers))
            .is([
                Service1,
                { provide: Service2, useClass: Service2 },
                Service3,
                { provide: token, useValue: 'test' }
            ]);

    }

}
