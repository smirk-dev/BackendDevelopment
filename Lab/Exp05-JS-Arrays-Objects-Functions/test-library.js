// Assertions for the PBL functions — run with `node test-library.js`.
const assert = require('node:assert/strict');
const { library, addBook, findBook } = require('./library.js');

let passed = 0;
function test(name, fn) {
    fn();
    passed++;
    console.log('ok  -', name);
}

test('library starts as an empty array', () => {
    assert.ok(Array.isArray(library));
    assert.equal(library.length, 0);
});

test('addBook stores a book object and returns it', () => {
    const book = addBook('Clean Code', 'Robert C. Martin');
    assert.deepEqual(book, { id: 1, title: 'Clean Code', author: 'Robert C. Martin' });
    assert.equal(library.length, 1);
    assert.equal(library[0], book);
});

test('addBook trims input', () => {
    const book = addBook('  Refactoring ', ' Martin Fowler  ');
    assert.equal(book.title, 'Refactoring');
    assert.equal(book.author, 'Martin Fowler');
});

test('addBook rejects duplicates, blanks and non-strings', () => {
    assert.equal(addBook('clean code', 'Anyone'), null);
    assert.equal(addBook('', 'Anyone'), null);
    assert.equal(addBook('Title', '   '), null);
    assert.equal(addBook(42, 'Anyone'), null);
    assert.equal(library.length, 2);
});

test('findBook finds by exact title', () => {
    assert.equal(findBook('Refactoring').author, 'Martin Fowler');
});

test('findBook is case-insensitive and trims', () => {
    assert.equal(findBook('  CLEAN code ').id, 1);
});

test('findBook returns undefined when absent or given a non-string', () => {
    assert.equal(findBook('Missing'), undefined);
    assert.equal(findBook(null), undefined);
});

console.log(`\n${passed} tests passed`);
