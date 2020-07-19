const getPixels = require('get-pixels')
const GifEncoder = require('gif-encoder');
const mongoose = require('mongoose');
const Processed = require('../models/ProcessedFrames');
const shell = require('shelljs');

exports.createGifOfTimeInterval = (startTime,endTime,camID) => {
  return new Promise((resolve,reject) => {
    let frameList = [];
    getFrameData(startTime,endTime,camID).then(function(value){
      let counter = 0;
      for (let i = 0; i < value.length; i++) {
        if(!value[i].hasOwnProperty('bboxes')){
          if(counter > 30){
            break;
          }
          frameList.push(value[i]['path']+'/'+value[i]['fileName'])
          counter++;
        }
      }
      let fName = camID +'-'+ startTime.toISOString().split("T")[1];
      createGif(frameList, fName).then(function(link){
        resolve(link);
      });
    });
  })
}

function getFrameData(startTime,endTime,camID) {
  return new Promise((resolve, reject) => {
    var query = Processed.aggregate([{
          $match: {
            time: {
              $gte: new Date(startTime),
              $lte: new Date(endTime)
            },
            camId: camID
          }
        }]).exec();
    query.then(function(doc) {
      resolve(doc)
    });
  });
}

let homeDir= '/home/hercules/'

function createGif(pics, fName) {
  return new Promise(function(resolve, reject) {
    let gif = new GifEncoder(1280, 720);
    let randomName = fName + '.gif';
    let location = homeDir + 'ext2tb/IntelligenceReportData/';
    let fullPath = location + randomName;
    console.log("path", fullPath)
    // try {
    //   if (!fs.existsSync(location)){
    //     shell.mkdir('-p', location);
    //   }
    // } catch (err) {
    //   console.error(err)
    // }
    //1229331984
        var ws = require('fs').createWriteStream(fullPath);
        gif.pipe(ws);
        gif.setQuality(10);
        gif.setRepeat(0);
        gif.setDelay(100);
        gif.writeHeader();

        // for(let index=0; index < pics.length; index++){
        //   console.log("index gif =" , index, pics.length)
        //   if(pics[index]){
        //     getPixels(pics[index], function(err, pixels) {
        //       if(err){
        //         console.log(err);
        //         resolve('No path')
        //       }
        //       if(pixels){
        //         gif.addFrame(pixels.data);
        //         gif.read();
        //       }
        //     })
        //     if(index == pics.length -1){
        //       gif.finish();
        //       console.log("gif creation finished")
        //       resolve(location+randomName);
        //     }
        //   } else {
        //     continue;
        //   }
        // }
        var addToGif = function(images, counter = 0) {
          if(images){
            // console.log("counter",counter, images.length)
            getPixels(images[counter], function(err, pixels) {
              if(err && (counter === images.length - 1)){
                resolve('No Path')
              } else if(err){
                console.log(err && counter === images.length - 1)
                addToGif(images, ++counter);
              } else {
                // console.log("pixels", pixels)
                gif.addFrame(pixels.data);
                gif.read();
                if (counter === images.length - 1) {
                    console.log("donee")
                    gif.finish();
                    resolve(fullPath);
                    gifDone();
                } else {
                    addToGif(images, ++counter);
                }
              }
            })
          } else {
            resolve('No Path')
          }
        }
        addToGif(pics);
  })
}

function gifDone(){
  console.log("gif done");
}
