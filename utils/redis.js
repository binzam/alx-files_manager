import { promisify } from 'util';
import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.connected = false;
    this.client.on('error', (err) => {
      console.error('Redis client error:', err.toString());
      this.client.connected = false;
    });
    this.client.on('connect', () => {
      this.client.connected = true;
    });
    this.asyncSetX = promisify(this.client.setex).bind(this.client);
    this.asyncGet = promisify(this.client.get).bind(this.client);
    this.asyncDel = promisify(this.client.del).bind(this.client);
    this.asyncExpire = promisify(this.client.expire).bind(this.client);
  }

  isAlive() {
    return this.client.connected;
  }

  get(key) {
    return this.asyncGet(key);
  }

  set(key, value, expiry) {
    this.asyncSetX(key, expiry, value);
  }

  del(key) {
    return this.asyncDel(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
