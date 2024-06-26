//###########################################################
//###############  HANDLE NEW FILE PROCESSING ###############
//###########################################################

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { filesModel } from '../models/filesModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { resSendOk } from '../functions/resSend/resSendOk.js';
import { decrypt } from '../functions/crypt/decrypt.js';
import { logMalicious } from '../functions/malicious/logMalicious.js';
import { getPlatformData } from '../functions/getPlatformData.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
export async function handleNewFileProcessing(app, req, res) {
 
  try {

    let outputResult = {
      "status": 0,
      "qry": 0
    };

    //console.log(req.body)

    const networkPassPhrase = decrypt(req.body.networkPassPhrase, process.env.NETWORK_PRIMARY_ENCRYPTION_KEY);

    if (networkPassPhrase === process.env.NETWORK_SUPER_USER_PASSPHRASE) { 

      let filePlatform = req.body.filePlatform;
      let fileID = req.body.fileID;
      let fileUserGroup = req.body.fileUserGroup;
      let fileBePublic = req.body.bePublic;
      let filedata = {};
  
      let platformData = await getPlatformData(filePlatform);
  
      if (platformData) {

        await filesModel.findOne({ file_id: fileID }, function (err, obj) {
          if (obj) {

            outputResult['status'] = 1;
            outputResult['qry'] = 1;
            outputResult['message'] = "FILE ALREADY EXISTS";
            resSendOk(req, res, outputResult);

          } else {

            filesModel.create({
              platform: filePlatform,
              file_id: fileID,
              user_group: fileUserGroup,
              file_type: "0",
              file_time: "0",
              processing: 1,
              public_available: fileBePublic,
              data: filedata,
            });

            outputResult['status'] = 1;
            outputResult['qry'] = 1;
            resSendOk(req, res, outputResult);
            
          }
        });

      } else {

        outputResult['message'] = "INVALID PLATFORM";
        logMalicious(req, "NEW FILE PROCESS INVALID PLATFORM");
        resSendOk(req, res, outputResult);

      }
   

    } else {

      outputResult['message'] = "SU PASSPHRASE INVALID";

      resSendOk(req, res, outputResult);

      //logMalicious(req, "NEW FILE SU PASSPHRASE INVALID");
    }




  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    return null;
  }
}

export default handleNewFileProcessing;