/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export interface BrowserNodeGlobal {
    Object: typeof Object;
    Array: typeof Array;
    Map: typeof Map;
    Set: typeof Set;
    Date: DateConstructor;
    RegExp: RegExpConstructor;
    JSON: typeof JSON;
    Math: any;
    assert(condition: any): void;
    Reflect: any;
    getAngularTestability: Function;
    getAllAngularTestabilities: Function;
    getAllAngularRootElements: Function;
    frameworkStabilizers: Array<Function>;
    setTimeout: Function;
    clearTimeout: Function;
    setInterval: Function;
    clearInterval: Function;
    encodeURI: Function;
}
declare const _global: BrowserNodeGlobal;
export { _global as global };
export declare function isPresent(obj: any): boolean;
export declare function stringify(token: any): string;
