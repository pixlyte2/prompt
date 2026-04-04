const mongoose = require('mongoose');
const CompetitorType = require('./models/CompetitorType');
const uri = require('./config/db') || 'mongodb://localhost:27017/prompt';

mongoose.connect(uri)
  .then(async () => {
    console.log("Connected");
    // Create dummy
    const type = new CompetitorType({
      name: "TestType_" + Date.now(),
      channels: [
        { handle: "Test1", name: "Test 1" },
        { handle: "Test2", name: "Test 2" }
      ]
    });
    await type.save();
    
    // Test remove via filter
    const doc = await CompetitorType.findById(type._id);
    const before = doc.channels.length;
    doc.channels = doc.channels.filter(ch => ch.handle.toLowerCase() !== 'test1');
    if (doc.channels.length === before) {
        console.log("Not filtered");
    } else {
        await doc.save();
        const verify = await CompetitorType.findById(type._id);
        console.log("Length after save:", verify.channels.length);
    }
    
    await CompetitorType.findByIdAndDelete(type._id);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
