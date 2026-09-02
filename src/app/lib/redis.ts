import { createClient } from "redis";
import config from "../config/index.js";


const redisClient = createClient({
  socket: {
    host: config.redis_host,
    port: Number(config.redis_port),
  },
  username: config.redis_user,
  password: config.redis_password,
});

redisClient.on("error", (error) => {
  console.error("Redis Client Error:", error);
});

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Redis connected successfully");
  }
};

export { redisClient, connectRedis };