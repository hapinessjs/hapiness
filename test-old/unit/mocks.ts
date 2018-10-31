import 'reflect-metadata';

import { CoreModule, HapinessModule, InjectionToken, Lib, ModuleLevel } from '../../src/core'

export class EmptyModule {
    onStart() {
    }
}

export class EmptyProvider {
}

export const coreModule: CoreModule = {
    token: EmptyModule,
    name: EmptyModule.name,
    version: '1',
    level: ModuleLevel.ROOT
};
export const InjToken = new InjectionToken('token');

@HapinessModule({
    version: '123'
})
export class ModuleWithMetadata {
}


@HapinessModule({
    version: '123',
    imports: [ ModuleWithMetadata ]
})
export class ModuleWithMetadataWithChild {
}

@HapinessModule({
    version: '123',
    exports: [ EmptyProvider ],
    providers: [ { provide: InjToken, useValue: 0 } ]
})
export class ModuleWithMetadataExportProvider {
}

@HapinessModule({
    version: '123',
    imports: [ ModuleWithMetadataExportProvider ]
})
export class ModuleWithMetadataWithChildThatExportProvider {
}

@Lib()
export class EmptyLib {
}
