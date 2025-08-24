const fs = require('fs');
const path = require('path');
const https = require('https');

async function fetchCurrencyRates() {
  try {
    console.log('Fetching latest currency rates from Frankfurter API...');
    
    // Fetch from Frankfurter API using Node.js built-in https module
    const data = await new Promise((resolve, reject) => {
      https.get('https://api.frankfurter.app/latest', (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        });
      }).on('error', (error) => {
        reject(new Error(`HTTP request failed: ${error.message}`));
      });
    });
    
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
    
    // CRITICAL FIX: Add EUR rate (it was missing!)
    usdBasedRates.EUR = 1 / usdRate;
    
    // Filter to only include the currencies your extension needs
    const requiredCurrencies = [
      'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL',
      'KRW', 'MXN', 'THB', 'TRY', 'RUB', 'SGD', 'NZD', 'ZAR', 'HKD', 'AED',
      'SEK', 'NOK', 'DKK', 'PLN', 'PHP', 'IDR', 'MYR', 'ILS'
    ];
    
    // Create filtered rates object
    const filteredRates = {};
    requiredCurrencies.forEach(currency => {
      if (usdBasedRates[currency] !== undefined) {
        filteredRates[currency] = usdBasedRates[currency];
      }
    });
    
    // Create the final structure with filtered rates
    const ratesData = {
      rates: filteredRates,
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
    console.log(`🌍 Currencies: ${Object.keys(filteredRates).length}`);
    console.log(`🔑 Essential currencies: USD=${filteredRates.USD}, EUR=${filteredRates.EUR?.toFixed(6)}, TRY=${filteredRates.TRY?.toFixed(6)}`);
    
  } catch (error) {
    console.error('❌ Error fetching currency rates:', error.message);
    process.exit(1);
  }
}

// Run the function
fetchCurrencyRates();
