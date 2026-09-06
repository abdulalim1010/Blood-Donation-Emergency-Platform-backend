import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });


const config = {
  port: process.env.PORT || 5000,

  database_url: process.env.DATABASE_URL!,

  redis_user: process.env.REDIS_USER!,
  redis_password: process.env.REDIS_PASSWORD!,
  redis_host: process.env.REDIS_HOST!,
  redis_port: process.env.REDIS_PORT!,

  jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET!,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN!,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN!,
  
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS!,

  	frontend_url: process.env.FRONTEND_URL,

  google_client_id: process.env.GOOGLE_CLIENT_ID!,

  email_sender: process.env.EMAIL_SENDER!,
  smtp_user: process.env.SMTP_USER!,
	smtp_password: process.env.SMTP_PASSWORD!,
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY!,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET!,  


  node_env: process.env.NODE_ENV || "development",
};

export default config;