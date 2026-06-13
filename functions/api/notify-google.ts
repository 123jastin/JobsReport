export async function notifyGoogleIndexing(jobUrl: string, actionType: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED') {
  try {
    const keyString = (globalThis as any).GOOGLE_SERVICE_ACCOUNT_KEY;
    
    if (!keyString) {
      console.log('⚠️ Google Service Account key not configured');
      return;
    }
    
    const key = typeof keyString === 'string' ? JSON.parse(keyString) : keyString;
    
    // Create JWT
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: key.private_key_id
    };
    
    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: key.client_email,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };
    
    const base64url = (obj: any) => 
      btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    const unsignedJwt = `${base64url(header)}.${base64url(claim)}`;
    
    // Sign the JWT with the private key
    const encoder = new TextEncoder();
    const keyData = encoder.encode(unsignedJwt);
    
    // Import the private key
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      pemToArrayBuffer(key.private_key),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Sign
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      keyData
    );
    
    const signedJwt = `${unsignedJwt}.${base64url(String.fromCharCode(...new Uint8Array(signature)))}`;
    
    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedJwt}`
    });
    
    const tokenData: any = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.error('❌ Failed to get access token:', JSON.stringify(tokenData));
      return;
    }
    
    // Call Indexing API
    const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        url: jobUrl,
        type: actionType,
      }),
    });
    
    const result: any = await response.json();
    
    if (response.ok) {
      console.log(`✅ Google notified: ${jobUrl}`);
    } else {
      console.error(`❌ Google rejected: ${result.error?.message || JSON.stringify(result)}`);
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ Indexing API error:', error.message);
  }
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
