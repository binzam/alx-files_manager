import { MongoClient, ObjectId } from 'mongodb';
import sha1 from 'sha1';

const HOST = process.env.DB_HOST || 'localhost';
const PORT = process.env.DB_PORT || 27017;
const DATABASE = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${HOST}:${PORT}`;

class DBClient {
  constructor() {
    this.connected = false;
    this.client = new MongoClient(url);
    this.client
      .connect()
      .then(() => {
        this.db = this.client.db(`${DATABASE}`);
        this.connected = true;
      })
      .catch((err) => console.log(err.message));
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    try {
      const usersCollection = this.db.collection('users');
      const count = await usersCollection.countDocuments();
      return count;
    } catch (error) {
      console.error(error);
      return -1;
    }
  }

  async nbFiles() {
    try {
      const filesCollection = this.db.collection('files');
      const count = await filesCollection.countDocuments();
      return count;
    } catch (error) {
      console.error(error);
      return -1;
    }
  }

  async userExist(email) {
    const usersCollection = this.db.collection('users');
    const user = await usersCollection.findOne({ email });
    if (user) {
      return true;
    }
    return false;
  }

  async createUser(email, password) {
    const usersCollection = this.db.collection('users');
    const hashedPwd = sha1(password);
    const user = await usersCollection.insertOne({
      email,
      password: hashedPwd,
    });
    return user;
  }

  async findUserById(id) {
    try {
      const _id = new ObjectId(id);
      const usersCollection = this.db.collection('users');
      const user = await usersCollection.findOne({ _id });
      return user || null;
    } catch (error) {
      console.error('Error in getUserById:', error);
      throw new Error('An error occurred while retrieving the user');
    }
  }

  async findUserByEmail(email) {
    try {
      const usersCollection = this.db.collection('users');
      const user = await usersCollection.findOne({ email });
      return user || null;
    } catch (error) {
      console.error('Error in findUserByEmail:', error);
      throw new Error('An error occurred while retrieving the user');
    }
  }

  async saveFileInDb(fileDocument) {
    try {
      console.log('filedoc', fileDocument);
      const filesCollection = this.db.collection('files');
      const result = await filesCollection.insertOne({
        userId: fileDocument.userId,
        name: fileDocument.name,
        type: fileDocument.type,
        isPublic: fileDocument.isPublic,
        parentId: fileDocument.parentId || 0,
        localPath: fileDocument.localPath,
      });
      if (!result.acknowledged) {
        return null;
      }
      return result;
    } catch (error) {
      console.error('Error saving file in database:', error);
      throw error;
    }
  }

  async getFileFromDb(fileId) {
    try {
      const idObject = new ObjectId(fileId);
      console.log(idObject);
      const filesCollection = this.db.collection('files');
      const file = await filesCollection.findOne({ _id: idObject });
      return file;
    } catch (error) {
      console.error('Error in getFilefromDb:', error);
      throw error;
    }
  }
}
const dbClient = new DBClient();

export default dbClient;
