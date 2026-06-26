exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{}' };

  try {
    const { symbols } = JSON.parse(event.body);
    const KEY = process.env.FINNHUB_KEY || 'd8u1vv9r01qinhuf8br0d8u1vv9r01qinhuf8brg';
    
    // Finnhub quote endpoint - tüm semboller paralel
    const results = await Promise.all(
      symbols.map(async (sym) => {
        const url = `https://finnhub.io/api/v1/quote?symbol=${sym}&token=${KEY}`;
        const r = await fetch(url);
        const d = await r.json();
        return {
          symbol: sym,
          price: d.c || 0,        // current price
          change: d.d || 0,       // change
          changePct: d.dp || 0,   // change percent
          prevClose: d.pc || 0,   // previous close
          open: d.o || 0,
          high: d.h || 0,
          low: d.l || 0,
        };
      })
    );

    const prices = {};
    results.forEach(r => { prices[r.symbol] = r; });

    return { statusCode: 200, headers, body: JSON.stringify(prices) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
