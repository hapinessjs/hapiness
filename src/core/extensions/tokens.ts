import * as Crypto from 'crypto';

export function TokenDI(key: string): string {
    const hash = Crypto.createHash('sha256');
    hash.update('ext-key-' + key);
    return hash.digest('hex');
}
