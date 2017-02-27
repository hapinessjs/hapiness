import { ReflectiveInjector } from 'injection-js';

export function buildInternalDI(providers: any[]) {
    return ReflectiveInjector.resolveAndCreate(providers);
}
