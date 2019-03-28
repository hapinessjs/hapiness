import * as Client from 'phin';
import { Observable } from 'rxjs';
import { Type } from './decorators';
import { CoreProvide } from './interfaces';
import { DependencyInjection } from './di';
import { extractMetadataAndName } from './metadata';

export interface HTTPParams<T = any> {
    query?: { [key: string]: string };
    params?: { [key: string]: string };
    headers?: { [key: string]: string };
    body?: T;
}

export interface WrapValue<R = any> {
    status: number;
    headers: { [key: string]: string };
    value: R;
}

export type Response<R> = Observable<WrapValue<R>>;

export function wrap(provider: Type<any>): CoreProvide {
    return {
        provide: provider,
        useFactory: function(...args: any[]) {
            console.log('XXXX', args);
            return Reflect.construct(provider, args);
        },
        deps: DependencyInjection.getDeps(provider)
    };
}

export function isHTTPService(provider: Type<any>): boolean {
    const httpsvc = extractMetadataAndName(null, provider);
    return httpsvc && httpsvc.name === 'HTTPService';
}
