import jwt from 'jsonwebtoken';
import env from './env';

export const signToken = (payload: string | object | Buffer): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token: string): string | jwt.JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET);
};

export default {
  signToken,
  verifyToken
};
