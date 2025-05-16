const bcrypt = require('bcrypt');

async function generateAndVerifyHash() {
    try {
        const password = 'password123';
        const hash = await bcrypt.hash(password, 10);
        console.log('Generated hash:', hash);
        
        const isValid = await bcrypt.compare(password, hash);
        console.log('Verification test:', isValid);
    } catch (error) {
        console.error('Error:', error);
    }
}

generateAndVerifyHash(); 