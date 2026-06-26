exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '{}' };

  const KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: 'No API key' }) };

  try {
    const body = JSON.parse(event.body);
    // max_tokens küçük tut - hızlı yanıt için
    const req = {
      model: 'claude-haiku-4-5-20251001', // Haiku çok daha hızlı!
      max_tokens: Math.min(body.max_tokens || 1500, 1500),
      messages: body.messages,
    };
    if (body.system) req.system = body.system;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const err = await res.text();
      return { statusCode: res.status, headers, body: JSON.stringify({ error: err }) };
    }

    const data = await res.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
