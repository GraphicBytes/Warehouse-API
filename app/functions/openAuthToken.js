//###############################################
//############### OPEN AUTH TOKEN ###############
//###############################################

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { decrypt } from './crypt/decrypt.js';
import { logMalicious } from './malicious/logMalicious.js';
import { checkMalicious } from './malicious/checkMalicious.js';
import { getPlatformData } from './getPlatformData.js';
import { theUserIP } from './helpers/theUserIP.js';
import { theEpochTime } from './helpers/theEpochTime.js';
import { theUserAgent } from './helpers/theUserAgent.js';
import { isNullOrEmpty } from './helpers/isNullOrEmpty.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function openAuthToken(app, req, res, platform, tokenString) {
  try {

    let outputResult = false;

    if (
      !isNullOrEmpty(tokenString)
    ) {

      let tokenData = JSON.parse(decrypt(tokenString, process.env.NETWORK_PRIMARY_ENCRYPTION_KEY));
      
      if (tokenData !== null && tokenData !== false) {


        let platformData = await getPlatformData(platform);

        if (platformData) {

          let isMalicious = await checkMalicious(req, platformData);
          let requestTime = theEpochTime();

          let tokenUserID = tokenData.user_id;
          let tokenSuperUser = parseInt(tokenData.super_user);
          let tokenPlatform = tokenData.platform;
          let tokenKillAt = parseInt(tokenData.kill_at);
          let tokenUserAgent = tokenData.user_agent;
          let userIP = theUserIP(req);
          let tokenUserIP = tokenData.user_ip;
          let tokenprivileges = tokenData.privileges;

          let userAgent = theUserAgent(req);  

          if (
            !isMalicious
            && platform === tokenPlatform
            && tokenUserAgent === userAgent
            && tokenKillAt > requestTime
            && (
              (tokenSuperUser === 0)
              || (tokenSuperUser === 1 && tokenUserIP === userIP)
            )
          ) {

            outputResult = {
              user_id: tokenUserID,
              super_user: tokenSuperUser,
              platform: tokenPlatform,
              privileges: tokenprivileges,
            };  

          } else {
            logMalicious(req, "AUTH DATA FAILED TO VALIDATE");
          }
        } else {
          logMalicious(req, "INVALID PLATFORM DATA");
        }
      } else {
        logMalicious(req, "AUTH TOKEN FAILED TO VALIDATE");
      }
    } else {
      logMalicious(req, "NO AUTH TOKEN GIVEN");
    }

    return outputResult;

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    return false;
  }
} 