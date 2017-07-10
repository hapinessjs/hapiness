import { suite, test } from 'mocha-typescript';
import * as unit from 'unit.js';
import { RouteMethodsEnum, enumByMethod } from '../../../src/extensions/http-server/enums';

@suite('Unit - HttpServer - Enums')
class Module {
    @test('Hook enum method')
    testHookEnumMethod() {

        unit.must(enumByMethod('get'))
            .is(RouteMethodsEnum.OnGet.toString());
        unit.must(enumByMethod('post'))
            .is(RouteMethodsEnum.OnPost.toString());
        unit.must(enumByMethod('put'))
            .is(RouteMethodsEnum.OnPut.toString());
        unit.must(enumByMethod('patch'))
            .is(RouteMethodsEnum.OnPatch.toString());
        unit.must(enumByMethod('options'))
            .is(RouteMethodsEnum.OnOptions.toString());
        unit.must(enumByMethod('delete'))
            .is(RouteMethodsEnum.OnDelete.toString());

        unit.exception(() => unit.when(() => enumByMethod('unknown')))
            .is(new Error('Method does not exist'));

    }
}
