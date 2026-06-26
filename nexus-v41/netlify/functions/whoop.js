exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const SECRET = process.env.WHOOP_CLIENT_SECRET;
  const CLIENT_ID = process.env.WHOOP_CLIENT_ID || 'a116c113-e06e-4049-9fda-24c47de01651';

  try {
    const body = JSON.parse(event.body);
    const { action, access_token, refresh_token, code } = body;

    // Token exchange
    if (action === 'exchange') {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'https://localhost/',
        client_id: CLIENT_ID,
        client_secret: SECRET,
        scope: 'offline read:recovery read:sleep read:workout read:cycles read:body_measurement read:profile'
      });
      const r = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params
      });
      return { statusCode: 200, headers, body: JSON.stringify(await r.json()) };
    }

    // Refresh token
    if (action === 'refresh') {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
        client_id: CLIENT_ID,
        client_secret: SECRET,
        scope: 'offline'
      });
      const r = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params
      });
      return { statusCode: 200, headers, body: JSON.stringify(await r.json()) };
    }

    // Fetch data
    if (action === 'data') {
      const base = 'https://api.prod.whoop.com/developer/v1';
      const h = { Authorization: `Bearer ${access_token}` };
      const [profile, recovery, sleep, cycles] = await Promise.all([
        fetch(`${base}/user/profile/basic`, { headers: h }).then(r => r.json()),
        fetch(`${base}/recovery?limit=1`, { headers: h }).then(r => r.json()),
        fetch(`${base}/activity/sleep?limit=1`, { headers: h }).then(r => r.json()),
        fetch(`${base}/cycle?limit=1`, { headers: h }).then(r => r.json()),
      ]);
      return { statusCode: 200, headers, body: JSON.stringify({ profile, recovery, sleep, cycles }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
