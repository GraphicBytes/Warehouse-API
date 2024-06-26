//###############################################
//############### FILE DATA MODEL ###############
//###############################################

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
const filesSchema = new Schema({
  platform: { type: String, index: true },
  file_id: { type: String, index: true },
  user_group: { type: String, index: true },
  file_type: { type: String, index: true },  
  file_time: { type: Number, index: true }, 
  processing: { type: Number }, 
  views: { type: Number },
  public_available: { type: Number },
  data: { type: Object },
});

//////////////////////////
////// Model Export //////
//////////////////////////
const filesModel = mongoose.model('files', filesSchema);

export { filesModel };