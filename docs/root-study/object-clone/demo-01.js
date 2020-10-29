function canAssign(obj) {

    const basicDataType = [
        'string',
        'function',
        'number',
        'undefined',
        'boolean'
    ];

    return basicDataType.includes(typeof obj);
}

function canAssign_v2(obj) {

    const basicDataType = [
        'string',
        'function',
        'number',
        'undefined',
        'boolean'
    ];

    return basicDataType.includes(typeof obj) && !(obj instanceof Date) && obj !== null;
}

function clone(obj) {
    return Object.assign({}, obj);
}

function clone_v2(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = value;
    }
    return result;
}

function clone_v3(obj) {
    const result = {};
    for (const propertyName of Object.getOwnPropertyNames(obj)) {
        result[propertyName] = obj[propertyName];
    }
    return result;
}

function shallowClone(obj) {
    return Object.assign({}, obj); // 我们可以使用原生方法 Object.assign 来快速实现浅克隆
}


function deepClone(obj, deep = Infinity, objectStack = []) {

    if (deep <= 0 || objectStack.includes(obj)) {
        return null; // 停止克隆
    }

    if (obj instanceof Date) {
        return new Date(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(o => typeof o === 'object' ? deepClone(o, deep - 1, objectStack.concat([obj])) : o);
    }

    const result = shallowClone(obj);
    getKeyValues(result).forEach(
        ([key, value]) => {
            if (typeof value === 'object') {
                result[key] = deepClone(value, deep - 1, objectStack.concat([obj]));
            }
        }
    );
    return result;
}

const symbolMap = {
    'a1': Symbol('a1'),
    'a2': Symbol('a2'),
    'b': Symbol('b'),
    'c': Symbol('c'),
};

const b = {
    [symbolMap['c']]: 100,
    c: 200
};

const origin = {
    [symbolMap['a1']]: 'a1',
    [symbolMap['a2']]: 2,
    [symbolMap['b']]: b,
};

const result = deepClone(origin);

b[symbolMap['c']] = 300;
origin[symbolMap['a2']] = 3;

console.log(result[symbolMap['a2']]); // 3
console.log(result[symbolMap['b']][symbolMap['c']]); // 300 (not 100)


function getKeyValues(obj) {
    return [...Object.keys(obj), ...(Object.getOwnPropertySymbols(obj))].map(key => [key, obj[key]]);
}