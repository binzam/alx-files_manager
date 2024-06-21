import dbClient from '../utils/db';
// import redisClient from '../utils/redis';
import { getCurrentUser } from '../utils/auth';

class UsersController {
  static async postNew(req, res) {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }
      const userExist = await dbClient.findUserByEmail(email);
      if (userExist) {
        return res.status(400).json({ error: 'Already exist' });
      }
      const newUser = await dbClient.createUser(email, password);
      console.log('postnew', newUser);
      return res.status(201).json(newUser);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: 'error occured processing the request' });
    }
  }

  static async getMe(req, res) {
    try {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({
          error: 'Unauthorized',
        });
      }
      return res.status(200).json(currentUser);
    } catch (error) {
      console.error('Error in getMe:', error);
      return res
        .status(500)
        .json({ error: 'An error occurred while processing the request' });
    }
  }
}

export default UsersController;
