/// <reference types="node" />
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export declare const ERROR_TYPE: string;
export declare const ERROR_COMPONENT_TYPE: string;
export declare const ERROR_DEBUG_CONTEXT: string;
export declare const ERROR_ORIGINAL_ERROR: string;
export declare function getType(error: Error): Function;
export declare function getDebugContext(error: Error): any;
export declare function getOriginalError(error: Error): Error;
export declare function wrappedError(message: string, originalError: any): Error;
