import dbClient from '../utils/db';
import redisClient from '../utils/redis';

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
      const userExist = await dbClient.userExist(email);
      if (userExist) {
        return res.status(400).json({ error: 'Already exist' });
      }
      const user = await dbClient.createUser(email, password);
      const id = user.insertedId;
      return res.status(201).json({ id, email });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: 'error occured processing the request' });
    }
  }

  static async getMe(req, res) {
    try {
      const token = req.headers['x-token'];

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const id = await redisClient.get(`auth_${token}`);
      if (!id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await dbClient.findUserById(id);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { _id, email } = user;
      return res.status(200).json({ id: _id, email });
    } catch (error) {
      console.error('Error in getMe:', error);
      return res
        .status(500)
        .json({ error: 'An error occurred while processing the request' });
    }
  }
}

export default UsersController;
