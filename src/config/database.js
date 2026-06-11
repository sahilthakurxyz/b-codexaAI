import mongoose from "mongoose";

export const connectDb = async () => {
  await mongoose
    .connect(process.env.DB_URI)
    .then((data) => {
      console.log(`Database is connect at: ${data.connection.host}`);
    })
    .catch((err) => {
      console.log(`Database Error : ${err}`);
    });
};
