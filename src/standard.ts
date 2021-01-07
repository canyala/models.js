export interface Function_0<TResult> {
    (): TResult;
}

export interface Function_1<TResult,T1> {
    (a1: T1): TResult;
}

export interface Function_2<TResult,T1, T2> {
    (a1: T1, a2: T2): TResult;
}

export interface Action_0 {
    (): void;
}

export interface Action_1<T1> {
    (a1: T1): void;
}

export interface Action_2<T1,T2> {
    (a1: T1, a2: T2): void;
}

export interface Predicate_0 {
    (): boolean;
}

export interface Predicate_1<T1> {
    (a1: T1): boolean;
}

export interface Predicate_2<T1, T2> {
    (a1: T1, a2: T2): boolean;
}

export interface Disposable {
    dispose: Action_0;
}

export interface Dictionary<T> {
    [key: string]: T;
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function intersection(setA: Set<string>, setB: Set<string>): Set<string> {
    let _intersection = new Set<string>();
    for (let elem of setB) {
        if (setA.has(elem)) {
            _intersection.add(elem);
        }
    }
    return _intersection;
}

/**
 * Test for deep equality of a:T and b:T
 */
export function isEqual<T>(a: T, b: T): boolean {

    const _a: any = a;
    const _b: any = b;

    if (typeof _a === 'function') {
        const errMsg = 'isEqual comparison of a function, probably not intended?';
        console.error(errMsg);
        throw new Error(errMsg); 
    }

    if (typeof _b === 'function') {
        const errMsg = 'isEqual comparison of a function, probably not intended?';
        console.error(errMsg);
        throw new Error(errMsg);
    }

    if (_a === _b) {
        return true;  // typed reference equal or value equal
    } else if (_a.getTime && _b.getTime) {
        return _a.getTime() === _b.getTime(); // if dates, compare milliseconds since the unix epoch
    }

    if (Array.isArray(_a) && Array.isArray(_b)) {

        if (_a.length !== _b.length) {
            return false;  // different lengths must not be equal
        }

        const length = Math.min(_a.length, _b.length); // we pick the smallest even though we know they are equal

        for (let i = 0; i < length; i++) {
            if (!isEqual(_a[i], _b[i])) {
                return false; // elements are not equal, must not be equal
            }
        }

        return true; // elements are equal, must be equal
    }

    if (typeof _a === 'object' && typeof _b === 'object') {

        let aKeys = new Set<string>(Object.keys(_a));
        let bKeys = new Set<string>(Object.keys(_b));
        let sharedKeys = intersection(aKeys, bKeys); // We only test shared keys

        if (sharedKeys.size < 1) {
            return false; // No shared keys must be not equal
        }

        for (let sharedKey of sharedKeys) {
            let aValue = _a[sharedKey];
            let bValue = _b[sharedKey];
            if (!isEqual(aValue, bValue)) {
                return false; // values not equal must be not equal
            }
        }

        return true; // all key values equal must be equal
    }

    return false; // not equal
}
