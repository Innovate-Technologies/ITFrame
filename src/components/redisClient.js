import bluebird from "bluebird";
import redis from "redis";

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const redisClient = redis.createClient(6379, "redis");

export default redisClient;
