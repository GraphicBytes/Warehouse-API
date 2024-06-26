//################################################
//###############  HANDLE GET DATA ###############
//################################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import mimeDb from 'mime-db';
import path from 'path';

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { filesModel } from '../models/filesModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { resSendOk } from '../functions/resSend/resSendOk.js';
import { resSendNotFound } from '../functions/resSend/resSendNotFound.js';
import { md5 } from '../functions/crypt/md5.js';
import { logMalicious } from '../functions/malicious/logMalicious.js';
import { checkMalicious } from '../functions/malicious/checkMalicious.js';
import { getPlatformData } from '../functions/getPlatformData.js';
import { getFileData } from '../functions/getFileData.js';
import { checkAccessToken } from '../functions/checkAccessToken.js';
import { theUserIP } from '../functions/helpers/theUserIP.js';
import { theUserAgent } from '../functions/helpers/theUserAgent.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
export async function handleGetFileData(app, req, res) {
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

            let thisfileData = fileData.data;

            if (fileData.processing === 0) {

              outputResult['status'] = 1;
              outputResult['msg'] = "ACCESS GRANTED";
              outputResult['file_type'] = fileData.file_type;

              const fileTypes = {
                // Image Formats
                'psd': 'Photoshop',
                'ai': 'Illustrator',
                'png': 'Image',
                'jpg': 'Image',
                'jpeg': 'Image',
                'gif': 'Image',
                'bmp': 'Image',
                'tiff': 'Image',
                'svg': 'VectorGraphic',
                // Video Formats
                'mp4': 'Video',
                'mov': 'Video',
                'avi': 'Video',
                'flv': 'Video',
                'wmv': 'Video',
                'mkv': 'Video',
                // Audio Formats
                'mp3': 'Audio',
                'wav': 'Audio',
                'aac': 'Audio',
                'flac': 'Audio',
                'ogg': 'Audio',
                'm4a': 'Audio',
                // Document Types
                'pdf': 'PDF',
                'doc': 'Word',
                'docx': 'Word',
                'xls': 'Excel',
                'xlsx': 'Excel',
                'xlsxs': 'Excel',
                'ppt': 'PowerPoint',
                'pptx': 'PowerPoint',
                'txt': 'Text',
                'rtf': 'Text',
                // Programming and Scripting Languages
                'js': 'JavaScript',
                'jsx': 'ReactJS',
                'ts': 'TypeScript',
                'tsx': 'ReactTypeScript',
                'py': 'Python',
                'java': 'Java',
                'rb': 'Ruby',
                'php': 'PHP',
                'cpp': 'C++',
                'c': 'C',
                'cs': 'C#',
                'go': 'Go',
                'swift': 'Swift',
                'sh': 'ShellScript',
                'bat': 'BatchScript',
                'html': 'HTML',
                'css': 'CSS',
                'json': 'JSON',
                'xml': 'XML',
                'yaml': 'YAML',
                'md': 'Markdown',
                // 3D and CAD Formats
                'dwg': 'AutoCAD',
                'skp': 'SketchUp',
                '3ds': '3dsMax',
                'blend': 'Blender',
                'c4d': 'Cinema4D',
                'stl': '3DPrint',
                // Specialized Formats
                'zip': 'Compressed',
                'rar': 'Compressed',
                '7z': 'Compressed',
                'gz': 'Compressed',
                'tar': 'Compressed',
                'iso': 'DiskImage',
                'dmg': 'DiskImage',
                // Other Software Specific Formats
                'indd': 'InDesign',
                'aep': 'AfterEffects',
                'prproj': 'PremierePro',
                'mdb': 'Access',
                'accdb': 'Access',
                'pub': 'Publisher',
                'vsd': 'Visio',
                'pages': 'Pages'
              };

              const getFileType = (extension) => {
                if (fileTypes[extension]) {
                  return fileTypes[extension];
                }

                let type = 'unknown';
                Object.keys(mimeDb).forEach((mime) => {
                  const mimeInfo = mimeDb[mime];
                  if (mimeInfo.extensions && mimeInfo.extensions.includes(extension)) {
                    [type] = mime.split('/');
                  }
                });

                return type;
              };

              if (thisfileData.meta !== undefined) {

                if (thisfileData.meta.original_filename !== undefined) {

                  if (thisfileData.meta.original_filename !== null) {                   

                    const originalExt = path.extname(thisfileData.meta.original_filename);
                    const originalExtWithoutDot = originalExt.slice(1);
                    outputResult['file_type'] = getFileType(originalExtWithoutDot);

                  }
                }

              } else {

                const originalExt = path.extname(thisfileData.sizes.original.file_location);
                const originalExtWithoutDot = originalExt.slice(1);
                outputResult['file_type'] = getFileType(originalExtWithoutDot);

              }





              for (let key in thisfileData.sizes) {

                let thisDlPath;
                let thisPath =
                  "https://" +
                  platformData.base_url + "/get/" +
                  fileData.platform + "/" +
                  key + "/" +
                  fileData.file_id +
                  path.extname(thisfileData.sizes[key].file_location);

                if (req.query.t) {
                  thisPath = thisPath + "?t=" + req.query.t;
                  thisDlPath = thisPath + "&dl=1";
                } else {
                  thisDlPath = thisPath + "?dl=1";
                }

                thisfileData.sizes[key].file_location = thisPath;
                thisfileData.sizes[key].dl_file_location = thisDlPath;
                //delete thisfileData.sizes[key].file_location; 
              }

              if (thisfileData.wavefile) {

                let waveFilePath =
                  "https://" +
                  platformData.base_url + "/get-wavefile/" +
                  fileData.platform + "/" +
                  fileData.file_id +
                  ".webp";

                if (req.query.t) {
                  waveFilePath = waveFilePath + "?t=" + req.query.t
                }

                thisfileData.wavefile = true;
                thisfileData.wavefilePath = waveFilePath;
              }

              let currentViews = (fileData.views === undefined ? 0 : fileData.views) + 1;

              let filter = { file_id: fileID };
              let update = {
                $set: {
                  views: currentViews
                }
              };
              let opts = { upsert: true };
              filesModel.collection.updateOne(filter, update, opts);

              delete thisfileData.uploader_ip;
              delete thisfileData.uploader_useragent;

              outputResult['file_data'] = thisfileData;

            } else if (fileData.processing === 1) {

              outputResult['status'] = 2;
              outputResult['msg'] = "FILE PROCESSING";
              outputResult['file_type'] = fileData.file_type;

            } else {

              outputResult['status'] = 0;
              outputResult['msg'] = "FILE NOT FOUND";
              outputResult['file_type'] = fileData.file_type;
              logMalicious(req, "TRYING TO ACCESS RESTRICTED FILE WITHOUT PERIMSSION");
            }

            resSendOk(req, res, outputResult);


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

export default handleGetFileData;