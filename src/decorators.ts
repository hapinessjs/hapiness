import 'reflect-metadata';
import * as Joi from 'joi';
import { TypeDecorator, makeDecorator } from 'injection-js/util/decorators';
import { Type } from 'injection-js/facade/type';

/**
 * Type of the HapinessModule decorator / constructor function.
 *
 * @stable
 */
export interface HapinessModuleDecorator {
  (obj: HapinessModule): TypeDecorator;
  new (obj: HapinessModule): HapinessModule;
}

/**
 * Type of the HapinessModule metadata.
 *
 * @stable
 */
export interface HapinessModule {
    version: string;
    options?: Object;
    declarations?: Array<any>;
    providers?: Array<Type<any>|any[]>;
    imports?: Array<Type<any>|any[]>;
    exports?: Array<Type<any>|any[]>;
}

/**
 * HapinessModule decorator and metadata.
 *
 * @stable
 * @Annotation
 */
export const HapinessModule: HapinessModuleDecorator = <HapinessModuleDecorator>makeDecorator('HapinessModule', {
    version: undefined,
    options: undefined,
    imports: undefined,
    declarations: undefined,
    providers: undefined,
    exports: undefined
});
