
//#############################################
//############### GET MIME TYPE ###############
//#############################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import mime from 'mime-types';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export function getMimeType(ext) {
  return mime.lookup(ext) || 'application/octet-stream';
}