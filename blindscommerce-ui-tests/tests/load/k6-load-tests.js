// K6 Load Testing Script for BlindsCommerce
// Run with: k6 run tests/load/k6-load-tests.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTimeTrend = new Trend('response_time');
const httpRequests = new Counter('http_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes  
    { duration: '2m', target: 100 },  // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '2m', target: 200 },  // Spike to 200 users over 2 minutes
    { duration: '1m', target: 200 },  // Stay at 200 users for 1 minute
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must be below 2s
    http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
    errors: ['rate<0.05'],             // Custom error rate below 5%
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

const users = [
  { email: 'customer@smartblindshub.com', password: 'Admin@1234', role: 'customer' },
  { email: 'vendor@smartblindshub.com', password: 'Admin@1234', role: 'vendor' },
  { email: 'admin@smartblindshub.com', password: 'Admin@1234', role: 'admin' },
];

const searchTerms = [
  'roller shade', 'cellular', 'motorized', 'blackout', 'cordless',
  'white', 'gray', 'beige', 'custom', 'premium', 'smart'
];

const productConfigurations = [
  { width: 48.5, height: 72.0, color_id: 1, material_id: 1, control_type: 'cordless' },
  { width: 36.0, height: 60.0, color_id: 2, material_id: 2, control_type: 'motorized' },
  { width: 60.0, height: 84.0, color_id: 3, material_id: 1, control_type: 'cordless' },
];

// Authentication helper
function authenticate(user) {
  const loginResponse = http.post(`${API_URL}/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'login' }
  });

  httpRequests.add(1);
  
  const isSuccess = check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'login response time < 2s': (r) => r.timings.duration < 2000,
  });

  if (!isSuccess) {
    errorRate.add(1);
    return null;
  }

  const authData = JSON.parse(loginResponse.body);
  return authData.token;
}

// Load test scenarios
export default function () {
  const user = users[Math.floor(Math.random() * users.length)];
  const scenario = Math.random();

  if (scenario < 0.3) {
    // 30% - Anonymous browsing
    anonymousBrowsing();
  } else if (scenario < 0.6) {
    // 30% - Product search and configuration
    productSearchAndConfig(user);
  } else if (scenario < 0.8) {
    // 20% - Shopping workflow
    shoppingWorkflow(user);
  } else {
    // 20% - Admin/Vendor operations
    adminVendorOperations(user);
  }

  sleep(1 + Math.random() * 3); // Random pause between 1-4 seconds
}

function anonymousBrowsing() {
  console.log('🔍 Anonymous browsing scenario');

  // Homepage
  let response = http.get(`${BASE_URL}/`);
  httpRequests.add(1);
  responseTimeTrend.add(response.timings.duration);
  
  check(response, {
    'homepage loads': (r) => r.status === 200,
    'homepage response time < 3s': (r) => r.timings.duration < 3000,
  }) || errorRate.add(1);

  sleep(1);

  // Products page
  response = http.get(`${BASE_URL}/products`);
  httpRequests.add(1);
  responseTimeTrend.add(response.timings.duration);
  
  check(response, {
    'products page loads': (r) => r.status === 200,
    'products response time < 4s': (r) => r.timings.duration < 4000,
  }) || errorRate.add(1);

  sleep(2);

  // Product search
  const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  response = http.get(`${API_URL}/products/search?q=${searchTerm}`);
  httpRequests.add(1);
  responseTimeTrend.add(response.timings.duration);
  
  check(response, {
    'search API works': (r) => r.status === 200,
    'search response time < 2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(1);

  // Product details
  response = http.get(`${BASE_URL}/products/premium-roller-shade`);
  httpRequests.add(1);
  responseTimeTrend.add(response.timings.duration);
  
  check(response, {
    'product details load': (r) => r.status === 200,
  }) || errorRate.add(1);
}

function productSearchAndConfig(user) {
  console.log('⚙️ Product search and configuration scenario');
  
  const token = authenticate(user);
  if (!token) return;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Search products
  const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  let response = http.get(`${API_URL}/products/search?q=${searchTerm}`, { headers });
  httpRequests.add(1);
  responseTimeTrend.add(response.timings.duration);
  
  check(response, {
    'authenticated search works': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Get product configuration options
  response = http.get(`${API_URL}/products/premium-roller-shade/configuration`, { headers });
  httpRequests.add(1);
  responseTimeTrend.add(response.timings.duration);
  
  check(response, {
    'configuration options load': (r) => r.status === 200,
    'configuration response time < 2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(2);

  // Calculate pricing for configuration
  const config = productConfigurations[Math.floor(Math.random() * productConfigurations.length)];
  response = http.post(`${API_URL}/products/premium-roller-shade/pricing`, 
    JSON.stringify(config), { headers });
  httpRequests.add(1);
  responseTimeTrend.add(response.timings.duration);
  
  check(response, {
    'pricing calculation works': (r) => r.status === 200,
    'pricing response time < 1s': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);
}

function shoppingWorkflow(user) {
  console.log('🛒 Shopping workflow scenario');
  
  const token = authenticate(user);
  if (!token) return;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Add item to cart
  const config = productConfigurations[Math.floor(Math.random() * productConfigurations.length)];
  let response = http.post(`${API_URL}/cart/enhanced`, JSON.stringify({
    product_id: 1,
    quantity: 1,
    configuration: config
  }), { headers });
  httpRequests.add(1);
  responseTimeTrend.add(response.timings.duration);
  
  check(response, {
    'add to cart works': (r) => r.status === 200,
    'add to cart response time < 2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(1);

  // Get cart contents
  response = http.get(`${API_URL}/cart/enhanced`, { headers });
  httpRequests.add(1);
  responseTimeTrend.add(response.timings.duration);
  
  check(response, {
    'cart loads': (r) => r.status === 200,
    'cart response time < 1s': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(1);

  // Apply coupon (simulate)
  response = http.post(`${API_URL}/cart/apply-coupon`, JSON.stringify({
    coupon_code: 'SAVE10'
  }), { headers });
  httpRequests.add(1);
  responseTimeTrend.add(response.timings.duration);
  
  check(response, {
    'coupon application handled': (r) => r.status === 200 || r.status === 400, // Valid or invalid coupon
  }) || errorRate.add(1);

  sleep(2);

  // Simulate checkout process (without actually placing order)
  response = http.get(`${BASE_URL}/checkout`, { headers });
  httpRequests.add(1);
  responseTimeTrend.add(response.timings.duration);
  
  check(response, {
    'checkout page loads': (r) => r.status === 200,
  }) || errorRate.add(1);
}

function adminVendorOperations(user) {
  if (user.role === 'customer') return; // Skip for customer users
  
  console.log(`👨‍💼 ${user.role} operations scenario`);
  
  const token = authenticate(user);
  if (!token) return;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  if (user.role === 'admin') {
    // Admin operations
    
    // Get dashboard stats
    let response = http.get(`${API_URL}/admin/dashboard/stats`, { headers });
    httpRequests.add(1);
    responseTimeTrend.add(response.timings.duration);
    
    check(response, {
      'admin dashboard loads': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(1);

    // Get orders
    response = http.get(`${API_URL}/admin/orders?page=1&limit=10`, { headers });
    httpRequests.add(1);
    responseTimeTrend.add(response.timings.duration);
    
    check(response, {
      'admin orders load': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(1);

    // Get users
    response = http.get(`${API_URL}/admin/users?page=1&limit=10`, { headers });
    httpRequests.add(1);
    responseTimeTrend.add(response.timings.duration);
    
    check(response, {
      'admin users load': (r) => r.status === 200,
    }) || errorRate.add(1);

  } else if (user.role === 'vendor') {
    // Vendor operations
    
    // Get vendor dashboard
    let response = http.get(`${API_URL}/vendor/dashboard/stats`, { headers });
    httpRequests.add(1);
    responseTimeTrend.add(response.timings.duration);
    
    check(response, {
      'vendor dashboard loads': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(1);

    // Get vendor products
    response = http.get(`${API_URL}/vendor/products`, { headers });
    httpRequests.add(1);
    responseTimeTrend.add(response.timings.duration);
    
    check(response, {
      'vendor products load': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(1);

    // Get vendor analytics
    response = http.get(`${API_URL}/vendor/analytics?period=30days`, { headers });
    httpRequests.add(1);
    responseTimeTrend.add(response.timings.duration);
    
    check(response, {
      'vendor analytics load': (r) => r.status === 200,
    }) || errorRate.add(1);
  }
}

// Stress test for specific endpoints
export function stressTestEndpoints() {
  console.log('⚡ Stress testing critical endpoints');

  const criticalEndpoints = [
    { path: `${API_URL}/products`, name: 'products_api' },
    { path: `${API_URL}/products/search?q=roller`, name: 'search_api' },
    { path: `${BASE_URL}/`, name: 'homepage' },
    { path: `${BASE_URL}/products`, name: 'products_page' },
  ];

  criticalEndpoints.forEach(endpoint => {
    const response = http.get(endpoint.path, {
      tags: { name: endpoint.name }
    });
    httpRequests.add(1);
    responseTimeTrend.add(response.timings.duration);
    
    check(response, {
      [`${endpoint.name} responds`]: (r) => r.status === 200,
      [`${endpoint.name} fast response`]: (r) => r.timings.duration < 3000,
    }) || errorRate.add(1);
  });
}

// Database stress test
export function databaseStressTest() {
  console.log('🗄️ Database stress testing');
  
  const user = users[0]; // Use customer for this test
  const token = authenticate(user);
  if (!token) return;

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Rapid cart operations to stress database
  for (let i = 0; i < 5; i++) {
    const config = productConfigurations[i % productConfigurations.length];
    
    // Add to cart
    const addResponse = http.post(`${API_URL}/cart/enhanced`, JSON.stringify({
      product_id: 1 + (i % 3),
      quantity: 1,
      configuration: config
    }), { headers });
    httpRequests.add(1);
    
    check(addResponse, {
      'rapid cart add succeeds': (r) => r.status === 200,
    }) || errorRate.add(1);

    // Get cart
    const getResponse = http.get(`${API_URL}/cart/enhanced`, { headers });
    httpRequests.add(1);
    
    check(getResponse, {
      'rapid cart get succeeds': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(0.1); // Very short pause for rapid operations
  }
}

// Export additional test functions for different scenarios
export const scenarios = {
  stress_endpoints: {
    executor: 'constant-arrival-rate',
    rate: 50, // 50 requests per second
    timeUnit: '1s',
    duration: '2m',
    preAllocatedVUs: 10,
    maxVUs: 100,
    exec: 'stressTestEndpoints',
  },
  database_stress: {
    executor: 'constant-vus',
    vus: 20,
    duration: '1m',
    exec: 'databaseStressTest',
  },
};