/* eslint-disable consistent-return */
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export const basicAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString(
      'utf-8',
    );
    const [email, password] = credentials.split(':');
    const user = await dbClient.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (user.password !== sha1(password)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in basicAuthenticate:', error);
    res.status(500).json({ error: 'error occurred while processing the request' });
  }
};

export const xTokenAuthenticate = async (req, res, next) => {
  try {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await dbClient.findUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in xTokenAuthenticate:', error);
    return res
      .status(500)
      .json({ error: 'error occurred while processing the request' });
  }
};
export default { basicAuthenticate, xTokenAuthenticate };
