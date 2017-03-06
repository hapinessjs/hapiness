import 'reflect-metadata';
import * as Joi from 'joi';
import { TypeDecorator, makeDecorator } from 'injection-js/util/decorators';
import { Type } from 'injection-js/facade/type';

/**
 * Type of the HapinessModule decorator / constructor function.
 */
export interface HapinessModuleDecorator {
  (obj: HapinessModule): TypeDecorator;
  new (obj: HapinessModule): HapinessModule;
}

/**
 * Type of the HapinessModule metadata.
 */
export interface HapinessModule {
    version: string;
    options?: Object;
    declarations?: Array<Type<any>|any>;
    providers?: Array<Type<any>|any>;
    imports?: Array<Type<any>|any>;
    exports?: Array<Type<any>|any>;
}

/**
 * HapinessModule decorator and metadata.
 *
 * @Annotation
 */
export const HapinessModule: HapinessModuleDecorator = <HapinessModuleDecorator>makeDecorator('HapinessModule', {
    version: undefined,
    options: undefined,
    declarations: undefined,
    providers: undefined,
    imports: undefined,
    exports: undefined
});
