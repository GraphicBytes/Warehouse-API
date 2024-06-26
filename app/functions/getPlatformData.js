//##########################################################
//############### GET PLATFORM DATA FUNCTION ###############
//##########################################################

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { platformsModel } from '../models/platformsModel.js';

////////////////////////////
////// CONFIG IMPORTS //////
////////////////////////////
import options from '../config/options.js'; 

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getPlatformData(platform) { 

  return new Promise((resolve) => {
 
      platformsModel.findOne({ platform: platform }, function (err, obj) { 

        if (obj) { 
          resolve(obj.data);

        } else { 
          resolve(false);
        }
      });
 
  });
}
