// Test script
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/prompt";

const channelSchema = new mongoose.Schema(
  {
    handle: { type: String, required: true },
    name: { type: String, required: true },
    videoFormat: { type: String, enum: ['long', 'short'], default: 'long' }
  },
  { _id: false },
);

const competitorTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    videosPerChannel: { type: Number, default: 30, min: 1, max: 200 },
    channels: [channelSchema],
  },
  { timestamps: true },
);

const CompetitorType = mongoose.model("CompetitorTypeTest", competitorTypeSchema);

async function test() {
  await mongoose.connect(uri);
  console.log("Connected");

  const type = await CompetitorType.create({
    name: "TestType_" + Date.now(),
    channels: [
      { handle: "Test1", name: "Test 1" },
      { handle: "Test2", name: "Test 2" }
    ]
  });

  const doc = await CompetitorType.findById(type._id);
  const before = doc.channels.length;
  doc.channels = doc.channels.filter(ch => ch.handle.toLowerCase() !== 'test1');
  
  if (doc.channels.length === before) {
      console.log("Mongoose didn't filter the array length!");
  } else {
      await doc.save();
      const verify = await CompetitorType.findById(type._id);
      console.log("Length after save:", verify.channels.length);
  }

  await CompetitorType.findByIdAndDelete(type._id);
  process.exit(0);
}

test().catch(err => {
    console.error(err);
    process.exit(1);
});
