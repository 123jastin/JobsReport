import { PagesFunction } from '@cloudflare/workers-types';

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { DB, JWT_SECRET } = context.env;

  try {
    const { email, password, rememberMe } = await context.request.json() as { 
      email: string; 
      password: string; 
      rememberMe?: boolean 
    };

    if (!email || !password) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Email and password are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find user by email
    const user = await DB.prepare(
      'SELECT * FROM admins WHERE email = ? AND is_active = 1'
    ).bind(email.toLowerCase().trim()).first();

    if (!user) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Invalid email or password' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify password
    if (user.password !== password) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Invalid email or password' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate token with expiry
    const expiryDays = rememberMe ? 30 : 1; // 30 days if remember me, 1 day default
    const expiryTime = Date.now() + (expiryDays * 24 * 60 * 60 * 1000);
    const tokenPayload = `${user.email}:${expiryTime}:${JWT_SECRET || 'default-secret'}`;
    const token = btoa(tokenPayload);

    // Update last login
    await DB.prepare(
      'UPDATE admins SET last_login = ?, token = ? WHERE id = ?'
    ).bind(new Date().toISOString(), token, user.id).run();

    return new Response(JSON.stringify({
      success: true,
      token,
      expiresIn: expiryDays * 24 * 60 * 60, // seconds
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
    console.error('Login error:', err);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Server error during login' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
