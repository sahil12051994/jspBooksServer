var multer = require('multer');
const fs = require('fs');
const path = require('path');
var kafka = require('kafka-node')
var targetDir = "";
let {
  PythonShell
} = require('python-shell')

var base64ToImage = require('base64-to-image');
let base64Str = undefined;
var buffer = require('buffer');
var Jimp = require("jimp")

YAML = require('yamljs');
configObject = YAML.load('./config/server.yml');

var sudo = require('sudo-js');
sudo.setPassword('jbm@ai#123');

function getchmod777(path) {
  var command = ['chmod', '0777', '-R', path];
  sudo.exec(command, function(err, pid, result) {
    console.log(result);
  });
}

function mkDirByPathSync(targetDir, {
  isRelativeToScript = false
} = {}) {
  const sep = path.sep;
  const initDir = path.isAbsolute(targetDir) ? sep : '';
  const baseDir = isRelativeToScript ? __dirname : '.';

  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code === 'EEXIST') { // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }

      const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
      if (!caughtErr || caughtErr && curDir === path.resolve(targetDir)) {
        throw err; // Throw if it's just the last created dir.
      }
    }

    return curDir;
  }, initDir);
}

let uploadPicturePath = configObject['path']['uploadPicturePath'];
let tempManpowerSheetPath = "";

var storage = multer.diskStorage({
  destination: function(req, file, callback) {
    callback(null, targetDir);
  },
  filename: function(req, file, callback) {
    callback(null, file.originalname);
  }
});

var upload = multer({
  storage: storage
}).array('userPhoto', 4);

function deleteAllFolder(targetDir) {
  return new Promise(function(resolve, reject) {
    let options = {
      mode: 'text',
      pythonPath: configObject['python']['path'],
      pythonOptions: ['-u'], // get print results in real-time
      scriptPath: configObject['python']['nodeUtilScriptsPath'],
      args: [
        targetDir
      ]
    };
    PythonShell.run('deleteDir.py', options, function(err, results) {
      if (err) {
        console.log(err)
        resolve()
        throw err;
      }
      // results is an array consisting of messages collected during execution
      console.log('deleteddddd results: %j', results);
      resolve(results)
    });
  })
}

function startTrainingOfEmployee(data) {
  let Producer = kafka.Producer,
    KeyedMessage = kafka.KeyedMessage,
    client = new kafka.KafkaClient({
      kafkaHost: '3.7.152.162:9092'
    }),
    producer = new Producer(client),
    chunk = {
      employeeFolderPath: data.targetDir,
      companyId: data.companyId,
      plantId: data.plantId,
      empId: data.empId,
      employmentType: data.employmentType
    },
    payloads = [{
      topic: 'faceTrainer',
      messages: JSON.stringify(chunk),
      partition: 0
    }];

  producer.on('ready', function() {
    producer.send(payloads, function(err, data) {
      console.log(data);
    });
  });

  producer.on('error', function(err) {})
}

function getCompanyId(companyId) {
  companyId = companyId.toLowerCase()
  switch(companyId) {
    case 'jbmgroup': {
      return 'JBMGroup'
    }
    case 'anandgroup': {
      return 'AnandGroup'
    }
    case 'escorts': {
      return 'Escorts'
    }
  }
}

