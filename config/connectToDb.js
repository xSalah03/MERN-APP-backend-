const mongoose = require('mongoose');

module.exports.connectToDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB :)');
    } catch (error) {
        console.log('Connection failed to MongoDB!', error);
    }
}