import 'reflect-metadata';
import * as Joi from 'joi';
import { TypeDecorator, makeDecorator } from 'injection-js/util/decorators';

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
    import?: Array<any>;
    declarations?: Array<any>;
    providers?: Array<any>;
    exports?: Array<any>;
}


export function HapinessModuleValidator(metadata): Joi.ValidationResult<any> {
    return Joi.validate(metadata, Joi.object().keys({
        version: Joi.string().required(),
        options: Joi.object(),
        import: Joi.array(),
        declarations: Joi.array(),
        providers: Joi.array(),
        exports: Joi.array()
    }));
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
    import: undefined,
    declarations: undefined,
    providers: undefined,
    exports: undefined
});
