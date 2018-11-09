import { Extension } from '.';

export type TokenExt<T> = (Function & { prototype: T });

export interface ExtensionConfig {
    name?: string;
    port?: number;
    host?: string;
    uri?: string;
    type?: string;
}
export class ExtensionConfig {}

export interface ExtensionValue<T> {
    value: T;
    instance: Extension<T>;
    token: TokenExt<T>;
}

export interface ExtensionWithConfig<T> {
    token: TokenExt<T>;
    config: ExtensionConfig;
}
