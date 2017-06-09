export class Enum {
    constructor(public value: string) {}
    toString() { return this.value; }
}

export class ExtentionHooksEnum extends Enum {
    static OnExtentionLoaded = 'onExtentionLoaded';
}
