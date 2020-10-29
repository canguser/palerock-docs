let data = {meta: {message: 'clone'}};
let data2 = {};
data2.meta = data.meta;

console.log(data2.meta.message); // clone

data.meta.message = 'clone reassign';

console.log(data2.meta.message); // clone reassign


let a = {
    number: 1,
    str: 'hello a',
    b: {
        number: 10,
        str: 'hello b'
    }
};

// using '='

let a1 = a;

console.log(a1.number); // 1;

a.number++;

console.log(a1.number); // 2;

// other

let a2 = shallowClone(a); // shallowClone 是实现浅克隆的方法，暂不关心他是怎么实现的

console.log(a2.number); // 2;
console.log(a2.b.number); // 10;

a.number++;
a.b.number++;

console.log(a2.number); // 2;
console.log(a2.b.number); // 11;
