//############################################
//############### DEFAULT PAGE ###############
//############################################
 
//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { resSendNotFound } from '../functions/resSend/resSendNotFound.js'; 
import { logMalicious } from '../functions/malicious/logMalicious.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
export async function handleGetDefault(app, req, res) {
  try {

    let outputResult = { "status": 0 };

    //no one should be trying to access blank domain
    logMalicious(req, "USER HIT DEFAULT PAGE");
    resSendNotFound(req, res, outputResult);

    return null;

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
    
    return null;
  }
}

export default handleGetDefault;