import { MongoClient, ObjectId } from 'mongodb';
import sha1 from 'sha1';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';
class DBClient {
  constructor() {
    const url = `mongodb://${host}:${port}/${database}`;
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.connected = false;
    this.db = null;
    this.client
      .connect()
      .then(() => {
        this.db = this.client.db(`${database}`);
        this.connected = true;
      })
      .catch((err) => console.log(err.message));
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    return this.db.collection('files').countDocuments();
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

  async createUser(email, password) {
    const hashedPassword = sha1(password);
    const result = await this.db.collection('users').insertOne({
      email,
      password: hashedPassword,
    });
    const newUser = {
      email: result.ops[0].email,
      id: result.ops[0]._id,
    };
    console.log('creatte user', newUser);
    return newUser;
  }

  async findUserById(userId) {
    try {
      const usersCollection = this.db.collection('users');
      const user = await usersCollection.findOne({ _id: ObjectId(userId) });
      return user || null;
    } catch (error) {
      console.error('Error in findUserById:', error);
      throw new Error('An error occurred while retrieving the user');
    }
  }

  async getFileFromDb(fileId) {
    try {
      const db = this.client.db(this.database);
      const filesCollection = db.collection('files');
      const file = await filesCollection.findOne({
        _id: new ObjectId(fileId),
      });
      return file;
    } catch (error) {
      console.error('Error in getFileFromDb:', error);
      return null;
    }
  }

  async saveFileInDb(fileDocument) {
    try {
      const db = this.client.db(this.database);
      const filesCollection = db.collection('files');
      await filesCollection.insertOne(fileDocument);
      const newFile = await this.getFileFromDb(fileDocument._id);
      return newFile;
    } catch (error) {
      console.error('Error in saveFileInDb:', error);
      return null;
    }
  }
}

const dbClient = new DBClient();

export default dbClient;
