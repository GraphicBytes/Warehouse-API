//################################################################
//############### MALICIOUS USER AGENTS DATA MODEL ###############
//################################################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import mongoose from 'mongoose';

/////////////////////////////////
////// Connect to Mongoose //////
/////////////////////////////////
mongoose.connect(
  "mongodb://" + process.env.DB_USER + ":" + process.env.DB_PASSWORD + "@mongodb:27017/" + process.env.DB_DATABASE + "?authSource=admin",
  {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 2000,
  },
  (err) => {
    if (err) {
      console.error('FAILED TO CONNECT TO MONGODB');
    } else {
      //console.log('CONNECTED TO MONGODB');
    }
  }
);

/////////////////////////////
////// Mongoose Schema //////
/////////////////////////////
const Schema = mongoose.Schema;
const maliciousUserAgentsSchema = new Schema({
  agent_hash: { type: String, index: true },
  user_agent: { type: String },
  agent_ip: { type: String },
  attempts: { type: Number },
  last_attempt: { type: Number, index: true },
});

//////////////////////////
////// Model Export //////
//////////////////////////
const maliciousUserAgentsModel = mongoose.model('malicious_useragents', maliciousUserAgentsSchema);

export { maliciousUserAgentsModel };