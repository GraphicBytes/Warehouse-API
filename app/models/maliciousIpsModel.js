//#############################################################
//############### MALICIOUS USER IPS DATA MODEL ###############
//#############################################################

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
const maliciousIpsSchema = Schema({
  ip: { type: String, index: true },
  attempts: { type: Number },
  last_attempt: { type: Number, index: true },
});

//////////////////////////
////// Model Export //////
//////////////////////////
const maliciousIpsModel = mongoose.model('malicious_ips', maliciousIpsSchema);

export { maliciousIpsModel };