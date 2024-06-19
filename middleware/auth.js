/* eslint-disable consistent-return */
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

async function getUserFromXtoken(req, res, next) {
  try {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const db = dbClient.client.db(dbClient.database);
    const usersCollection = db.collection('users');
    const idObject = new ObjectId(userId);
    const user = await usersCollection.findOne({ _id: idObject });
    if (!user) {
      return res.status(404).json({ error: 'Unauthorized' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error in getUserFromXtoken middleware:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default getUserFromXtoken;
