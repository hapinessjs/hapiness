export function cleanArray<T>(array: Array<T>): Array<T> {
    return [].concat(array).filter(_ => !!_);
}
