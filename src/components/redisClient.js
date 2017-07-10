import promisify from "promisify-node";
import redis from "redis";

const redisClient = redis.createClient(6379, "redis");

export default promisify(redisClient, undefined, true);
