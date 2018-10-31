import { Type, extractMetadataByDecorator } from '.';

export interface Component<T> {
    token: Type<any>,
    metadata: T
}

export class ExtensionToolkit {

    private static metadataFromDeclarations<T>(type: string): Component<T>[] {
        const declarations: Type<any>[] = [];
        return declarations
            .filter(_ => !!_ && !!extractMetadataByDecorator(_, type))
            .map(_ => ({ token: _, metadata: extractMetadataByDecorator<T>(_, type) }));
    }

    public static components<T>(type: string): Component<T>[] {
        return this.metadataFromDeclarations(type);
    }

}
