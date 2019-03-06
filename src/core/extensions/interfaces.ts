import { Extension } from '.';

export type TokenExt<T> = (Function & { prototype: T });

export interface ExtensionConfig {
    extension_name?: string;
    port?: number;
    host?: string;
    uri?: string;
}
export class ExtensionConfig {}

export interface ExtensionResult<T> {
    value: T;
    instance: Extension<T>;
    token: TokenExt<T>;
}

export interface ExtensionWithConfig<T> {
    token: TokenExt<T>;
    config: ExtensionConfig;
}

export type ExtensionToLoad<T> = TokenExt<T> | ExtensionWithConfig<T>;
