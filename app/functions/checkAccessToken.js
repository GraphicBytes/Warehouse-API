//##################################################
//############### CHECK ACCESS TOKEN ###############
//##################################################

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { decrypt } from './crypt/decrypt.js';
import { theEpochTime } from './helpers/theEpochTime.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function checkAccessToken(fileGroup, accessToken, ip, agent, tokenTTL) {

  return new Promise((resolve) => {

    if (accessToken) {

      let theAccessToken = accessToken.replace("_", '.');
      let decryptedTokenData = JSON.parse(decrypt(theAccessToken, process.env.NETWORK_MINOR_ENCRYPTION_KEY));

      if (decryptedTokenData) { 

        let requestTime = theEpochTime();
        let tokenCutOFf = requestTime - tokenTTL;

        if (
          agent === decryptedTokenData.user_agent
          && ip === decryptedTokenData.user_ip
          && decryptedTokenData.created > tokenCutOFf
        ) {

          let validGroup = false;
          let userGroups = decryptedTokenData.groups;



          for (const key in userGroups) { 
            if (userGroups.hasOwnProperty(key)) { 
              const value = userGroups[key];
              if (value === fileGroup) { 
                validGroup = true;
              }
            }
          }

          if (decryptedTokenData.bypass_perms === 1 || decryptedTokenData.bypass_perms === '1') {
            validGroup = true;
          }

          resolve(validGroup);

        } else {
          resolve(false);
        }

      } else {
        resolve(false);
      }

    } else {
      resolve(false);
    }

  });
}
