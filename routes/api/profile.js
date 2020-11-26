const express = require('express');
// const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const multer = require('multer');
const path = require('path');
// const url = require('url');
var fs = require('fs');
const { v4: uuidv4 } = require('uuid');
// const helpers = require('helpers');
// const mongoose = require("mongoose");

const router = express.Router();
/**
 * PROFILE IMAGE STORING STARTS
 */
// const s3 = new aws.S3({
//     accessKeyId: 'AKIAXCV6CW7UKGRQDA4N',
//     secretAccessKey: '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',
//     Bucket: 'zakharnewbucket'
// });
/**
* Single Upload
*/

var storageForFilter = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'filter')
    },
    filename: function (req, file, cb) {
        cb(null, path.basename(file.originalname, path.extname(file.originalname)) + '-' + Date.now() + path.extname(file.originalname))
    }
})
// const storage = multer.diskStorage({
//     destination: "./public/",
//     filename: function (req, file, cb) {
//         cb(null, "IMAGE-" + Date.now() + path.extname(file.originalname));
//     }
// });

const profileImgUpload = multer({
    storage: storageForFilter,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('profileImage');


// const profileImgUpload = multer({
//     storage: multerS3({
//         s3: s3,
//         bucket: 'zakharnewbucket',
//         acl: 'public-read',
//         key: function (req, file, cb) {
//             cb(null, path.basename(file.originalname, path.extname(file.originalname)) + '-' + Date.now() + path.extname(file.originalname))
//         }
//     }),
//     // limits: { fileSize: 2000000 }, // In bytes: 2000000 bytes = 2 MB
//     fileFilter: function (req, file, cb) {
//         checkFileType(file, cb);
//     }
// }).single('profileImage');

// const fileDownload = (err) => {
//     var fileStream = fs.createWriteStream('./../../FileProcess/Rules.json');
//     var s3Stream = s3.getObject({ Bucket: 'zakharnewbucket', Key: 'myImageFile.jpg' }).createReadStream();

//     // Listen for errors returned by the service
//     s3Stream.on('error', function (err) {
//         // NoSuchKey: The specified key does not exist
//         console.error(err);
//     });

//     s3Stream.pipe(fileStream).on('error', function (err) {
//         // capture any errors that occur when writing data to the file
//         console.error('File Stream:', err);
//     }).on('close', function () {
//         console.log('Done.');
//     });
// }

/**
 * Check File Type
 * @param file
 * @param cb
 * @return {*}
 */
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /json/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Json file Only!');
    }
}



// const params = { Bucket: 'zakharnewbucket', Key: `${req.file.location}` };
// const file = require('fs').createWriteStream('./local_file_path');
// const s3Promise = s3.getObject(params).promise();
// s3Promise.then((data) => {
//     file.write(data.Body, () => {
//         file.end();
//         fooCallbackFunction();
//     });
// }).catch((err) => {
//     console.log(err);
// });

/**
* @route POST api/profile/business-img-upload
* @desc Upload post image
* @access public
*/
router.post('/profile-img-upload', (req, res) => {
    profileImgUpload(req, res, (error) => {
        console.log('requestOkokok', req.file);
        console.log('error', error);
        if (error) {
            console.log('errors', error);
            res.json({ error: error });
        } else {
            // If File not found
            if (req.file === undefined) {
                console.log('Error: No File Selected!');
                res.json('Error: No File Selected');
            } else {
                // If Success
                const imageName = req.file.filename;
                const imageLocation = req.file.path;
                // Save the file name into database into profile model
                res.json({
                    image: imageName,
                    location: imageLocation
                });
            }
        }
    });
});

// End of single profile upload

