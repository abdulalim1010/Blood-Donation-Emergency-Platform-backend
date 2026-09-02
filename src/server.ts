import "dotenv/config";
import app from "./app.js";
import { connectRedis } from "./app/lib/redis.js";


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();