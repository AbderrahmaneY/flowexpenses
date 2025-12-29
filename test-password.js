const bcrypt = require('bcryptjs');

// Test if password123 matches the hash from database
const testPassword = 'password123';

// You'll need to paste the actual hash from the database here
// Run: sqlite3 prisma/dev.db "SELECT password FROM User WHERE email = 'accounting@flow.com';"
const hashFromDb = process.argv[2];

if (!hashFromDb) {
    console.log('Usage: node test-password.js <hash_from_database>');
    process.exit(1);
}

bcrypt.compare(testPassword, hashFromDb).then(result => {
    console.log(`Password "password123" matches hash: ${result}`);
    if (!result) {
        console.log('Password does NOT match! The hash might be corrupted.');
    }
}).catch(err => {
    console.error('Error:', err);
});
