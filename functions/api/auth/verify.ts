import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { DB, JWT_SECRET } = context.env;

  try {
    const authHeader = context.request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ valid: false }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Decode token
    const decoded = atob(token);
    const parts = decoded.split(':');
    const email = parts[0];
    const expiryTime = parseInt(parts[1]);
    const secret = parts[2];

    // Check expiry
    if (Date.now() > expiryTime) {
      return new Response(JSON.stringify({ 
        valid: false, 
        message: 'Token expired' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify secret
    if (secret !== (JWT_SECRET || 'default-secret')) {
      return new Response(JSON.stringify({ 
        valid: false, 
        message: 'Invalid token' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user still exists and is active
    const user = await DB.prepare(
      'SELECT id, email, role, name, token FROM admins WHERE email = ? AND is_active = 1'
    ).bind(email).first();

    if (!user) {
      return new Response(JSON.stringify({ 
        valid: false, 
        message: 'User not found or inactive' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify token matches stored token
    if (user.token !== token) {
      return new Response(JSON.stringify({ 
        valid: false, 
        message: 'Token mismatch' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role || 'admin',
        name: user.name
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ 
      valid: false, 
      message: 'Server error' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
