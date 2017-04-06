import { eModuleLifecycleHooks, ModuleLifecycleHook } from '../../src/module/hook';
import { test, suite } from 'mocha-typescript';
import * as unit from 'unit.js';
import * as Boom from 'boom';
import { HapinessModule, OnRegister } from '../../src';
import { ModuleBuilder } from '../../src/module';
import { ModuleOnStart } from './common/module.mock';

@suite('Module Hooks')
class Decorators {

    @test('Hook exists')
    testHookexists() {

        const result1 = ModuleLifecycleHook.hasLifecycleHook(eModuleLifecycleHooks.OnStart, ModuleOnStart);
        const result2 = ModuleLifecycleHook.hasLifecycleHook(eModuleLifecycleHooks.OnRegister, ModuleOnStart);
        unit.must(result1 && result2).equal(true);

    }

    @test('Hook is not implemented')
    testHookNotImpl() {

        const result1 = ModuleLifecycleHook.hasLifecycleHook(eModuleLifecycleHooks.OnModuleResolved, ModuleOnStart);
        const result2 = ModuleLifecycleHook.hasLifecycleHook(eModuleLifecycleHooks.OnError, ModuleOnStart);
        unit.must(result1 && result2).equal(false);

    }

    @test('Hook does not exist')
    testHookDoesnotExist() {

        unit.exception(() => unit.when(() => ModuleLifecycleHook.hasLifecycleHook(9, ModuleOnStart)))
            .is(Boom.create(500, 'Hook does not exist'));

    }

    @test('Trigger hook')
    testTriggerHook(done) {

        @HapinessModule({
            version: '1.0.0',
            options: { test: 'test' }
        })
        class ModuleHook implements OnRegister {
            onRegister() {
                done();
            }
        }

        const module = ModuleBuilder.buildModule(ModuleHook);
        ModuleLifecycleHook.triggerHook(eModuleLifecycleHooks.OnRegister, module, []);

    }

}
