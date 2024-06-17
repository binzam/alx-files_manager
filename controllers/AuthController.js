import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
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
      const accessToken = uuidv4();

      await redisClient.set(
        `auth_${accessToken}`,
        user._id.toString('utf8'),
        86400,
      );

      return res.status(200).json({ token: accessToken });
    } catch (error) {
      console.error('Error in getConnect:', error);
      return res
        .status(500)
        .json({ error: 'An error occurred while processing the request' });
    }
  }

  static async getDisconnect(req, res) {
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
      await redisClient.del(`auth_${token}`);
      return res.status(204).send();
    } catch (error) {
      console.error('Error in disconnect:', error);
      return res
        .status(500)
        .json({ error: 'error occurred while processing the request' });
    }
  }
}

export default AuthController;
