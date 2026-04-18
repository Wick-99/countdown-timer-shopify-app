import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
	if (isConnected) return mongoose.connection;

	if (!process.env.MONGODB_URI) {
		throw new Error("MONGODB_URI is not defined in .env");
	}

	try {
		await mongoose.connect(process.env.MONGODB_URI, {
			dbName: "countdown_timer",
		});
		isConnected = true;
		console.log("[mongoose] connected to countdown_timer database");
		return mongoose.connection;
	} catch (err) {
		console.error("[mongoose] connection error:", err.message);
		throw err;
	}
}
