const fs = require('fs');
const path = require('path');

async function fetchCurrencyRates() {
  try {
    console.log('Fetching latest currency rates from Frankfurter API...');
    
    // Fetch from Frankfurter API
    const response = await fetch('https://api.frankfurter.app/latest');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Convert EUR-based rates to USD-based rates
    const usdRate = data.rates.USD;
    const usdBasedRates = {};
    
    // Convert all rates to USD base
    Object.keys(data.rates).forEach(currency => {
      if (currency !== 'USD') {
        usdBasedRates[currency] = data.rates[currency] / usdRate;
      }
    });
    
    // Add USD as base (1.0)
    usdBasedRates.USD = 1;
    
    // Create the final structure
    const ratesData = {
      rates: usdBasedRates,
      metadata: {
        timestamp: Date.now(),
        last_updated: new Date().toISOString(),
        source: "frankfurter",
        version: "1.0.0",
        cache_duration: 86400000, // 24 hours in milliseconds
        market_status: "daily"
      }
    };
    
    // Ensure directory exists
    const outputDir = path.join(__dirname, '..', 'currency-rates-shared');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write to file
    const outputPath = path.join(outputDir, 'rates.json');
    fs.writeFileSync(outputPath, JSON.stringify(ratesData, null, 2));
    
    console.log(`✅ Currency rates updated successfully!`);
    console.log(`�� Saved to: ${outputPath}`);
    console.log(`🕒 Last updated: ${ratesData.metadata.last_updated}`);
    console.log(`�� Base currency: USD`);
    console.log(`🌍 Currencies: ${Object.keys(usdBasedRates).length}`);
    
  } catch (error) {
    console.error('❌ Error fetching currency rates:', error.message);
    process.exit(1);
  }
}

// Run the function
fetchCurrencyRates();
