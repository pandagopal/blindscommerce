const fetch = require('node-fetch');

async function testLoginAPI() {
  try {
    console.log('Testing login API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@smartblindshub.com',
        password: 'admin123'
      })
    });

    const data = await response.json();
    
    console.log('\nAPI Response Status:', response.status);
    console.log('API Response Headers:', response.headers.raw());
    console.log('API Response Body:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('Error testing login API:', error);
  }
}

testLoginAPI(); 