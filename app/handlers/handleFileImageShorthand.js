//##########################################################
//###############  HANDLE GET FILE SHORTHAND ###############
//##########################################################

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
export async function handleFileImageShorthand(req, res) {
  try {
    
    let outputResult = "ACCESS DENIED 2";
    const { fromPlatform, fileID, requestExt } = req.params;

    let platformData = await getPlatformData(fromPlatform);

    if (platformData) {

      let isMalicious = await checkMalicious(req, platformData);

      if (!isMalicious) {

        ///////////////////////////
        ////// Get File Data ////// 
        ///////////////////////////
        let fileData = await getFileData(fromPlatform, fileID);

        if (fileData) {

          let fileType = fileData.file_type;

          let accessAllowed = false;
          if (fileData.public_available === 1) {
            accessAllowed = true
          } else {
            const userIP = md5(theUserIP(req));
            const userAgent = md5(theUserAgent(req));

            let accessToken = req.query.t;

            accessAllowed = await checkAccessToken(
              fileData.user_group,
              accessToken,
              userIP,
              userAgent,
              platformData.access_token_ttl
            )
          }

          if (accessAllowed) {

            if (fileType === "image" || fileData.processing === 1) {

              let currentAcceptedFile = "";

              if (fileData.processing === 0) {

                const sizesData = fileData.data.sizes;

                let fallbackFile = "";
                let currentBestMatch = Infinity; // This will store the smallest difference found that covers the space
                let largestImage = {
                  file: "",
                  width: 0,
                  height: 0
                };
                // Parse the query parameters, ensuring they default to some value if not provided.
                let requestedWidth = parseInt(req.query.w) || 8;  // Default value can be adjusted
                let requestedHeight = parseInt(req.query.h) || 8; // Default value can be adjusted

                for (const key in sizesData) {
                  if (sizesData.hasOwnProperty(key)) {
                    if (key !== "original") { // Assuming you still want to skip 'original'

                      let thisWidth = sizesData[key].width;
                      let thisHeight = sizesData[key].height;

                      // Check if this image is larger in both dimensions compared to the current largest image.
                      if (thisWidth > largestImage.width && thisHeight > largestImage.height) {
                        largestImage.file = sizesData[key].file_location;
                        largestImage.width = thisWidth;
                        largestImage.height = thisHeight;
                      }

                      // Check if this image covers the requested space
                      if (thisWidth >= requestedWidth && thisHeight >= requestedHeight) {
                        // This image is big enough in both dimensions. Now we check if it's a better fit than the current best match.

                        // Calculate how much larger this image is than the requested size.
                        let excessSize = (thisWidth - requestedWidth) * (thisHeight - requestedHeight);

                        // Is it a better fit than our current best match?
                        if (excessSize < currentBestMatch) {
                          currentBestMatch = excessSize;
                          currentAcceptedFile = sizesData[key].file_location;
                        }
                      }
                    } else {

                      let thisWidth = sizesData["original"].width;
                      let thisHeight = sizesData["original"].height;

                      largestImage.file = sizesData["original"].file_location;
                      largestImage.width = thisWidth;
                      largestImage.height = thisHeight;

                      fallbackFile = sizesData["original"].file_location;
                    }
                  }
                }

                if (currentAcceptedFile === "") {
                  currentAcceptedFile = largestImage.file;
                }

                if (currentAcceptedFile === "") {
                  currentAcceptedFile = fallbackFile
                }

              } else {
                currentAcceptedFile = "/usr/app/assets/processing-image.gif";
              }

              

              let fileLocation = currentAcceptedFile;
              let ext = path.extname(fileLocation);
              let fileExt = ext.slice(1);


              let browserCacheTTL;
              if (fileData.public_available === 1) {
                browserCacheTTL = 31536000;
              } else {
                browserCacheTTL = platformData.access_token_ttl;
              }

              res.setHeader('Access-Control-Expose-Headers', 'x-processing');

              if (fileData.processing === 1) {
                browserCacheTTL = 0;
                res.setHeader('x-processing', 1);
              } else {
                res.setHeader('x-processing', 0);
              }

              if (currentAcceptedFile === undefined || currentAcceptedFile === "") {
                browserCacheTTL = 0;
              }

              const mimeType = getMimeType(fileExt);

              fs.readFile(currentAcceptedFile, (err, data) => {
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

export default handleFileImageShorthand;