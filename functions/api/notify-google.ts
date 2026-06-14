export async function notifyGoogleIndexing(jobUrl: string, actionType: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED', contextEnv?: any) {
  try {
    let keyString = '';
    
    if (contextEnv?.GOOGLE_SERVICE_ACCOUNT) {
      keyString = contextEnv.GOOGLE_SERVICE_ACCOUNT;
    } else if ((globalThis as any).GOOGLE_SERVICE_ACCOUNT) {
      keyString = (globalThis as any).GOOGLE_SERVICE_ACCOUNT;
    }
    
    if (!keyString) {
      return { success: false, error: 'Key not configured' };
    }
    
    const key = JSON.parse(keyString);
    
    // 🔥 Use JWT creation helper
    const jwt = await createGoogleJWT(key);
    
    if (!jwt) {
      return { success: false, error: 'Failed to create JWT' };
    }
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });
    
    const tokenData: any = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.error('❌ Token error:', JSON.stringify(tokenData));
      return { success: false, error: tokenData };
    }
    
    console.log('✅ Access token obtained');
    
    const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({ url: jobUrl, type: actionType }),
    });
    
    const result: any = await response.json();
    console.log(`📢 Response:`, JSON.stringify(result));
    
    if (response.ok && result.urlNotificationMetadata) {
      return { success: true, message: 'Google confirmed', metadata: result.urlNotificationMetadata };
    }
    
    return { success: false, error: result.error || result };
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

// 🔥 Helper to create Google JWT
async function createGoogleJWT(key: any): Promise<string | null> {
  try {
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };
    
    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: key.client_email,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };
    
    const base64url = (str: string) => 
      btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    const input = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
    
    // Clean private key
    const privateKeyPem = key.private_key
      .replace('-----BEGIN PRIVATE KEY-----\n', '')
      .replace('\n-----END PRIVATE KEY-----', '')
      .replace(/\n/g, '');
    
    // Decode base64 to binary
    const binaryKey = Uint8Array.from(atob(privateKeyPem), c => c.charCodeAt(0));
    
    // Import key
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey.buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Sign
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(input)
    );
    
    // Convert signature to base64url
    const signatureBytes = new Uint8Array(signature);
    let signatureBinary = '';
    for (let i = 0; i < signatureBytes.length; i++) {
      signatureBinary += String.fromCharCode(signatureBytes[i]);
    }
    
    return `${input}.${base64url(signatureBinary)}`;
  } catch (error: any) {
    console.error('JWT creation error:', error.message);
    return null;
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
