//##########################################################
//###############  HANDLE GET FILE SHORTHAND ###############
//##########################################################

export async function handleGetFile(app, req, res) {
  try {

    let outputResult = "ACCESS DENIED";
    const { fromPlatform, fileID, requestExt } = req.params;

    let platformData = await getPlatformData(fromPlatform);

    if (platformData) {

      let isMalicious = await global.checkMalicious(req, platformData);

      if (!isMalicious) {

        ///////////////////////////
        ////// Get File Data ////// 
        ///////////////////////////
        let fileData = await getFileData(fromPlatform, fileID);

        if (fileData) {

          let accessAllowed = false;
          if (fileData.public_available === 1) {
            accessAllowed = true
          } else {
            const userIP = md5(theUserIP(req));
            const userAgent = md5(theUserAgent(req));

            let accessToken = req.query.t;

            accessAllowed = await checkAccessToken(
              fileData.user_group,
              accessToken,
              userIP,
              userAgent,
              platformData.access_token_ttl
            )

          }

          if (accessAllowed) {

            const sizesData = fileData.data.sizes;

            let currentAcceptedFile = "";
            let currentAcceptedWidth = 0;

            let width = 16;
            let height = req.query.h;

            if (req.query.w !== undefined) {
              width = req.query.w;
            }
            if (req.query.h !== undefined) {
              height = req.query.h;
            }

            console.log(width)
            console.log(height)

            for (const key in sizesData) {
              if (sizesData.hasOwnProperty(key)) {

                if (key !== "original") {

                  let thisWidth = sizesData[key].width;

                  let isThisNumberCloser = Math.abs(thisWidth - width) < Math.abs(currentAcceptedWidth - width);

                  if (isThisNumberCloser || currentAcceptedWidth === 0) {

                    currentAcceptedWidth = thisWidth;
                    currentAcceptedFile = sizesData[key].file_location;
                  }

                }
              }
            }


            let fileLocation = currentAcceptedFile;
            let ext = path.extname(fileLocation);
            let fileExt = ext.slice(1);
            if (requestExt === fileExt) {


              console.log(currentAcceptedWidth)
              console.log(currentAcceptedFile)

            } else {
              logMalicious(req, "TRYING TO ACCESS FILE USING WRONG EXT");
              resSendNotFound(res, outputResult);
            }


            resSendNotFound(res, outputResult);

          } else {
            logMalicious(req, "TRYING TO ACCESS RESTRICTED FILE WITHOUT PERIMSSION");
            resSendNotFound(res, outputResult);
          }

        } else {
          logMalicious(req, "INVALID FILE ID AND OR PLATFORM TRYING TO ACCESS FILE");
          resSendNotFound(res, outputResult);
        }


      } else {
        logMalicious(req, "MALICIOUS USER TRYING TO ACCESS FILE");
        resSendNotFound(res, outputResult);
      }

    } else {
      logMalicious(req, "INVALID PLATFORM DATA TRYING TO ACCESS FILE");
      resSendNotFound(res, outputResult);
    }

    return null;

  } catch (error) {

    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }

    return null;
  }
}

export default handleGetFile;