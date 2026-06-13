export async function notifyGoogleIndexing(jobUrl: string, actionType: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED') {
  try {
    // Read from Cloudflare environment variable
    const keyString = (typeof process !== 'undefined' && (process as any).env?.GOOGLE_SERVICE_ACCOUNT_KEY) 
      || (globalThis as any).GOOGLE_SERVICE_ACCOUNT_KEY
      || (globalThis as any).env?.GOOGLE_SERVICE_ACCOUNT_KEY;
    
    if (!keyString) {
      console.log('⚠️ GOOGLE_SERVICE_ACCOUNT_KEY not found in environment');
      return { success: false, error: 'Key not configured' };
    }
    
    const key = JSON.parse(keyString);
    
    const header = { alg: 'RS256', typ: 'JWT', kid: key.private_key_id };
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
    
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      pemToArrayBuffer(key.private_key),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      new TextEncoder().encode(unsignedJwt)
    );
    
    const signedJwt = `${unsignedJwt}.${base64url(String.fromCharCode(...new Uint8Array(signature)))}`;
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedJwt}`
    });
    
    const tokenData: any = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.error('❌ Token error:', JSON.stringify(tokenData));
      return { success: false, error: tokenData };
    }
    
    const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({ url: jobUrl, type: actionType }),
    });
    
    const result: any = await response.json();
    
    console.log(`📢 Google indexing result:`, JSON.stringify(result));
    return { success: response.ok, result };
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
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
