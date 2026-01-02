/**
 * Fetches the current price of SOL/USDT from Binance API
 * @returns {Object} Object containing success status and price data
 */
export async function getSOLPrice() {
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT');
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.price) {
      throw new Error('Invalid response format from Binance API');
    }
    
    return {
      success: true,
      symbol: data.symbol,
      price: parseFloat(data.price),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    return {
      success: false,
      error: error.message,
      price: null
    };
  }
}