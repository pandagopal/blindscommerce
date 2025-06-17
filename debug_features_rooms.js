// Debug script to test the features and rooms data flow
const testData = {
  // Features data structure from frontend
  features: [
    {
      id: 'feature_1',
      title: 'Energy Efficient',
      description: 'Helps reduce energy costs',
      icon: 'leaf'
    },
    {
      id: 'feature_2', 
      title: 'Light Control',
      description: 'Precise light filtering',
      icon: 'sun'
    }
  ],
  
  // Room recommendations data structure from frontend
  roomRecommendations: [
    {
      id: 'room_1',
      roomType: 'Living Room',
      recommendation: 'Perfect for main living areas',
      priority: 1
    },
    {
      id: 'room_2',
      roomType: 'Bedroom', 
      recommendation: 'Great for privacy and light control',
      priority: 2
    }
  ]
};

console.log('Frontend data structure:');
console.log('Features:', JSON.stringify(testData.features, null, 2));
console.log('Room Recommendations:', JSON.stringify(testData.roomRecommendations, null, 2));

// What the API expects to receive
console.log('\nAPI expects to receive:');
console.log('features:', testData.features);
console.log('roomRecommendations:', testData.roomRecommendations);

// What gets processed in the API
console.log('\nAPI processing:');
console.log('Features loop:');
testData.features.forEach((feature, index) => {
  console.log(`  Feature ${index + 1}:`, {
    title: feature.title,
    description: feature.description,
    icon: feature.icon
  });
});

console.log('\nRoom Recommendations loop:');
testData.roomRecommendations.forEach((room, index) => {
  console.log(`  Room ${index + 1}:`, {
    roomType: room.roomType,
    priority: room.priority,
    recommendation: room.recommendation
  });
});