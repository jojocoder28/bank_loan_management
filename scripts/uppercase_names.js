const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define MONGODB_URI in your .env file");
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully!");

    console.log("Fetching all users...");
    const users = await User.find({});
    console.log(`Found ${users.length} users. Uppercasing names...`);

    let updatedCount = 0;
    for (const user of users) {
      if (user.name) {
        const uppercaseName = user.name.toUpperCase();
        if (user.name !== uppercaseName) {
          user.name = uppercaseName;
          await User.updateOne({ _id: user._id }, { $set: { name: uppercaseName } });
          updatedCount++;
        }
      }
    }

    console.log(`Successfully updated ${updatedCount} user names to uppercase!`);
  } catch (error) {
    console.error("Error running script:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

run();
