export enum ExtensionHooksEnum {
    OnLoad = <any>'onLoad',
    OnBuild = <any>'onBuild',
    OnShutdown = <any>'onShutdown'
}

export enum ModuleEnum {
    OnStart = <any>'onStart',
    OnError = <any>'onError',
    OnRegister = <any>'onRegister'
}

/**
 * Represents the position where
 * the module is instantiate
 */
export enum ModuleLevel {
    ROOT,
    PRIMARY,
    SECONDARY
}

export enum ExtensionShutdownPriority {
    IMPORTANT,
    NORMAL
}

export enum ExtensionType {
    DEFAULT,
    CONFIG,
    LOGGING
}
