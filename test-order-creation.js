// Test order creation for logged-in user
const testOrderCreation = async () => {
  const orderData = {
    items: [
      {
        productId: 1,
        vendorId: 1,
        quantity: 1,
        price: 199.99,
        configuration: {
          width: "48",
          height: "60",
          colorName: "White"
        }
      }
    ],
    shippingAddress: {
      firstName: "John",
      lastName: "Doe",
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "US",
      email: "john@example.com",
      phone: "555-1234"
    },
    billingAddress: {
      firstName: "John",
      lastName: "Doe",
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "US",
      email: "john@example.com",
      phone: "555-1234"
    },
    paymentMethod: "stripe",
    notes: "Test order"
  };

  try {
    // First, login as a customer
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'customer@example.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.success) {
      console.error('Login failed:', loginData.error);
      return;
    }

    // Now create the order
    const orderResponse = await fetch('http://localhost:3001/api/v2/commerce/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': loginResponse.headers.get('set-cookie') || ''
      },
      body: JSON.stringify(orderData)
    });

    const orderResult = await orderResponse.json();
    console.log('Order creation response:', orderResult);

    if (orderResult.success) {
      console.log('Order created successfully!');
      console.log('Order ID:', orderResult.data?.order_id);
      console.log('Order Number:', orderResult.data?.order_number);
    } else {
      console.error('Order creation failed:', orderResult.error);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testOrderCreation();