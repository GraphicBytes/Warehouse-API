//#####################################################
//#####################################################
//#############                           #############
//#############       WAREHOUSE API       #############
//#############                           #############
//#####################################################
//#####################################################

//################################################
//############### CORE API MODULES ###############
//################################################ 
import express from 'express';
import cors from 'cors';
import multer from 'multer';

//##################################################
//############### CREATE EXPRESS APP ###############
//##################################################
const app = express();

//###########################################
//############### APP OPTIONS ###############
//###########################################
app.use(cors({
  credentials: true
}));
app.use((req, res, next) => {
  app.locals.session_id = null;
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  next();
});
app.use(express.json({ limit: '50000mb' }));
app.disable('x-powered-by');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Set the destination where the files will be saved
    cb(null, 'temp/'); // Change this directory as needed
  },
  filename: (req, file, cb) => {
    // Set the filename of the saved file
    cb(null, file.originalname);
  },
});
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5000 * 1024 * 1024
  }
}); 

//#######################################################
//############### REQUEST HANDLER IMPORTS ###############
//####################################################### 
import handleGetDefault from './handlers/handleGetDefault.js';
import handleTest from './handlers/handleTest.js';
import handleGetFile from './handlers/handleGetFile.js';
import handleNewFile from './handlers/handleNewFile.js';
import handleNewFileProcessing from './handlers/handleNewFileProcessing.js';
import handleGetFileData from './handlers/handleGetFileData.js';
import handleGetWaveFile from './handlers/handleGetWaveFile.js';
import handleGetStats from './handlers/handleGetStats.js';
import handleGetQR from './handlers/handleGetQR.js';
import handleFileImageShorthand from './handlers/handleFileImageShorthand.js';
import handleFileVideoShorthand from './handlers/handleFileVideoShorthand.js'; 

//##############################################
//############### REQUEST ROUTER ###############
//##############################################

///////////////////////////////
////// SYSTEM END POINTS //////
///////////////////////////////

////// BANK NEW FILE //////
app.post('/new-file', upload.fields([
  { name: 'file_1' },
  { name: 'file_2' },
  { name: 'file_3' },
  { name: 'file_4' },
  { name: 'file_5' },
  { name: 'file_6' },
  { name: 'file_7' },
  { name: 'file_8' },
  { name: 'file_9' },
  { name: 'file_10' },
  { name: 'file_11' },
  { name: 'file_12' },
  { name: 'file_13' },
  { name: 'file_14' },
  { name: 'file_15' },
  { name: 'file_16' },
  { name: 'file_17' },
  { name: 'file_18' },
  { name: 'file_19' },
  { name: 'file_20' },
  { name: 'file_21' },
  { name: 'file_22' },
  { name: 'file_23' },
  { name: 'file_24' },
  { name: 'file_25' },
  { name: 'file_26' },
  { name: 'file_27' },
  { name: 'file_28' },
  { name: 'file_29' },
  { name: 'file_30' },
]), (req, res) => {
  handleNewFile(app, req, res);
});

////// NEW FILE PROCESSING //////
app.post('/new-file-processing', (req, res) => {
  handleNewFileProcessing(app, req, res);
});


//////////////////////////
////// QUICK ACCESS //////
//////////////////////////

////// GET FILE //////
app.get('/get/:fromPlatform/:fileSize/:fileID.:requestExt', (req, res) => {
  handleGetFile(app, req, res);
});

////// GET IMAGE //////
app.get('/image/:fromPlatform/:fileID.:requestExt', (req, res) => {
  handleFileImageShorthand(req, res);
});

////// GET VIDEO //////
app.get('/video/:fromPlatform/:fileID.:requestExt', (req, res) => {
  handleFileVideoShorthand(req, res);
});

////// GET FILE //////
app.get('/get-wavefile/:fromPlatform/:fileID.:requestExt', (req, res) => {
  handleGetWaveFile(app, req, res);
});

//////////////////////
////// QR CODES //////
//////////////////////

////// GET STATS //////
app.get('/qr-code/:value.png', upload.none(), (req, res) => {
  handleGetQR(app, req, res);
});

////////////////////////
////// END POINTS //////
////////////////////////

////// TEST FILE //////
app.get('/test/', (req, res) => {
  handleTest(app, req, res);
});

////// GET FILE DATA //////
app.get('/get-data/:fromPlatform/:fileID/', (req, res) => {
  handleGetFileData(app, req, res);
});

////// GET STATS //////
app.post('/get-stats/:fromPlatform/', upload.none(), (req, res) => {
  handleGetStats(app, req, res);
});

/////////////////
////// END //////
/////////////////

////// 404 //////
app.use((req, res) => {
  handleGetDefault(app, req, res);
});

export default app; 