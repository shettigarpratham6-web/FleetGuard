import db from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env';

const JWT_SECRET = env.JWT_SECRET || 'supersecretkeyreplaceinproduction';
const JWT_EXPIRES_IN = '24h';

export const findUserByEmail = async (email: string): Promise<any | null> => {
  const result = await db.query(
    'SELECT * FROM users WHERE email = $1 LIMIT 1',
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
};

export const findUserById = async (id: string): Promise<any | null> => {
  const result = await db.query(
    'SELECT id, firebase_uid, username, email, full_name, profile_picture, role, branch_id, status, created_at, updated_at FROM users WHERE id = $1 LIMIT 1',
    [id]
  );
  return result.rows[0] || null;
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const signToken = (user: { id: string; email: string; role: string }): string => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};

export const isEmailTaken = async (email: string): Promise<boolean> => {
  const result = await db.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email.toLowerCase()]);
  return result.rows.length > 0;
};

export default {
  findUserByEmail,
  findUserById,
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
  isEmailTaken
};
