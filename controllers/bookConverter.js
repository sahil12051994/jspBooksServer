/**
gs -sDEVICE=png16m -dTextAlphaBits=4 -r300 -o /home/sahil/Downloads/a.png /home/sahil/Downloads/Test.pdf
gs -dNOPAUSE -dBATCH -sDEVICE=png16m -dTextAlphaBits=4 -r300 -sOutputFile="/home/sahil/gitProgs/publishingEBookSoftware/sampleBooks/book1/Pic-%d.png" /home/sahil/gitProgs/publishingEBookSoftware/sampleBooks/book1/SuBmiited__Final_Final__Biases_in_Biometric.pdf
*/
var path = require("path");
const { exec } = require("child_process");

function convertProcess(data) {
  let command = 'gs -dNOPAUSE -dBATCH -sDEVICE=png16m -dTextAlphaBits=4 -r300 -sOutputFile="'+data.bookPathToFolder+'/Pic-%d.png" '+data.bookPathToBook+''
  return new Promise(function(resolve, reject) {
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            reject();
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            reject();
        }
        console.log(`stdout: ${stdout}`);
    });
    resolve()
  })
}

exports.convertBook = async (req, res) => {
  let conversion = await convertProcess({
    bookPathToFolder: path.join(__dirname, '../uploads/' + req.query.bookType + '/' + req.query.bookId),
    bookPathToBook: path.join(__dirname, '../uploads/' + req.query.bookType + '/' + req.query.bookId + '/' + req.query.fName)
  });
  return res.json({status: 1});
}
