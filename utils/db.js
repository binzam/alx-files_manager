import { MongoClient } from 'mongodb';
import sha1 from 'sha1';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;
    this.connected = false;
    this.client = new MongoClient(url);
    this.client
      .connect()
      .then(() => {
        this.connected = true;
      })
      .catch((err) => console.log(err.message));
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    try {
      const db = this.client.db(this.database);
      const usersCollection = db.collection('users');
      const count = await usersCollection.countDocuments();
      return count;
    } catch (error) {
      console.error(error);
      return -1;
    }
  }

  async nbFiles() {
    try {
      const db = this.client.db(this.database);
      const filesCollection = db.collection('files');
      const count = await filesCollection.countDocuments();
      return count;
    } catch (error) {
      console.error(error);
      return -1;
    }
  }

  async userExist(email) {
    const db = this.client.db(this.database);
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ email });
    if (user) {
      return true;
    }
    return false;
  }

  async createUser(email, password) {
    const db = this.client.db(this.database);
    const usersCollection = db.collection('users');
    const hashedPwd = sha1(password);
    const user = await usersCollection.insertOne({
      email,
      password: hashedPwd,
    });
    return user;
  }

  static async getUserByToken(token) {
    try {
      const db = this.client.db(this.database);
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne(
        { token },
        { projection: { email: 1, id: 1 } },
      );

      return user;
    } catch (error) {
      console.error('Error in getUserByToken:', error);
      throw new Error('An error occurred while retrieving the user');
    }
  }
}
const dbClient = new DBClient();

export default dbClient;
