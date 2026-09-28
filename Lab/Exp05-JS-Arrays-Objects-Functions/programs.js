// Further programs: the array, object and function features the lab is about,
// beyond the manual's two starter scripts. Run with `node programs.js`.

// ---------- Arrays ----------
console.log('--- Array methods ---');
const marks = [72, 91, 58, 84, 66];
console.log('marks:', marks);
console.log('length:', marks.length, '| first:', marks[0], '| last:', marks.at(-1));
console.log('map (+5 grace):', marks.map(m => m + 5));
console.log('filter (>= 70):', marks.filter(m => m >= 70));
console.log('reduce (total):', marks.reduce((sum, m) => sum + m, 0));
console.log('find (first < 60):', marks.find(m => m < 60));
console.log('findIndex (91):', marks.findIndex(m => m === 91));
console.log('some (> 90)?', marks.some(m => m > 90), '| every (> 50)?', marks.every(m => m > 50));
console.log('includes(84)?', marks.includes(84), '| indexOf(66):', marks.indexOf(66));
console.log('sorted copy (asc):', [...marks].sort((a, b) => a - b), '| original kept:', marks);
console.log('slice(1, 3):', marks.slice(1, 3));

const stack = ['a', 'b', 'c'];
stack.pop();            // remove from end
stack.unshift('z');     // add to start
stack.shift();          // remove from start
stack.splice(1, 0, 'x'); // insert at index 1
console.log('after pop/unshift/shift/splice:', stack);
console.log('join:', stack.join(' - '), '| concat:', stack.concat(['d', 'e']));
console.log('2-D array:', [[1, 2], [3, 4]], '| flat:', [[1, 2], [3, 4]].flat());
console.log('Array.from("abc"):', Array.from('abc'), '| Array.isArray:', Array.isArray(stack));

// ---------- Objects ----------
console.log('\n--- Objects ---');
const course = {
    code: 'CSFS3008P',
    title: 'Backend Development',
    credits: 4,
    topics: ['Node.js', 'Express', 'MongoDB'],
    instructor: { name: 'Dr. Prateek Raj Gautam' },
    describe() {                         // method: `this` is the object
        return `${this.code} — ${this.title} (${this.credits} credits)`;
    }
};
console.log('dot vs bracket:', course.title, '|', course['code']);
console.log('nested:', course.instructor.name, '| method:', course.describe());
console.log('keys:', Object.keys(course));
console.log('values (first 3):', Object.values(course).slice(0, 3));
console.log('entries (first 2):', Object.entries(course).slice(0, 2));
console.log('"credits" in course?', 'credits' in course, '| hasOwn("room")?', Object.hasOwn(course, 'room'));

const { title, credits, ...rest } = course;          // destructuring + rest
console.log('destructured:', title, credits, '| rest keys:', Object.keys(rest));

const updated = { ...course, credits: 5 };            // spread copy
console.log('spread copy credits:', updated.credits, '| original:', course.credits);

delete updated.topics;
console.log('after delete topics:', 'topics' in updated);

const frozen = Object.freeze({ version: 1 });
frozen.version = 2;                                    // ignored outside strict mode
console.log('frozen.version still:', frozen.version);

const json = JSON.stringify({ title, credits });
console.log('JSON.stringify:', json, '| JSON.parse back:', JSON.parse(json));

for (const [key, value] of Object.entries({ a: 1, b: 2 })) {
    console.log(`  entry ${key} = ${value}`);
}

// Constructor function and class produce objects of a "type".
function Point(x, y) { this.x = x; this.y = y; }
Point.prototype.toString = function () { return `(${this.x}, ${this.y})`; };
class Student {
    constructor(name, sapId) { this.name = name; this.sapId = sapId; }
    badge() { return `${this.name} #${this.sapId}`; }
}
console.log('constructor fn:', String(new Point(2, 3)), '| class:', new Student('Suryansh', 590012069).badge());

// ---------- Functions ----------
console.log('\n--- Functions ---');
function add(a, b) { return a + b; }                   // declaration (hoisted)
const multiply = function (a, b) { return a * b; };    // expression
const square = n => n * n;                             // arrow
function power(base, exp = 2) { return base ** exp; }  // default parameter
function sumAll(...nums) { return nums.reduce((s, n) => s + n, 0); } // rest
console.log('add:', add(2, 3), '| multiply:', multiply(4, 5), '| square:', square(6));
console.log('power(3):', power(3), '| power(2, 10):', power(2, 10), '| sumAll(1..5):', sumAll(1, 2, 3, 4, 5));

function makeCounter() {                               // closure keeps `count` private
    let count = 0;
    return { increment: () => ++count, value: () => count };
}
const counter = makeCounter();
counter.increment(); counter.increment();
console.log('closure counter:', counter.value());

function applyTwice(fn, x) { return fn(fn(x)); }       // higher-order: takes a function
console.log('applyTwice(square, 3):', applyTwice(square, 3));

const times = factor => n => n * factor;               // returns a function
console.log('times(3)(7):', times(3)(7));

function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); } // recursion
console.log('factorial(6):', factorial(6));

const iife = (function () { return 'ran immediately'; })();
console.log('IIFE:', iife);

function fetchGrade(score, callback) {                 // callback style
    callback(score >= 60 ? 'pass' : 'fail');
}
fetchGrade(72, result => console.log('callback result:', result));

console.log('typeof add:', typeof add, '| add.length (params):', add.length, '| name:', multiply.name);
