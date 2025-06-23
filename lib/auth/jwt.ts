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


export const signToken = async (payload: Omit<JWTPayload, 'iat' | 'exp'>) => {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);
    
    return token;
  } catch (error) {
    throw error;
  }
};

export const verifyToken = async (token: string): Promise<JWTPayload> => {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format');
    }

    if (!JWT_SECRET || typeof JWT_SECRET !== 'string') {
      throw new Error('Invalid JWT_SECRET format');
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid token payload');
    }

    return payload as JWTPayload;
  } catch (error) {
    throw error;
  }
};

export const decodeToken = async (token: string): Promise<JWTPayload | null> => {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch (error) {
    return null;
  }
}; 