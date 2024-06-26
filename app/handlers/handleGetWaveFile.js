//################################################
//###############  HANDLE GET DATA ###############
//################################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import fs from 'fs'; 
import path from 'path';
 
//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { resSendNotFound } from '../functions/resSend/resSendNotFound.js';
import { resSendFileOk } from '../functions/resSend/resSendFileOk.js';
import { md5 } from '../functions/crypt/md5.js';
import { logMalicious } from '../functions/malicious/logMalicious.js';
import { checkMalicious } from '../functions/malicious/checkMalicious.js';
import { getPlatformData } from '../functions/getPlatformData.js';
import { getFileData } from '../functions/getFileData.js';
import { checkAccessToken } from '../functions/checkAccessToken.js';
import { getMimeType } from '../functions/getMimeType.js';
import { theUserIP } from '../functions/helpers/theUserIP.js';
import { theUserAgent } from '../functions/helpers/theUserAgent.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
export async function handleGetWaveFile(app, req, res) {
  try {

    let outputResult = { status: 0, msg: "ACCESS DENIED" }
    const { fromPlatform, fileID } = req.params;

    let platformData = await getPlatformData(fromPlatform);

    if (platformData) {

      let isMalicious = await checkMalicious(req, platformData);

      if (!isMalicious) {

        ///////////////////////////
        ////// Get File Data ////// 
        ///////////////////////////
        let fileData = await getFileData(fromPlatform, fileID);

        if (fileData) {

          let accessAllowed = false;
          let browserCacheTTL;

          if (fileData.public_available === 1) {

            browserCacheTTL = 31536000;
            accessAllowed = true

          } else {

            browserCacheTTL = platformData.access_token_ttl;

            const userIP = md5(theUserIP(req));
            const userAgent = md5(theUserAgent(req));

            accessAllowed = await checkAccessToken(
              fileData.user_group,
              req.query.t,
              userIP,
              userAgent,
              platformData.access_token_ttl)
          }

          if (accessAllowed) {

            let thisfileData = fileData.data;

            outputResult['status'] = 1;
            outputResult['msg'] = "ACCESS GRANTED";

            if (thisfileData.wavefile) {

              let fileLocation = thisfileData.wavefile;

              let ext = path.extname(fileLocation);
              let fileExt = ext.slice(1);
              const mimeType = getMimeType(fileExt);

              fs.readFile(fileLocation, (err, data) => {
                if (err) {
                  resSendNotFound(req, res, outputResult);
                  return;
                } else {
                  resSendFileOk(req, res, data, browserCacheTTL, mimeType);
                  return;
                }

              });

            } else {
              resSendNotFound(req, res, outputResult);
            }

          } else {
            logMalicious(req, "TRYING TO ACCESS RESTRICTED FILE WITHOUT PERIMSSION");
            resSendNotFound(req, res, outputResult);
          }

        } else {
          logMalicious(req, "INVALID FILE ID AND OR PLATFORM TRYING TO ACCESS FILE");
          resSendNotFound(req, res, outputResult);
        }


      } else {
        logMalicious(req, "MALICIOUS USER TRYING TO ACCESS FILE");
        resSendNotFound(req, res, outputResult);
      }

    } else {
      logMalicious(req, "INVALID PLATFORM DATA TRYING TO ACCESS FILE");
      resSendNotFound(req, res, outputResult);
    }

    return null;

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    return null;
  }
}

export default handleGetWaveFile;