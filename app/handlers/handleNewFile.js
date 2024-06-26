//##############################################
//###############  BANK NEW FILE ###############
//############################################## 

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import fs from 'fs';
import path from 'path';

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

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function handleNewFile(app, req, res) {

  let outputResult = { "status": 0 };

  try {

    const networkPassPhrase = decrypt(req.body.networkPassPhrase, process.env.NETWORK_PRIMARY_ENCRYPTION_KEY);

    if (networkPassPhrase === process.env.NETWORK_SUPER_USER_PASSPHRASE) {

      let filePlatform = req.body.filePlatform;
      let fileID = req.body.fileID;
      let fileUploadTime = parseInt(req.body.fileUploadTime + "000");
      let fileUploadIP = req.body.fileUploadIP;
      let fileUploadUseragent = req.body.fileUploadUseragent;
      let fileType = req.body.fileType;
      let fileUserGroup = req.body.fileUserGroup;
      let bePublic = req.body.bePublic
      let fileData = JSON.parse(req.body.fileData);
      let fileMetaRaw = JSON.parse(req.body.fileMeta);

      let originalFilename = null;
      let format = null;
      let details = null;
      let exif = null;

      if (fileMetaRaw.metaData !== undefined) {

        if (fileMetaRaw.metaData.original_filename !== undefined) {
          originalFilename = fileMetaRaw.metaData.original_filename;
        }

        if (fileMetaRaw.metaData.original_meta !== undefined) {
          
          if (fileMetaRaw.metaData.original_meta !== undefined) {
            format = fileMetaRaw.metaData.original_meta;
          }         

          if (fileMetaRaw.metaData.original_meta.fullMeta !== undefined) {
            details = fileMetaRaw.metaData.original_meta.fullMeta;
          }
          
          if (fileMetaRaw.metaData.exif !== undefined) {
            exif = fileMetaRaw.metaData.exif;
          }

        }

      }


      let fileMeta = {
        original_filename: originalFilename,
        format: format,
        details: details || null,
        exif: exif || null,
      }

      if (fileMeta.format !== undefined && fileMeta.format !== null) {
        if (fileMeta.format.fullMeta !== undefined && fileMeta.format.fullMeta !== null) {
          delete fileMeta.format.fullMeta;
        }
      }

      //console.log(fileMetaRaw)
      //console.log(req.body.fileMeta)

      let uploadData = {
        uploader_ip: fileUploadIP,
        uploader_useragent: fileUploadUseragent,
      };

      let platformData = await getPlatformData(filePlatform);

      if (platformData) {

        //////////////////////////////
        ////// FOLDER STRUCTURE //////
        //////////////////////////////

        const date = new Date(fileUploadTime);
        const year = String(date.getUTCFullYear());
        const month = String(date.getUTCMonth() + 1); // Month is 0-indexed, so add 1
        const day = String(date.getUTCDate());

        const folderToSaveTo = "/usr/app/storage/" + year + "/" + month + "/" + day + "/" + fileID + "/";
        const folderToCreate = path.join('/usr/app/storage', year, month, day, fileID);

        const tempFolder = '/usr/app/temp/';

        fs.mkdirSync(folderToCreate, { recursive: true });


        /////////////////////////////
        ////// NEW VIDEO FILES //////
        /////////////////////////////
        if (fileType === "video") {

          let waveformTemp = tempFolder + fileID + "_audio_waveform.webp";
          let waveformPerma = folderToSaveTo + fileID + "_audio_waveform.webp";

          uploadData.sizes = {};
          uploadData.duration = fileMeta.duration;
          uploadData.meta = fileMeta;
          uploadData.stats = fileMeta.stats;

          const asyncForEachVideo = async (array, callback) => {
            for (let index = 0; index < array.length; index++) {
              await callback(array[index], index, array);
            }
          };

          await asyncForEachVideo(Object.entries(fileData), async ([key, value]) => {

            let thisType = value.type;
            let thisSize = value.size;
            let thisFileName = value.file_name;
            let thisWidth = value.width;
            let thisHeight = value.height;
            let thisBitrate = value.bitrate;
            let thisFrameRate = value.frame_rate;

            let thisFileTempLocation = tempFolder + thisFileName;
            let thisFilePermaLocation = folderToSaveTo + thisFileName;

            let fileExists;
            try {
              fs.accessSync(thisFileTempLocation, fs.constants.F_OK);
              fileExists = true;
            } catch (err) {
              fileExists = false;
            }

            if (fileExists) {
              await doVideoFileMove(thisFileTempLocation, thisFilePermaLocation, thisType, thisSize, thisWidth, thisHeight, thisBitrate, thisFrameRate);
            }


            let waveformFileExists;
            try {
              fs.accessSync(waveformTemp, fs.constants.F_OK);
              waveformFileExists = true;
            } catch (err) {
              waveformFileExists = false;
            }

            if (waveformFileExists) {
              await doWavefileMove(waveformTemp, waveformPerma);
            }

          });

          async function doVideoFileMove(tempLocation, permaLocation, type, size, width, height, bitrate, frameRate) {
            return new Promise((resolve) => {
              fs.copyFile(tempLocation, permaLocation, async (err) => {
                if (err) {
                  console.error('Error copying file:', err);
                } else {

                  fs.unlink(tempLocation, (err) => {
                    if (err) {
                      console.error('Error deleting file:', err);
                    }
                  });

                  uploadData.sizes[type] = {
                    size: size,
                    file_location: permaLocation,
                    width: width,
                    height: height,
                    bitrate: bitrate,
                    framerate: frameRate,
                  };

                }

                resolve();
              });
            });
          }





          await filesModel.findOne({ file_id: fileID }, function (err, obj) {
            if (obj) {
              let filter = { file_id: fileID };
              let update = {
                $set: {
                  platform: filePlatform,
                  user_group: fileUserGroup,
                  file_type: fileType,
                  file_time: fileUploadTime,
                  processing: 0,
                  public_available: bePublic,
                  data: uploadData,
                }
              };
              let opts = { upsert: true };
              filesModel.collection.updateOne(filter, update, opts);
            } else {
              filesModel.create({
                platform: filePlatform,
                file_id: fileID,
                user_group: fileUserGroup,
                file_type: fileType,
                file_time: fileUploadTime,
                processing: 0,
                public_available: bePublic,
                data: uploadData,
              });
            }
          });


          await filesModel.findOne({ file_id: fileID }, function (err, obj) {
            if (obj) {
              outputResult.status = 1;
            }
          });
        }



        /////////////////////////////
        ////// NEW AUDIO FILES //////
        /////////////////////////////
        if (fileType === "audio") {

          let waveformTemp = tempFolder + fileID + "_audio_waveform.webp";
          let waveformPerma = folderToSaveTo + fileID + "_audio_waveform.webp";

          uploadData.sizes = {};
          uploadData.duration = fileMeta.duration;
          uploadData.meta = fileMeta;

          const asyncForEachAudio = async (array, callback) => {
            for (let index = 0; index < array.length; index++) {
              await callback(array[index], index, array);
            }
          };

          await asyncForEachAudio(Object.entries(fileData), async ([key, value]) => {

            let thisType = value.type;
            let thisSize = value.size;
            let thisFileName = value.file_name;
            let thisBitrate = value.bitrate;

            let thisFileTempLocation = tempFolder + thisFileName;
            let thisFilePermaLocation = folderToSaveTo + thisFileName;

            let fileExists;
            try {
              fs.accessSync(thisFileTempLocation, fs.constants.F_OK);
              fileExists = true;
            } catch (err) {
              fileExists = false;
            }

            if (fileExists) {
              await doAudioFileMove(thisFileTempLocation, thisFilePermaLocation, thisType, thisSize, thisBitrate);
            }


            let waveformFileExists;
            try {
              fs.accessSync(waveformTemp, fs.constants.F_OK);
              waveformFileExists = true;
            } catch (err) {
              waveformFileExists = false;
            }

            if (waveformFileExists) {
              await doWavefileMove(waveformTemp, waveformPerma);
            }

          });

          async function doAudioFileMove(tempLocation, permaLocation, type, size, bitrate) {
            return new Promise((resolve) => {
              fs.copyFile(tempLocation, permaLocation, async (err) => {
                if (err) {
                  console.error('Error copying file:', err);
                } else {

                  fs.unlink(tempLocation, (err) => {
                    if (err) {
                      console.error('Error deleting file:', err);
                    }
                  });

                  uploadData.sizes[type] = {
                    size: size,
                    file_location: permaLocation,
                    bitrate: bitrate,
                  };

                }

                resolve();
              });
            });
          }

          await filesModel.findOne({ file_id: fileID }, function (err, obj) {
            if (obj) {
              let filter = { file_id: fileID };
              let update = {
                $set: {
                  platform: filePlatform,
                  user_group: fileUserGroup,
                  file_type: fileType,
                  file_time: fileUploadTime,
                  processing: 0,
                  public_available: bePublic,
                  data: uploadData,
                }
              };
              let opts = { upsert: true };
              filesModel.collection.updateOne(filter, update, opts);
            } else {
              filesModel.create({
                platform: filePlatform,
                file_id: fileID,
                user_group: fileUserGroup,
                file_type: fileType,
                file_time: fileUploadTime,
                processing: 0,
                public_available: bePublic,
                data: uploadData,
              });
            }
          });

          await filesModel.findOne({ file_id: fileID }, function (err, obj) {
            if (obj) {
              outputResult.status = 1;
            }
          });

        }




        /////////////////////////////
        ////// NEW IMAGE FILES //////
        /////////////////////////////
        if (fileType === "image") {

          uploadData.sizes = {};
          uploadData.meta = fileMeta;

          const asyncForEachImage = async (array, callback) => {
            for (let index = 0; index < array.length; index++) {
              await callback(array[index], index, array);
            }
          };

          await asyncForEachImage(Object.entries(fileData), async ([key, value]) => {

            let thisType = value.type;
            let thisSize = value.size;
            let thisFileName = value.file_name;
            let thisWidth = value.width;
            let thisHeight = value.height;

            let thisFileTempLocation = tempFolder + thisFileName;
            let thisFilePermaLocation = folderToSaveTo + thisFileName;

            let fileExists;
            try {
              fs.accessSync(thisFileTempLocation, fs.constants.F_OK);
              fileExists = true;
            } catch (err) {
              fileExists = false;
            }

            if (fileExists) {
              await doVideoImageMove(thisFileTempLocation, thisFilePermaLocation, thisType, thisSize, thisWidth, thisHeight);
            }

          });

          async function doVideoImageMove(tempLocation, permaLocation, type, size, width, height) {
            return new Promise((resolve) => {
              fs.copyFile(tempLocation, permaLocation, async (err) => {
                if (err) {
                  console.error('Error copying file:', err);
                } else {

                  fs.unlink(tempLocation, (err) => {
                    if (err) {
                      console.error('Error deleting file:', err);
                    }
                  });

                  uploadData.sizes[type] = {
                    size: size,
                    file_location: permaLocation,
                    width: width,
                    height: height,
                  };

                }

                resolve();
              });
            });
          }


          await filesModel.findOne({ file_id: fileID }, function (err, obj) {
            if (obj) {
              let filter = { file_id: fileID };
              let update = {
                $set: {
                  platform: filePlatform,
                  user_group: fileUserGroup,
                  file_type: fileType,
                  file_time: fileUploadTime,
                  processing: 0,
                  public_available: bePublic,
                  data: uploadData,
                }
              };
              let opts = { upsert: true };
              filesModel.collection.updateOne(filter, update, opts);
            } else {
              filesModel.create({
                platform: filePlatform,
                file_id: fileID,
                user_group: fileUserGroup,
                file_type: fileType,
                file_time: fileUploadTime,
                processing: 0,
                public_available: bePublic,
                data: uploadData,
              });
            }
          });

          await filesModel.findOne({ file_id: fileID }, function (err, obj) {
            if (obj) {
              outputResult.status = 1;
            }
          });

        }



        ////////////////////////////////
        ////// NEW DOCUMENT FILES //////
        ////////////////////////////////
        if (fileType === "document") {

          let documentTemp = tempFolder + fileID + "_original.pdf";
          let documentPerma = folderToSaveTo + fileID + "_original.pdf";

          let thumbnailTemp = tempFolder + fileID + "_thumbnail.webp";
          let thumbnailPerma = folderToSaveTo + fileID + "_thumbnail.webp";

          uploadData.sizes = {};

          let thumbFileExists;
          try {
            fs.accessSync(documentTemp, fs.constants.F_OK);
            thumbFileExists = true;
          } catch (err) {
            thumbFileExists = false;
          }


          let fileExists;
          try {
            fs.accessSync(documentTemp, fs.constants.F_OK);
            fileExists = true;
          } catch (err) {
            fileExists = false;
          }


          if (fileExists) {
            await doDocumentMove(documentTemp, documentPerma);
          }

          if (thumbFileExists) {
            await doDocumentThumbMove(thumbnailTemp, thumbnailPerma, fileData[1].width, fileData[1].height);
          }


          async function doDocumentMove(tempLocation, permaLocation) {
            return new Promise((resolve) => {
              fs.copyFile(tempLocation, permaLocation, async (err) => {
                if (err) {
                  console.error('Error copying file:', err);
                } else {

                  fs.unlink(tempLocation, (err) => {
                    if (err) {
                      console.error('Error deleting file:', err);
                    }
                  });

                  uploadData.sizes["original"] = {
                    file_location: permaLocation
                  };

                }

                resolve();
              });
            });
          }

          async function doDocumentThumbMove(tempLocation, permaLocation, thumbWidth, thumbHeight) {
            return new Promise((resolve) => {
              fs.copyFile(tempLocation, permaLocation, async (err) => {
                if (err) {
                  console.error('Error copying file:', err);
                } else {

                  fs.unlink(tempLocation, (err) => {
                    if (err) {
                      console.error('Error deleting file:', err);
                    }
                  });

                  uploadData.sizes["thumbnail"] = {
                    file_location: permaLocation,
                    width: thumbWidth,
                    height: thumbHeight
                  };

                }

                resolve();
              });
            });
          }




          await filesModel.findOne({ file_id: fileID }, function (err, obj) {
            if (obj) {
              let filter = { file_id: fileID };
              let update = {
                $set: {
                  platform: filePlatform,
                  user_group: fileUserGroup,
                  file_type: fileType,
                  file_time: fileUploadTime,
                  processing: 0,
                  public_available: bePublic,
                  data: uploadData,
                }
              };
              let opts = { upsert: true };
              filesModel.collection.updateOne(filter, update, opts);
            } else {
              filesModel.create({
                platform: filePlatform,
                file_id: fileID,
                user_group: fileUserGroup,
                file_type: fileType,
                file_time: fileUploadTime,
                processing: 0,
                public_available: bePublic,
                data: uploadData,
              });
            }
          });

          await filesModel.findOne({ file_id: fileID }, function (err, obj) {
            if (obj) {
              outputResult.status = 1;
            }
          });

        }



        ///////////////////////////////
        ////// NEW GENERAL FILES //////
        ///////////////////////////////
        if (fileType === "file") {

          let documentTemp = tempFolder + fileData[0].file_name;
          let documentPerma = folderToSaveTo + fileData[0].file_name;

          uploadData.sizes = {};

          let fileExists;
          try {
            fs.accessSync(documentTemp, fs.constants.F_OK);
            fileExists = true;
          } catch (err) {
            fileExists = false;
          }


          if (fileExists) {
            await doFileMove(documentTemp, documentPerma);
          }

          async function doFileMove(tempLocation, permaLocation) {
            return new Promise((resolve) => {
              fs.copyFile(tempLocation, permaLocation, async (err) => {
                if (err) {
                  console.error('Error copying file:', err);
                } else {

                  fs.unlink(tempLocation, (err) => {
                    if (err) {
                      console.error('Error deleting file:', err);
                    }
                  });

                  uploadData.sizes["original"] = {
                    file_location: documentPerma
                  };

                }

                resolve();
              });
            });
          }


          await filesModel.findOne({ file_id: fileID }, function (err, obj) {
            if (obj) {
              let filter = { file_id: fileID };
              let update = {
                $set: {
                  platform: filePlatform,
                  user_group: fileUserGroup,
                  file_type: fileType,
                  file_time: fileUploadTime,
                  processing: 0,
                  public_available: bePublic,
                  data: uploadData,
                }
              };
              let opts = { upsert: true };
              filesModel.collection.updateOne(filter, update, opts);
            } else {
              filesModel.create({
                platform: filePlatform,
                file_id: fileID,
                user_group: fileUserGroup,
                file_type: fileType,
                file_time: fileUploadTime,
                processing: 0,
                public_available: bePublic,
                data: uploadData,
              });
            }
          });

          await filesModel.findOne({ file_id: fileID }, function (err, obj) {
            if (obj) {
              outputResult.status = 1;
            }
          });

        }



        async function doWavefileMove(tempLocation, permaLocation) {
          return new Promise((resolve) => {
            fs.copyFile(tempLocation, permaLocation, async (err) => {
              if (err) {
                console.error('Error copying file:', err);
              } else {

                fs.unlink(tempLocation, (err) => {
                  if (err) {
                    console.error('Error deleting file:', err);
                  }
                });

                uploadData.wavefile = permaLocation;

              }

              resolve();
            });
          });
        } 

      } else {
        logMalicious(req, "NEW FILE INVALID PLATFORM");
      }

      resSendOk(req, res, outputResult);

    } else {

      resSendOk(req, res, outputResult);

      logMalicious(req, "NEW FILE SU PASSPHRASE INVALID");
    }

    return null;

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    return null;
  }
}

export default handleNewFile;