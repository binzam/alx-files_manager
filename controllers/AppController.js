import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AppController {
  static getStatus(req, res) {
    const isRedisAlive = redisClient.isAlive();
    const isDbAlive = dbClient.isAlive();
    if (isRedisAlive && isDbAlive) {
      res.status(200).json({ redis: isRedisAlive, db: isDbAlive });
    }
  }

  static async getStats(req, res) {
    try {
      const usersCount = await dbClient.nbUsers();
      const filesCount = await dbClient.nbFiles();
      res.status(200).json({ users: usersCount, files: filesCount });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default AppController;
