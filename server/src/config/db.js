import mongoose from 'mongoose';

export async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  } catch (error) {
    // Never print the URI: it may contain credentials.
    const wrapped = new Error(
      'Could not connect to MongoDB. Start a local MongoDB service or set MONGODB_URI in server/.env ' +
        `to a reachable MongoDB Atlas connection string. (${error.name})`,
    );
    wrapped.code = 'DB_CONNECT_FAILED';
    throw wrapped;
  }
  return mongoose.connection;
}

export const dbState = () =>
  ({ 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' })[
    mongoose.connection.readyState
  ] ?? 'unknown';

export const isDbConnected = () => mongoose.connection.readyState === 1;
