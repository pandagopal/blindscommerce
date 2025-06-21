const { calculateTax, getTaxRateByZip } = require('./lib/services/taxCalculation.ts');

async function testTaxCalculation() {
  try {
    console.log('Testing tax calculation...');
    
    // Test Austin, TX
    const austinTax = await calculateTax(100, '78701');
    console.log('Austin, TX (78701) - $100 order:', austinTax);
    
    // Test New York, NY
    const nyTax = await calculateTax(100, '10001');
    console.log('New York, NY (10001) - $100 order:', nyTax);
    
    // Test Chicago, IL
    const chicagoTax = await calculateTax(100, '60601');
    console.log('Chicago, IL (60601) - $100 order:', chicagoTax);
    
    // Test unknown ZIP
    const unknownTax = await calculateTax(100, '12345');
    console.log('Unknown ZIP (12345) - $100 order:', unknownTax);
    
  } catch (error) {
    console.error('Error testing tax calculation:', error);
  }
}

testTaxCalculation();