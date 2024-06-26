//#######################################################
//############### Get user agent Function ###############
//#######################################################

export function theUserAgent(req) {

  let userAgent = "BLANK USER AGENT";

  if (typeof req.headers['user-agent'] !== 'undefined') {
    userAgent = req.headers['user-agent'];
  }

  return userAgent;

}