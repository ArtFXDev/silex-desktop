const fs = require('fs');
const path = require('path')
const archiver = require('archiver')
const extract = require('extract-zip');
const { get } = require('http');
const { localPackagesPath, networkPackagesPath } = require('./packagesConf')

function compareVersion(LocalfilePath, networkfilePath){
  const localLastVersion = getLastVersion(LocalfilePath)
  const networkLastVersion = getLastVersion(networkfilePath)

  return(localLastVersion == networkLastVersion)
  
}

function zipFileExist(filePath, name) {
  const items = fs.readdirSync(filePath);
  return items.filter(item => item === name + '.zip').length > 0;
}

function versionExist(filePath, name){
  const items = fs.readdirSync(filePath);
  return items.filter(item => item === name).length > 0;
}

function packagesExist(packageName){
  if(!(packageName in networkPackagesPath)){
    console.log(`no packages called ${packageName} in ${networkPackagesPath[packageName]}`)
    return false
  }
  if(!(packageName in localPackagesPath)){
    console.log(`no packages called ${packageName} in ${localPackagesPath[packageName]}`)
    return false
  }
  return true
}

function getLastVersion(filePath) {
  const items = fs.readdirSync(filePath);
  const prodFiles = items.filter(item => /^prod.(\d+\.)?(\d+\.)?(\*|\d+)$/.test(item));

  // On suppose que dans Windows, la dernière version suivant le modèle /^prod.(\d+\.)?(\d+\.)?(\*|\d+)$/ 
  // est toujours le dernier élément dans le tableau
  const lastProdFile = prodFiles.pop();
  return lastProdFile;
}

function archiveFolder(sourceFilePath, dstFilePath, name){
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(dstFilePath + name +'.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`L'archivage est terminé. Taille totale : ${archive.pointer()} octets`);
      resolve();
    });

    archive.on('error', (err) => {
      console.error('Erreur lors de l\'archivage :', err);
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceFilePath, false);
    archive.finalize();
  });

}


async function updatePackage(packageName){
  //verify if packages name exist 
  if(!packagesExist(packageName)){
    return
  }
  const localPath = localPackagesPath[packageName]
  const networkPath = networkPackagesPath[packageName]
  if(compareVersion(localPath, networkPath)){
    console.log(`${packageName} already up to date`)
    return
  }
  const networkLastVersion = getLastVersion(networkPath)
  const localLastVersion = getLastVersion(localPath)
  const sourceArchive = path.join(networkPath, networkLastVersion)
  const dstArchive = networkPath+'/'
  if(!zipFileExist(networkPath, networkLastVersion)){
     await archiveFolder(sourceArchive, dstArchive, networkLastVersion)
  }

  // we compare versionning on the form of prod.x.x.x et js understand 
  if(localLastVersion > networkLastVersion){
    // verify if network last version exist in local version
    if(!versionExist(localPath, networkLastVersion)){
      await extract(path.join(dstArchive,networkLastVersion + '.zip'), {
        dir: path.join(localPath, networkLastVersion)
      })
    }

    fs.rmSync(path.join(localPath,localLastVersion),{recursive: true, force: true});

  }
  const dstExtractPath = path.join(localPath,networkLastVersion)

  await extract(path.join(dstArchive,networkLastVersion + '.zip'), {
    dir: dstExtractPath
  })
  console.log('Extraction complete')
}


async function updatePackages(){
  for(const key of Object.keys(networkPackagesPath)){
    await updatePackage(key)
  }
}

module.exports = {updatePackages}