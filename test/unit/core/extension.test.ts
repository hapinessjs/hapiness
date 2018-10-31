import 'reflect-metadata';
import { HttpServerExt } from '../../../src/extensions/http-server-2/extension';
import { Extension } from '../../../src/core/extensions';

test('Test !', () => {
    const instance = Extension.instantiate(HttpServerExt);

    instance.onLoad(<any>{}, <any>{}).subscribe(_ => {
        console.log(_.value ? 'VALUE OK' : 'NOK')
        console.log(instance['value'] ? 'VALUE OK' : 'NOK')
    });
})
