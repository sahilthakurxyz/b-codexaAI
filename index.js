import "dotenv/config";
process.on("uncaughtException", (err) => {
  console.log(`Uncaught Expception ${err.name}: ${err.message}`);
  process.exit(1);
});
import { app } from "./app.js";
import { connectDb } from "./src/config/database.js";
const Port = process.env.PORT;

const startServer = async () => {
  try {
    await connectDb();
    const server = app.listen(Port, () => {
      console.log(`Server Listen on ${Port}`);
    });
    process.on("unhandledRejection", (err) => {
      console.log(`Unhandled Rejection ${err.name} ${err.message}`);
      server.close(() => {
        process.exit(1);
      });
    });
  } catch (err) {
    console.log(`startup Error: ${err.message}`);
  }
};
startServer();
