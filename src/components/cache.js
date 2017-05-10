export const ONE_SECOND = 1000;

export class Cache {
    constructor() {
        this.cache = {};
    }
    add = (key, value, ttl = ONE_SECOND * 5) => {
        const now = new Date();
        this.cache[key] = {
            value,
            date: now,
            validUntil: new Date(now.getTime() + ttl),
        };
    };
    get = (key) => {
        if (this.cache[key] && new Date().getTime() < this.cache[key].validUntil.getTime()) {
            return this.cache[key].value;
        }
        if (this.cache[key] && new Date().getTime() > this.cache[key].validUntil.getTime()) {
            delete this.cache[key];
        }
        return;
    };
}
