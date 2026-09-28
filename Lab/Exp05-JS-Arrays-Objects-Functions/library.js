// PBL Activity — a small in-memory library.
// Each book is an object; the library is an array of those objects.

// 1. The collection
const library = [];

// 2. addBook(title, author) — create a book object and add it to the array.
//    Returns the stored book, or null if the input is unusable or a duplicate.
function addBook(title, author) {
    if (typeof title !== 'string' || typeof author !== 'string') return null;
    title = title.trim();
    author = author.trim();
    if (!title || !author) return null;
    if (findBook(title)) return null;          // one copy per title

    const book = { id: library.length + 1, title, author };
    library.push(book);
    return book;
}

// 3. findBook(title) — search the array for a book object by title.
//    Case-insensitive and ignores surrounding spaces; undefined when absent.
function findBook(title) {
    if (typeof title !== 'string') return undefined;
    const wanted = title.trim().toLowerCase();
    return library.find(book => book.title.toLowerCase() === wanted);
}

// 4. Test with Node.js — `node library.js` runs this block; `require()` does not.
if (typeof module !== 'undefined' && require.main === module) {
    console.log('--- Adding books ---');
    console.log(addBook('Clean Code', 'Robert C. Martin'));
    console.log(addBook('You Don\'t Know JS', 'Kyle Simpson'));
    console.log(addBook('Eloquent JavaScript', 'Marijn Haverbeke'));
    console.log('Duplicate rejected:', addBook('clean code', 'Someone Else'));
    console.log('Blank rejected:', addBook('   ', 'Nobody'));

    console.log('\n--- Library ---');
    console.log(library);

    console.log('\n--- Finding books ---');
    console.log('findBook("Eloquent JavaScript"):', findBook('Eloquent JavaScript'));
    console.log('findBook("  clean code "):', findBook('  clean code '));
    console.log('findBook("Missing Book"):', findBook('Missing Book'));
}

if (typeof module !== 'undefined') {
    module.exports = { library, addBook, findBook };
}
