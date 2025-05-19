import { SignJWT, jwtVerify } from 'jose';

export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

console.log('JWT_SECRET is defined, length:', JWT_SECRET.length);

export const signToken = async (payload: Omit<JWTPayload, 'iat' | 'exp'>) => {
  try {
    console.log('Signing token with payload:', payload);
    console.log('Using JWT_SECRET length:', JWT_SECRET.length);
    
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);
    
    console.log('Token signed successfully, length:', token.length);
    return token;
  } catch (error) {
    console.error('Error signing token:', error);
    throw error;
  }
};

export const verifyToken = async (token: string): Promise<JWTPayload> => {
  try {
    console.log('=== Token Verification Start ===');
    console.log('Token length:', token.length);
    console.log('JWT_SECRET length:', JWT_SECRET.length);
    
    if (!token || typeof token !== 'string') {
      console.error('Invalid token format');
      throw new Error('Invalid token format');
    }

    if (!JWT_SECRET || typeof JWT_SECRET !== 'string') {
      console.error('Invalid JWT_SECRET format');
      throw new Error('Invalid JWT_SECRET format');
    }

    console.log('Attempting to verify token...');
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    if (!payload || typeof payload !== 'object') {
      console.error('Invalid token payload');
      throw new Error('Invalid token payload');
    }

    console.log('Token verified successfully');
    console.log('Decoded payload:', {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      iat: payload.iat,
      exp: payload.exp
    });
    console.log('=== Token Verification End ===');
    return payload as JWTPayload;
  } catch (error) {
    console.error('=== Token Verification Error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('=== Token Verification Error End ===');
    throw error;
  }
};

export const decodeToken = async (token: string): Promise<JWTPayload | null> => {
  try {
    console.log('Decoding token...');
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    console.log('Token decoded successfully');
    return payload as JWTPayload;
  } catch (error) {
    console.error('Token decoding failed:', error);
    return null;
  }
}; 