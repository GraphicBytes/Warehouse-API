//##########################################################
//############### GET PLATFORM DATA FUNCTION ###############
//##########################################################

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { filesModel } from '../models/filesModel.js';

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import options from '../config/options.js'; 

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getFileData(platform, fileID) {
  
  return new Promise((resolve) => {
 
      filesModel.findOne({ platform: platform, file_id: fileID }, function (err, obj) {

        if (process.env.NODE_ENV === "development" && options.devConsoleOutput === 1) {
          console.log("---DB: looked for file data");
        }

        if (obj) { 
          resolve(obj);

        } else { 
          resolve(false);
        }
      }); 
  });
}
