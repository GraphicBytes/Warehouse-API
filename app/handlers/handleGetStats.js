//###############################################
//############### CHECK GET STATS ###############
//###############################################

////////////////////////////////
////// DATA MODEL IMPORTS //////
////////////////////////////////
import { filesModel } from '../models/filesModel.js';

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { resSendOk } from '../functions/resSend/resSendOk.js'; 
import { resSendNotFound } from '../functions/resSend/resSendNotFound.js';
import { logMalicious } from '../functions/malicious/logMalicious.js';
import { checkMalicious } from '../functions/malicious/checkMalicious.js';
import { openAuthToken } from '../functions/openAuthToken.js';
import { getPlatformData } from '../functions/getPlatformData.js';
import { getTotalSizeOfFolder } from '../functions/getTotalSizeOfFolder.js';
import { isNullOrEmpty } from '../functions/helpers/isNullOrEmpty.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
export async function handleGetStats(app, req, res) {
  try {

    let outputResult = { "status": 0 };

    const { fromPlatform } = req.params;

    let platformData = await getPlatformData(fromPlatform);

    if (platformData) {

      let isMalicious = await checkMalicious(req, platformData);

      if (!isMalicious) {
        if (
          !isNullOrEmpty(req.body.admin_token)
        ) {

          let openedAuthToken = await openAuthToken(app, req, res, fromPlatform, req.body.admin_token);

          let inGroups=[]
          let userPrivileges = Object.keys(openedAuthToken.privileges);
          for (const privilege of userPrivileges) {
           
            if (openedAuthToken.privileges[privilege].warehouse.view_files === 1) {
              inGroups.push(privilege);
            }            
          }

          let totalFiles = 0;
          let totalDownloads = 0;
                   
          let outputResult = {
            total_files: 0,
            total_downloads: 0,
            total_size: 1
          }

          let totalSize = await getTotalSizeOfFolder("/usr/app/storage/");
          
          outputResult.total_size = totalSize


          if (openedAuthToken.super_user === 1) {
          
            await filesModel.find({
              platform: fromPlatform
            }, function (err, obj) {
              if (obj) {
                
                for (const record of obj) {
  
                  if (record.views !== undefined) {
                    totalDownloads = totalDownloads + parseInt(record.views);
                  }
                  totalFiles++
  
                }
  
                outputResult.total_files = totalFiles;
                outputResult.total_downloads = totalDownloads;
  
                resSendOk(req, res, outputResult);  
  
              } else {
                resSendNotFound(req, res, outputResult);
              }
  
            });

          } else {
            

            await filesModel.find({
              platform: fromPlatform,
              user_group: { $in: inGroups }
            }, function (err, obj) {
              if (obj) {
                
                for (const record of obj) {
  
                  if (record.views !== undefined) {
                    totalDownloads = totalDownloads + parseInt(record.views);
                  }
                  totalFiles++
  
                }
  
                outputResult.total_files = totalFiles;
                outputResult.total_downloads = totalDownloads;
                
  
                resSendOk(req, res, outputResult);
  
  
              } else {
                resSendNotFound(req, res, outputResult);
              }
  
            });

          }
          

        } else {
          logMalicious(req, "MALICIOUS USER TRYING TO ACCESS FILE STATS");
          resSendNotFound(req, res, outputResult);
        }

      } else {
        logMalicious(req, "MALICIOUS USER TRYING TO ACCESS FILE STATS");
        resSendNotFound(req, res, outputResult);
      }

    } else {
      logMalicious(req, "INVALID PLATFORM DATA TRYING TO ACCESS FILE STATS");
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

export default handleGetStats;