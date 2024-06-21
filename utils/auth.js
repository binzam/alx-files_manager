import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import dbClient from './db';
import redisClient from './redis';

export function getCredFromAuthToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }
  const base64Credentials = authHeader.split(' ')[1];
  if (!base64Credentials) {
    return null;
  }
  const credentials = Buffer.from(base64Credentials, 'base64').toString(
    'utf-8',
  );
  const [email, password] = credentials.split(':');
  return { email, password };
}
export async function deleteSessionToken(token) {
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) { return false; }
  await redisClient.del(`auth_${token}`);
  return true;
}
export async function getUserFromSession(token) {
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) {
    return null;
  }
  const user = await dbClient.findUserById(userId);
  if (!user) {
    return null;
  }
  return { email: user.email, id: user._id };
}
export function getSessionToken(req) {
  const xHeader = req.headers['x-token'];
  if (!xHeader) {
    return null;
  }
  return xHeader;
}
export async function getCurrentUser(req) {
  const token = getSessionToken(req);
  if (!token) {
    return null;
  }
  const user = await getUserFromSession(token);
  if (!user) {
    return null;
  }
  return user;
}
export async function generateSessionToken(userId) {
  const token = uuidv4();
  const key = `auth_${token}`;
  redisClient.set(key, userId, 86400);
  return { token };
}
export async function authenticateUser(email, password) {
  const user = await dbClient.findUserByEmail(email);
  if (!user) {
    return null;
  }
  const hashedPassword = sha1(password);
  if (user.password !== hashedPassword) {
    return null;
  }
  return user;
}

// export default getUserFromXtoken;
