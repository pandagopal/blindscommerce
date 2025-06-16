// Artillery.io custom functions for BlindsCommerce load testing

const { faker } = require('@faker-js/faker');

module.exports = {
  // Custom function to simulate random cart actions
  randomCartAction: function(requestParams, context, ee, next) {
    const actions = ['update_quantity', 'remove_item', 'apply_coupon', 'proceed_checkout'];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    
    context.vars.cartAction = randomAction;
    
    // Set different behavior based on action
    switch (randomAction) {
      case 'update_quantity':
        context.vars.newQuantity = Math.floor(Math.random() * 3) + 1;
        break;
      case 'apply_coupon':
        context.vars.couponCode = Math.random() > 0.7 ? 'SAVE10' : 'INVALID' + Math.floor(Math.random() * 1000);
        break;
      case 'remove_item':
        context.vars.removeAction = true;
        break;
      case 'proceed_checkout':
        context.vars.proceedToCheckout = true;
        break;
    }
    
    return next();
  },

  // Generate realistic product configuration
  generateConfiguration: function(requestParams, context, ee, next) {
    const configurations = {
      width: parseFloat((Math.random() * 72 + 24).toFixed(1)), // 24-96 inches
      height: parseFloat((Math.random() * 84 + 36).toFixed(1)), // 36-120 inches
      color_id: Math.floor(Math.random() * 6) + 1,
      material_id: Math.floor(Math.random() * 4) + 1,
      control_type: ['cordless', 'motorized', 'chain'][Math.floor(Math.random() * 3)],
      mount_type: ['inside', 'outside'][Math.floor(Math.random() * 2)],
      room_type: ['living_room', 'bedroom', 'kitchen', 'office', 'bathroom'][Math.floor(Math.random() * 5)]
    };
    
    context.vars.productConfig = configurations;
    return next();
  },

  // Simulate realistic user behavior timing
  humanBehavior: function(requestParams, context, ee, next) {
    // Add realistic delays based on user behavior patterns
    const behaviorTypes = ['fast_browser', 'careful_shopper', 'researcher', 'impulse_buyer'];
    const behaviorType = behaviorTypes[Math.floor(Math.random() * behaviorTypes.length)];
    
    let thinkTime;
    switch (behaviorType) {
      case 'fast_browser':
        thinkTime = Math.random() * 2 + 0.5; // 0.5-2.5 seconds
        break;
      case 'careful_shopper':
        thinkTime = Math.random() * 8 + 3; // 3-11 seconds
        break;
      case 'researcher':
        thinkTime = Math.random() * 15 + 5; // 5-20 seconds
        break;
      case 'impulse_buyer':
        thinkTime = Math.random() * 1 + 0.2; // 0.2-1.2 seconds
        break;
    }
    
    context.vars.thinkTime = thinkTime;
    context.vars.behaviorType = behaviorType;
    
    return next();
  },

  // Generate realistic search queries
  generateSearchQuery: function(requestParams, context, ee, next) {
    const searchTypes = ['product_type', 'color', 'feature', 'room', 'brand'];
    const searchType = searchTypes[Math.floor(Math.random() * searchTypes.length)];
    
    let searchQuery;
    switch (searchType) {
      case 'product_type':
        searchQuery = ['roller shade', 'cellular shade', 'vertical blind', 'horizontal blind', 'roman shade'][Math.floor(Math.random() * 5)];
        break;
      case 'color':
        searchQuery = ['white', 'gray', 'beige', 'brown', 'blue', 'green'][Math.floor(Math.random() * 6)];
        break;
      case 'feature':
        searchQuery = ['motorized', 'cordless', 'blackout', 'light filtering', 'energy efficient'][Math.floor(Math.random() * 5)];
        break;
      case 'room':
        searchQuery = ['bedroom', 'living room', 'kitchen', 'office', 'bathroom'][Math.floor(Math.random() * 5)] + ' blinds';
        break;
      case 'brand':
        searchQuery = ['premium', 'custom', 'smart', 'luxury'][Math.floor(Math.random() * 4)] + ' blinds';
        break;
    }
    
    context.vars.searchQuery = searchQuery;
    context.vars.searchType = searchType;
    
    return next();
  },

  // Simulate shopping cart abandonment
  cartAbandonment: function(requestParams, context, ee, next) {
    // 30% chance of cart abandonment
    const shouldAbandon = Math.random() < 0.3;
    context.vars.abandonCart = shouldAbandon;
    
    if (shouldAbandon) {
      // Set abandonment reason
      const reasons = ['price_too_high', 'shipping_cost', 'complexity', 'comparison_shopping', 'distraction'];
      context.vars.abandonmentReason = reasons[Math.floor(Math.random() * reasons.length)];
    }
    
    return next();
  },

  // Generate realistic error scenarios
  simulateErrors: function(requestParams, context, ee, next) {
    // 5% chance of simulating user errors
    if (Math.random() < 0.05) {
      const errorTypes = ['invalid_email', 'wrong_password', 'invalid_configuration', 'network_timeout'];
      const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      
      switch (errorType) {
        case 'invalid_email':
          context.vars.email = 'invalid-email-format';
          break;
        case 'wrong_password':
          context.vars.password = 'wrong-password-123';
          break;
        case 'invalid_configuration':
          context.vars.productConfig = {
            width: -1, // Invalid width
            height: 0,  // Invalid height
            color_id: 999, // Non-existent color
          };
          break;
      }
      
      context.vars.simulateError = errorType;
    }
    
    return next();
  },

  // Device type simulation
  simulateDevice: function(requestParams, context, ee, next) {
    const devices = ['desktop', 'mobile', 'tablet'];
    const deviceWeights = [0.6, 0.3, 0.1]; // 60% desktop, 30% mobile, 10% tablet
    
    let device = 'desktop';
    const random = Math.random();
    
    if (random < deviceWeights[1]) {
      device = 'mobile';
    } else if (random < deviceWeights[1] + deviceWeights[2]) {
      device = 'tablet';
    }
    
    context.vars.deviceType = device;
    
    // Set appropriate headers and behavior based on device
    switch (device) {
      case 'mobile':
        requestParams.headers = requestParams.headers || {};
        requestParams.headers['User-Agent'] = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15';
        context.vars.mobileViewport = true;
        break;
      case 'tablet':
        requestParams.headers = requestParams.headers || {};
        requestParams.headers['User-Agent'] = 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15';
        context.vars.tabletViewport = true;
        break;
      default:
        requestParams.headers = requestParams.headers || {};
        requestParams.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
        break;
    }
    
    return next();
  },

  // Geographic distribution simulation
  simulateGeography: function(requestParams, context, ee, next) {
    const locations = [
      { region: 'US-West', latency: 50 },
      { region: 'US-East', latency: 100 },
      { region: 'US-Central', latency: 75 },
      { region: 'Canada', latency: 120 },
      { region: 'International', latency: 200 }
    ];
    
    const location = locations[Math.floor(Math.random() * locations.length)];
    context.vars.userLocation = location.region;
    context.vars.networkLatency = location.latency;
    
    // Simulate network latency (this is conceptual - actual implementation would require network simulation)
    context.vars.simulatedLatency = location.latency;
    
    return next();
  },

  // Business hours simulation
  simulateBusinessHours: function(requestParams, context, ee, next) {
    const hour = new Date().getHours();
    let trafficMultiplier = 1;
    
    // Simulate traffic patterns based on business hours
    if (hour >= 9 && hour <= 17) {
      trafficMultiplier = 1.5; // Higher traffic during business hours
    } else if (hour >= 18 && hour <= 22) {
      trafficMultiplier = 2.0; // Peak traffic in evening
    } else if (hour >= 23 || hour <= 6) {
      trafficMultiplier = 0.3; // Low traffic at night
    }
    
    context.vars.trafficMultiplier = trafficMultiplier;
    context.vars.currentHour = hour;
    
    return next();
  },

  // Generate realistic customer data
  generateCustomerData: function(requestParams, context, ee, next) {
    const customer = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zipCode: faker.location.zipCode(),
        country: 'US'
      },
      preferences: {
        newsletter: Math.random() > 0.3,
        smsUpdates: Math.random() > 0.7,
        roomType: ['living_room', 'bedroom', 'kitchen', 'office', 'dining_room'][Math.floor(Math.random() * 5)],
        budget: Math.floor(Math.random() * 2000) + 200 // $200-$2200
      }
    };
    
    context.vars.customerData = customer;
    return next();
  },

  // Log custom metrics
  logCustomMetrics: function(requestParams, context, ee, next) {
    // Log custom business metrics
    ee.emit('counter', 'custom.user_sessions', 1);
    
    if (context.vars.behaviorType) {
      ee.emit('counter', `custom.behavior.${context.vars.behaviorType}`, 1);
    }
    
    if (context.vars.deviceType) {
      ee.emit('counter', `custom.device.${context.vars.deviceType}`, 1);
    }
    
    if (context.vars.searchType) {
      ee.emit('counter', `custom.search.${context.vars.searchType}`, 1);
    }
    
    if (context.vars.abandonCart) {
      ee.emit('counter', 'custom.cart.abandoned', 1);
      ee.emit('counter', `custom.abandonment.${context.vars.abandonmentReason}`, 1);
    }
    
    return next();
  }
};