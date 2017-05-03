/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
"use strict";
var decorators_1 = require('./util/decorators');
/**
 * Inject decorator and metadata.
 *
 * @stable
 * @Annotation
 */
exports.Inject = decorators_1.makeParamDecorator('Inject', [['token', undefined]]);
/**
 * Optional decorator and metadata.
 *
 * @stable
 * @Annotation
 */
exports.Optional = decorators_1.makeParamDecorator('Optional', []);
/**
 * Injectable decorator and metadata.
 *
 * @stable
 * @Annotation
 */
exports.Injectable = decorators_1.makeDecorator('Injectable', []);
/**
 * Self decorator and metadata.
 *
 * @stable
 * @Annotation
 */
exports.Self = decorators_1.makeParamDecorator('Self', []);
/**
 * SkipSelf decorator and metadata.
 *
 * @stable
 * @Annotation
 */
exports.SkipSelf = decorators_1.makeParamDecorator('SkipSelf', []);
/**
 * Host decorator and metadata.
 *
 * @stable
 * @Annotation
 */
exports.Host = decorators_1.makeParamDecorator('Host', []);
//# sourceMappingURL=metadata.js.map