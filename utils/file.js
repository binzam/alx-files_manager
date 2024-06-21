import { ObjectId } from 'mongodb';
import dbClient from './db';

async function findUserFileById(userId, fileId) {
  if (!ObjectId.isValid(fileId)) {
    return null;
  }
  const db = dbClient.client.db(dbClient.database);
  const filesCollection = db.collection('files');
  const result = await filesCollection.findOne({
    userId: ObjectId(userId),
    _id: ObjectId(fileId),
  });
  if (!result) {
    return null;
  }
  return result;
}
export default findUserFileById;
