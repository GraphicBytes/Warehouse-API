//################################################
//###############  HANDLE GET FILE ###############
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
export async function handleGetFile(app, req, res) {
  try {

    let outputResult = "ACCESS DENIED";
    const { fromPlatform, fileSize, fileID, requestExt } = req.params;

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
          if (fileData.public_available === 1) {
            accessAllowed = true
          } else {
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

            if (fileData.data.sizes[fileSize]) {

              let fileType = fileData.file_type;
              let fileLocation = fileData.data.sizes[fileSize].file_location;
              let ext = path.extname(fileLocation);
              let fileExt = ext.slice(1);

              if (requestExt === fileExt) {

                let browserCacheTTL;
                if (fileData.public_available === 1) {
                  browserCacheTTL = 31536000;
                } else {
                  browserCacheTTL = platformData.access_token_ttl;
                }

                const mimeType = getMimeType(fileExt);

                const isDownload = req.query.dl;
                if (isDownload && parseInt(isDownload) === 1 ) {
                  
                  const head = {
                    'Content-Length': fileSize,
                    'Content-Type': mimeType,
                    'Cache-Control': `public, max-age=${browserCacheTTL}`,
                    'Content-Disposition': 'attachment;'
                  };
                  res.writeHead(200, head);
                  fs.createReadStream(fileLocation).pipe(res);
                  return null;

                }

                if (fileType === "image" || fileType === "document" || fileType === "file") {
                  fs.readFile(fileLocation, (err, data) => {
                    if (err) {
                      resSendNotFound(req, res, outputResult);
                      return;
                    } else {
                      resSendFileOk(req, res, data, browserCacheTTL, mimeType);
                      return;
                    }

                  });
                }

                if (fileType === "video" || fileType === "audio") {
                  const stat = fs.statSync(fileLocation);
                  const fileSize = stat.size;
                  const range = req.headers.range;

                  if (range) {
                    const parts = range.replace(/bytes=/, "").split("-");
                    const start = parseInt(parts[0], 10);
                    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                    const chunksize = (end - start) + 1;
                    const file = fs.createReadStream(fileLocation, { start, end });
                    const head = {
                      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                      'Accept-Ranges': 'bytes',
                      'Content-Length': chunksize,
                      'Content-Type': mimeType,
                      'Cache-Control': `public, max-age=${browserCacheTTL}`
                    };
                    res.writeHead(206, head);
                    file.pipe(res);
                  } else {
                    const head = {
                      'Content-Length': fileSize,
                      'Content-Type': mimeType,
                      'Cache-Control': `public, max-age=${browserCacheTTL}`
                    };
                    res.writeHead(200, head);
                    fs.createReadStream(fileLocation).pipe(res);
                  }
                }


              } else {
                logMalicious(req, "TRYING TO ACCESS FILE USING WRONG EXT");
                resSendNotFound(req, res, outputResult);
              }

            } else {
              logMalicious(req, "TRYING TO ACCESS FILE SIZE THAT DOESN'T EXIST");
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

export default handleGetFile;