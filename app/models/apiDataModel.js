//##############################################
//############### API DATA MODEL ###############
//##############################################

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
const apiDataModelSchema = new Schema({
  meta_key: { type: String, index: true, unique: true },
  meta_value: { type: String },
});

//////////////////////////
////// Model Export //////
//////////////////////////
const apiDataModel = mongoose.model('api_datas', apiDataModelSchema);

export { apiDataModel };




