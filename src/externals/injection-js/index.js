/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
/**
 * @module
 * @description
 * The `di` module provides dependency injection container services.
 */
__export(require('./metadata'));
var forward_ref_1 = require('./forward_ref');
exports.forwardRef = forward_ref_1.forwardRef;
exports.resolveForwardRef = forward_ref_1.resolveForwardRef;
var injector_1 = require('./injector');
exports.Injector = injector_1.Injector;
var reflective_injector_1 = require('./reflective_injector');
exports.ReflectiveInjector = reflective_injector_1.ReflectiveInjector;
var reflective_provider_1 = require('./reflective_provider');
exports.ResolvedReflectiveFactory = reflective_provider_1.ResolvedReflectiveFactory;
var reflective_key_1 = require('./reflective_key');
exports.ReflectiveKey = reflective_key_1.ReflectiveKey;
var injection_token_1 = require('./injection_token');
exports.InjectionToken = injection_token_1.InjectionToken;
exports.OpaqueToken = injection_token_1.OpaqueToken;
var decorators_1 = require('./util/decorators');
exports.Class = decorators_1.Class;
//# sourceMappingURL=index.js.map