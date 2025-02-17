import dotenv from "dotenv";

dotenv.config();

const buildConnectionString = ({ username, password, host, port, dbname }) => {
  return `postgres://${username}:${password}@${host}:${port}/${dbname}?sslmode=require`;
};

export const TSDB_CONFIG = {
  DB_URL: buildConnectionString({
    username: process.env.TSDB_USERNAME,
    password: process.env.TSDB_PASSWORD,
    host: process.env.TSDB_HOST,
    port: process.env.TSDB_PORT,
    dbname: process.env.TSDB_NAME,
  }),
};