router.post('/filter', async (req, res) => {
    if (req.body.filePath === null) {
        errMessage = 'No file uploaded'
        res.send(errMessage);
    } else {
        var params = req.body.filePath;

        // const response = await s3.getObject(params).promise() // await the promise
        // const fileContent = params.Body.toString('utf-8');
        const fileContent = fs.readFileSync(params);
        console.log(fileContent)
        var findQos = fileContent;
        var configQos = JSON.parse(findQos);
        var qosKeys = Object.keys(configQos[0]);
        if (configQos === null || configQos === undefined) {
            errKeys = 'Your file can`t be filtered';
            res.send(errKeys)
            console.log('Your file can`t be filtered')
        } else {
            if (qosKeys.indexOf('qos') === -1) {
                errorMessage = 'There`s no atribute like qos';
                console.log('NO QOS')
                res.send(errorMessage)
            } else {
                const start = new Date().getTime();
                var configJSON = fileContent;
                var configDict = JSON.parse(configJSON);
                console.log(configDict.length);
                var keys = Object.keys(configDict[0]);
                // console.log(keys)
                var counterObj = {}
                let keyForCounterObj
                configDict.forEach((obj) => {
                    keyForCounterObj = ''
                    keys.forEach((key) => {
                        keyForCounterObj += String(obj[key])
                    })
                    if (counterObj[keyForCounterObj]) {
                        counterObj[keyForCounterObj].weight++
                    } else {
                        counterObj[keyForCounterObj] = {
                            ...obj,
                            weight: 1
                        }
                    }
                })
                let newArrayOfObjects = []
                const counterObjKeys = Object.keys(counterObj)
                counterObjKeys.forEach((key) => {
                    newArrayOfObjects.push(counterObj[key])
                });
                //Delete CONFLICTS
                var keysConf = Object.keys(newArrayOfObjects[0]);
                newArrayOfObjects.sort((a, b) => a.weight < b.weight ? 1 : -1);
                for (i = 0; i < keysConf.length; i++) {
                    if (keysConf[i] == 'qos') {
                        keysConf.splice(i, 1);
                    } if (keysConf[i] == 'weight') {
                        keysConf.splice(i, 1);
                    }
                }
                var counterObjConf = {};
                newArrayOfObjects.forEach(obj => {
                    keyForCounterObj = '';
                    keysConf.forEach(key => {
                        keyForCounterObj += String(obj[key]);
                    })
                    if (counterObjConf[keyForCounterObj]) {
                        counterObjConf[keyForCounterObj].weight += obj.weight
                        counterObjConf[keyForCounterObj].count++
                    } else {
                        counterObjConf[keyForCounterObj] = {
                            ...obj,
                            count: 1
                        }
                    }
                });
                let clearArrayOfObjects = [];
                const counterObjKeysConf = Object.keys(counterObjConf)
                counterObjKeysConf.forEach((key) => {
                    clearArrayOfObjects.push(counterObjConf[key])
                });
                clearArrayOfObjects.forEach(item => {
                    item.weight = Math.floor((item.weight / item.count) * 100) / 100;
                    delete item.count
                })
                const FileClear = `CleanRules-${uuidv4()}.json`
                fs.writeFileSync(FileClear, JSON.stringify(clearArrayOfObjects, null, '\t'), (err) => {
                    if (err) throw err;

                })

                var cleanRuleJSON = fs.readFileSync(FileClear);
                var cleanRuleDict = JSON.parse(cleanRuleJSON);
                var linksConfigDict = JSON.parse(cleanRuleJSON);
                var data = {}
                data.nodes = []
                data.links = []
                var delqos = [];

                //create new array without info about QoS
                cleanRuleDict.forEach((item) => {
                    delete item.weight
                    delete item.qos
                    delqos.push(item);
                });
                // number of rules
                for (r = 0; r < linksConfigDict.length; r++) {
                    var rule = {
                        id: "rule_" + r,
                        group: 3
                        // size: 12 * linksConfigDict[r].weight
                    }
                    data.nodes.push(rule)
                }
                //QoS vertices creation with the weight
                for (j = 0; j < linksConfigDict.length; j++) {
                    var weightQos = {
                        id: "qos_" + linksConfigDict[j].qos,
                        group: 1,
                    }
                    data.nodes.push(weightQos)
                }
                //terms creation
                for (j = 0; j < cleanRuleDict.length; j++) {
                    var keys = Object.keys(cleanRuleDict[0]);
                    var values = Object.values(cleanRuleDict[j]);
                    for (i = 0; i < keys.length; i++) {
                        var term = {
                            id: keys[i] + "_" + values[j, i],
                            group: 2
                        }
                        data.nodes.push(term)
                    }
                }
                //making uniq array of terms
                var uniqIds = {};
                data.nodes = data.nodes.filter(obj => !uniqIds[obj.id] && (uniqIds[obj.id] = true));
                //vertices sorting
                data.nodes.sort(function (a, b) {
                    if (a.id < b.id) {
                        return 1;
                    }
                    if (a.id > b.id) {
                        return -1;
                    }
                    return 0;
                });
                //links between Rules and QoS
                for (j = 0; j < linksConfigDict.length; j++) {
                    var connectionRuleQos = {
                        source: "rule_" + j,
                        target: "qos_" + linksConfigDict[j].qos,
                        value: 5 * linksConfigDict[j].weight
                    }
                    data.links.push(connectionRuleQos)
                }
                //links between Terms and Rules
                for (j = 0; j < delqos.length; j++) {
                    var keys = Object.keys(delqos[j]);
                    var values = Object.values(delqos[j]);
                    for (i = 0; i < keys.length; i++) {
                        var connectionTermRule = {
                            source: keys[i] + "_" + values[j, i],
                            target: "rule_" + j,
                            value: 4
                        }
                        data.links.push(connectionTermRule)
                    }
                }
                const FileName = `UniqRules-${uuidv4()}.json`
                //write all data in Rules.json file
                fs.writeFileSync(FileName, JSON.stringify(data, null, ' '), function (err) {
                    if (err) throw err;
                    console.log('complete');
                }
                );
                console.log(FileName);
                // const fileUniqueContent = fs.readFileSync(FileName);

                // const parametres = {
                //     Bucket: 'zakharnewbucket',
                //     Key: FileName,
                //     Body: fileUniqueContent,
                //     ACL: 'public-read'
                // };
                // const info = s3.upload(parametres, function (err, data) {
                //     // console.log("Upload Success", data.Location);
                //     console.log(data.Location);
                // });
                // console.log(info);
                // res.send(sendLocation);

                // var param = { Bucket: 'zakharnewbucket', region: 'eu-central-1', Key: FileName };
                // const getUrlFromBucket = 'https://' + param.Bucket + '.s3-' + param.region + '.amazonaws.com/' + param.Key;
                // res.send(getUrlFromBucket);

                // res.download(`./../../${FileName}`,FileName);
                res.send(FileName);

                // console.log(sendLocation)
                // fs.unlinkSync(FileName, (err) => {
                //     if (err) {
                //         throw err;
                //     }
                // });
                // fs.unlinkSync(FileClear, (err) => {
                //     if (err) {
                //         throw err;
                //     }
                // });

                const end = new Date().getTime();
                console.log(`Algorithm time: ${end - start}ms`);
            }
        }

    }
})



