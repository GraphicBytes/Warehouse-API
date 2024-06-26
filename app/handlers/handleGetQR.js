//###########################################
//############### GET QR CODE ###############
//###########################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import QRCode from 'qrcode'

//////////////////////////////
////// FUNCTION IMPORTS //////
//////////////////////////////
import { resSendOk } from '../functions/resSend/resSendOk.js';

//////////////////////////
////// THIS HANDLER //////
//////////////////////////
export async function handleGetQR(app, req, res) {
  try {

    let outputResult = { "status": 0 };

    const { value } = req.params;

    if (value && value.length > 1 && value.length < 500) {
      
          // With async/await
      await QRCode.toDataURL(value, { version: 2, margin: 2, scale: 50 })
        .then(image => {

          // Extract the content type and encoded data from the string
          const prefix = "data:image/png;base64,";
          const base64Data = image.replace(prefix, "");

          // Decode base64 (convert ascii to binary)
          const decodedImage = Buffer.from(base64Data, 'base64');

          // Set the content type and send the image content as binary
          res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': decodedImage.length
          });
          res.end(decodedImage);

        })
        .catch(err => {
          resSendOk(req, res, outputResult);
        })


      return null;
      
    } else {
      resSendOk(req, res, outputResult);
    }

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    return null;
  }
}

export default handleGetQR;