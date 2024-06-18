import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    try {
      const { user } = req;
      const accessToken = uuidv4();
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
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
