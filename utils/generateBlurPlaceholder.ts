import { promisify } from 'util';
import { readFile } from 'fs';

// get an image blob from url using fetch
let getImageBlob = function(url){
  return new Promise( async resolve=>{
    let resposne = await fetch( url );
    let blob = resposne.blob();
    resolve( blob );
  });
};

// convert a blob to base64
let blobToBase64 = async function (blob) {
  let buffer = await promisify(readFile)(blob);
  return buffer.toString('base64');
};

// combine the previous two functions to return a base64 encode image from url
export default async function getBase64ImageUrl( url ): Promise<string>{
  let blob = await getImageBlob( url );
  let base64 = await blobToBase64( blob );
  return base64;
}