var storageGraph = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public')
    },
    filename: function (req, file, cb) {
        cb(null, path.basename(file.originalname, path.extname(file.originalname)) + '-' + Date.now() + path.extname(file.originalname))
    }
})

const metafileUpload = multer({
    storage: storageGraph,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('metafile');

// const metafileUpload = multer({ storage: storage }).single('metafile');

router.post('/upload-metagraph', (req, res) => {
    metafileUpload(req, res, (error) => {
        console.log('metafiledata', req.file);
        console.log('error', error);
        if (error) {
            console.log('errors', error);
            res.json({ error: error });
        } else {
            // If File not found
            if (req.file === undefined) {
                console.log('Error: No File Selected!');
                res.json('Error: No File Selected');
            } else {
                // If Success
                const metaName = req.file.path;
                // const imageLocation = req.file.location;
                // Save the file name into database into profile model
                res.json(metaName);
                // location: imageLocation 
            }
        }
    });
});


router.post('/filedownload', async (req, res) => {
    if (req.body.newFileName === null) {
        errMessage = 'No file uploaded'
        res.send(errMessage);
    }
    else {
        var uniqFile = req.body.newFileName;
        // var readFile= fs.readFileSync(uniqFile)
        // sendingFile= JSON.parse(readFile);
        // console.log(sendingFile)
        res.download(uniqFile)
        // res.download(sendingFile, (err) => {
        //     if (err) console.log(err);
        // });

        // var metaLinks = metaJson.links;
    }
});

router.post('/buildmetagraph', async (req, res) => {
    if (req.body.metaFileName === null) {
        errMessage = 'No file uploaded'
        res.send(errMessage);
    }
    else {
        var fileMeta = req.body.metaFileName;
        var readMeta = fs.readFileSync(fileMeta);
        var metaJson = JSON.parse(readMeta);
        var keysMeta = Object.keys(metaJson);

        // var metaNodes = metaJson.nodes[0];
        var metaNodes = Object.keys(metaJson.nodes[0]);
        var metaLinks = Object.keys(metaJson.links[0]);
        if (keysMeta.indexOf('nodes') === -1 || keysMeta.indexOf('links') === -1) {
            errorMessage = 'There`re no atributes nodes or links';
            console.log('NO id or group')
            res.send(errorMessage)
        } else {
            if (metaNodes.indexOf('id') === -1 || metaNodes.indexOf('group') === -1) {
                errorMessage = 'There`re no atributes id or group in nodes';
                console.log('NO id or group')
                res.send(errorMessage)
            } else {
                if (metaLinks.indexOf('source') === -1 || metaLinks.indexOf('target') === -1) {
                    errorMessage = 'There`re no atributes source or group in links';
                    console.log('NO source or target')
                    res.send(errorMessage)
                } else {
                    res.send(metaJson)
                    // console.log(metaNodes)
                    console.log(keysMeta)
                }
            }
        }



        // var metaLinks = metaJson.links;
    }
});


// mongoose.connect("mongodb://localhost/file-upload", {
//     useUnifiedTopology: true,
//     useNewUrlParser: true,
//     useCreateIndex: true,
// }).then(() => { console.log("DB is connected") })

// We export the router so that the server.js file can pick it up
module.exports = router;