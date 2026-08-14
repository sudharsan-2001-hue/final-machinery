const mongoose = require('mongoose');
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require('dotenv').config();

async function run() {
  try {
    console.log("Connecting to:", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected!");
    
    const complaintsCol = mongoose.connection.db.collection('complaints');
    
    const complaints = await complaintsCol.find({ customerVoiceUrl: { $ne: null } }).toArray();
    console.log(`Found ${complaints.length} complaints with customer voice messages:`);
    complaints.forEach(c => {
      console.log(`- ID: ${c._id}, Title: "${c.title}", customerVoiceUrl: "${c.customerVoiceUrl}", voiceReplyUrl: "${c.voiceReplyUrl}"`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
