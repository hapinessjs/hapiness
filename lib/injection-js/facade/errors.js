/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
"use strict";
exports.ERROR_TYPE = 'ngType';
exports.ERROR_COMPONENT_TYPE = 'ngComponentType';
exports.ERROR_DEBUG_CONTEXT = 'ngDebugContext';
exports.ERROR_ORIGINAL_ERROR = 'ngOriginalError';
function getType(error) {
    return error[exports.ERROR_TYPE];
}
exports.getType = getType;
function getDebugContext(error) {
    return error[exports.ERROR_DEBUG_CONTEXT];
}
exports.getDebugContext = getDebugContext;
function getOriginalError(error) {
    return error[exports.ERROR_ORIGINAL_ERROR];
}
exports.getOriginalError = getOriginalError;
function wrappedError(message, originalError) {
    var msg = message + " caused by: " + (originalError instanceof Error ? originalError.message : originalError);
    var error = Error(msg);
    error[exports.ERROR_ORIGINAL_ERROR] = originalError;
    return error;
}
exports.wrappedError = wrappedError;
//# sourceMappingURL=errors.js.map