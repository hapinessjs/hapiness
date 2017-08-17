import 'reflect-metadata';

import { CoreModule, ModuleLevel } from '../../src-2/core/interfaces'
import { InjectionToken, HapinessModule } from '../../src-2/core/decorators';

export class EmptyModule {}
export class EmptyProvider {}
export const coreModule: CoreModule = {
    token: EmptyModule,
    name: EmptyModule.name,
    version: '1',
    level: ModuleLevel.ROOT
}
export const InjToken = new InjectionToken('token');

@HapinessModule({
    version: '123'
})
export class ModuleWithMetadata {}


@HapinessModule({
    version: '123',
    imports: [ ModuleWithMetadata ]
})
export class ModuleWithMetadataWithChild {}

@HapinessModule({
    version: '123',
    exports: [ EmptyProvider ],
    providers: [{ provide: InjToken, useValue: 0 }]
})
export class ModuleWithMetadataExportProvider {}

@HapinessModule({
    version: '123',
    imports: [ ModuleWithMetadataExportProvider ]
})
export class ModuleWithMetadataWithChildThatExportProvider {}
