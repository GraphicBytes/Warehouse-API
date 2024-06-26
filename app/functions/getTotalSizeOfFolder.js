//################################################################################
//############### GET TOTAL DISK SIZE OF DATA IN A FOLDER FUNCTION ###############
//################################################################################

/////////////////////////////////////
////// NODE & NPM DEPENDENCIES //////
/////////////////////////////////////
import fs from 'fs';
import path from 'path';

///////////////////////////
////// THIS FUNCTION //////
///////////////////////////
export async function getTotalSizeOfFolder(directoryPath) {
  const stat = fs.statSync(directoryPath);
  let totalSize = stat.size;

  if (stat.isDirectory()) {
    const files = fs.readdirSync(directoryPath);

    for (let file of files) {
      totalSize += await getTotalSizeOfFolder(path.join(directoryPath, file)); // recursive call
    }
  }

  return totalSize;
}