exports.upload = (req, res) => {
  if (req.query.companyId) {
    req.query.companyId = getCompanyId(req.query.companyId)
    if (req.query.plantId) {
      console.log("\n\nUpload Reques xxxxxxxxxxxxxxxxxxxxxxxxx:", req.query.fName, "\n\n")
      targetDir = uploadPicturePath + "/" + req.query.companyId + "/" + req.query.plantId + "/" + req.query.fName + "_" + req.query.empId + "/"
      console.log("Path created: ", targetDir)
      deleteAllFolder(targetDir).then(function(v) {
        mkDirByPathSync(targetDir);
        let registrationPage = req.query.registrationPage;
        if (registrationPage) {
          let imgArr = req.body.imgArr;
          // TODO: Optimize this code (Use single library for JPG/PNG Formats)
          if (req.query.png) {
            if (req.query.png == 1) {
              for (var i = 0; i < imgArr.length; i++) {
                console.log("*******************************************************",imgArr[i]['imgName'], (imgArr[i]['b64Str']));
                base64Str = imgArr[i]['b64Str'];
                let tempImageName = imgArr[i]['imgName']
                var buf = Buffer.from(base64Str, 'base64');
                fs.writeFile(targetDir + tempImageName + '.png', buf, function(error) {
                  if (error) {
                    throw error;
                  } else {
                    console.log('File created from base64 string!');
                    Jimp.read(targetDir + tempImageName + '.png', function(err, image) {
                      if (err) {
                        console.log(err)
                      } else {
                        image.write(targetDir + tempImageName + '.jpg')
                        fs.unlinkSync(targetDir + tempImageName + '.png')
                      }
                    })
                  }
                })
              }
            }
          } else {
            for (var i = 0; i < imgArr.length; i++) {
              var base64Str = imgArr[i]['b64Str'];
              var path = targetDir;
              var optionalObj = {
                'fileName': imgArr[i]['imgName'],
                'type': 'jpg'
              };
              var imageInfo = base64ToImage(base64Str, path, optionalObj);
            }
          }
          var command = ['chmod', '0777', '-R', targetDir];
          sudo.exec(command, function(err, pid, result) {
            console.log("sudo operation result:", result);
            startTrainingOfEmployee({
              targetDir: uploadPicturePath + "/" + req.query.companyId + "/" + req.query.plantId + "/" + req.query.fName + "_" + req.query.empId,
              companyId: req.query.companyId,
              plantId: req.query.plantId,
              empId: req.query.fName + "_" + req.query.empId,
              employmentType: req.query.employmentType
            })
            return res.json({
              status: 1
            });
          });
        } else {
          upload(req, res, function(err) {
            if (err) {
              console.log(err)
              return res.json({
                status: 0
              });
            }
            var command = ['chmod', '0777', '-R', targetDir];
            sudo.exec(command, function(err, pid, result) {
              console.log("sudo operation result:", result);
              startTrainingOfEmployee({
                targetDir: uploadPicturePath + "/" + req.query.companyId + "/" + req.query.plantId + "/" + req.query.fName + "_" + req.query.empId,
                companyId: req.query.companyId,
                plantId: req.query.plantId,
                empId: req.query.fName + "_" + req.query.empId,
                employmentType: req.query.employmentType
              })
              return res.json({
                status: 1
              });
            });
            console.log("Uploaded");
          });
        }
      })
    } else {
      return res.json({
        status: 0
      });
    }
  } else {
    return res.json({
      status: 0
    });
  }
}

exports.verify = (req, res) => {
  companyId = req.body.companyId;
  empId = req.body.empId;
  b64Img = req.body.b64Img;

  let targetDir = configObject['path']['verificationPictures'] + "/" + companyId + "/";
  mkDirByPathSync(targetDir);

  let imagePath = targetDir + empId + ".jpg";
  console.log("----------------------Started Vrification-----------------")
  if (req.query.png) {
    if (req.query.png == 1) {
      console.log(req.body)
      base64Str = b64Img;
      let tempImageName = empId
      var buf = Buffer.from(base64Str, 'base64');
      fs.writeFile(targetDir + empId + '.png', buf, function(error) {
        if (error) {
          throw error;
        } else {
          console.log('File created from base64 string!');
          Jimp.read(targetDir + empId + '.png', function(err, image) {
            if (err) {
              console.log(err)
            } else {
              image.write(targetDir + empId + '.jpg')
              fs.unlinkSync(targetDir + empId + '.png')
            }
          })
        }
      })
    }
  } else {
    let base64Str = b64Img;
    let optionalObj = {
      'fileName': empId,
      'type': 'jpg'
    };
    let imageInfo = base64ToImage(base64Str, targetDir, optionalObj);
  }

  if (companyId && empId && b64Img) {
    let options = {
      mode: 'text',
      pythonPath: configObject['python']['path'],
      pythonOptions: ['-u'], // get print results in real-time
      scriptPath: configObject['python']['frScripts'],
      args: [
        empId,
        companyId,
        imagePath,
        configObject['path']['uploadPicturePath'] + "/",
        configObject['path']['frModel']
      ]
    };
    PythonShell.run('faceVerification.py', options, function(err, results) {
      if (err) {
        console.log(err)
        return res.json({
          status: 0
        });
      }
      // results is an array consisting of messages collected during execution
      console.log('verified results: %j', results);
      return res.json({
        status: 1,
        result: results
      });
    });
  }
}
