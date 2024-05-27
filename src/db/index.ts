import mongoose from "mongoose";
import { getSecrets } from "../secrets";

let isConnected: boolean = false;

const connectDB = async () => {
  if (isConnected) {
    console.log("DB Connection => using existing database connection");
    return;
  }

  const { MONGODB_SECRET_NAME, REGION, NODE_ENV } = process.env;
  // This is only for local environment
  if (NODE_ENV === "local") {
    const URI = process.env.MONGODB_URI!;
    try {
      console.log("DB Connection => using new database connection", URI);
      await mongoose.connect(URI, { dbName: process.env.MONGODB_DBNAME });
      isConnected = true;
    } catch (e) {
      console.error(e);
    }
    return;
  }

  if (!MONGODB_SECRET_NAME || !REGION) {
    console.error("MongoDB Secret name or region are missing");
    return;
  }
  const mongoDBSecrets = await getSecrets({
    secretName: MONGODB_SECRET_NAME,
    region: REGION,
  });
  console.log("Secrets Obtained", mongoDBSecrets);
  const mongoUser = mongoDBSecrets["dbUser"];
  const mongoPassword = mongoDBSecrets["dbPassword"];
  const mongoDBName = mongoDBSecrets["dbName"];
  const connectionString = mongoDBSecrets["connectionString"].replace(
    "mongodb+srv://",
    "",
  );
  const URI = `mongodb+srv://${mongoUser}:${mongoPassword}@${connectionString}`;

  try {
    console.log("DB Connection => using new database connection", URI);
    await mongoose.connect(URI, { dbName: mongoDBName });
    isConnected = true;
  } catch (e) {
    console.error(e);
  }
};

export default connectDB;
