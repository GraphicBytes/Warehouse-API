//###########################################
//############### HANDLE TEST ###############
//###########################################
 
//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { resSendOk } from '../functions/resSend/resSendOk.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
export async function handleTest(app, req, res) {
  try {

    let outputResult = { "status": 1 };







    resSendOk(req, res, outputResult);

    return null;

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    return null;
  }
}

export default handleTest;