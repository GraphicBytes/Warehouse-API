//#######################################################
//############### Send Image 200 Function ###############
//#######################################################
/// Function tries to include any manual thing like http headers for cors policies etc for files.

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import { URL } from 'url';

////////////////////////////
////// CONFIG IMPORTS //////
//////////////////////////// 
import { allowedOrigins } from '../../config/allowedOrigins.js';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function resSendFileOk(req, res, send, browserCacheTTL, mimeType) {

  const origin = req.get('Referrer');
  if (origin) {

    let parsedUrl = new URL(origin);
    let domain = parsedUrl.origin;

    if (allowedOrigins.includes(domain)) { 
      res.setHeader('Access-Control-Allow-Origin', domain);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Expires', '-1');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Strict-Transport-Security', 'max-age=0; includeSubDomains');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Cache-Control', `public, max-age=${browserCacheTTL}`); // Notice the backticks
  
  res.statusCode = 200;
  res.end(send, 'binary');
  //console.log("------ send ok");
}
