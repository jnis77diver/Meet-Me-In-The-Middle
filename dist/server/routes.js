/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');
var userCtrl = require('./api/user/user.controller');
var fs = require('fs');
var multer = require('multer');

module.exports = function(app) {

  // Insert routes below
  app.use('/api/rooms', require('./api/rooms'));
  //app.use('/userimage', require('./api/user'));
  app.use('/api/gmaps', require('./api/gmaps'));
  app.use('/api/things', require('./api/thing'));
  app.use('/api/users', require('./api/user'));
  app.use('/api/gmaps', require('./api/gmaps'));
  app.use('api/rooms', require('./api/rooms'));


  app.post('/userimage',  function(req, res) {
    console.log(123);
    userCtrl.updateImageUrl(req, res);
  });
  app.get('/userimage/*',  function(req, res) {
    console.log(123);
    userCtrl.getImageUrl(req, res);
  });





  var isFileTooLarge;
  app.post('/user/image', [multer({
    dest: './server/uploads/',
    limits: {
      fileSize: 500000
    },
    rename: function (fieldname, filename, req, res) {
      console.log('req.body', req.body);
      var userId = req.body.userId;
      return userId + '001';
    },
    onFileSizeLimit: function (file) {
      res.json({
        uploadError: 'Upload failed. File must be less than 500 KB'
      });
      isFileTooLarge = true;
    },
    onFileUploadStart: function (file) {
      console.log(file.originalname + ' is starting ...');
    },
    onFileUploadComplete: function (file, req, res) {
      console.log(file.fieldname + ' uploaded to  ' + file.path);
      var newFileName = req.files.file[0].name;
      if (!isFileTooLarge) {
        userCtrl.uploadUserImage(req.body.userId, newFileName, function () {
          //file parameter is actually an object with the path as a property
          file.path = 'http://midup.blob.core.windows.net/userpictures/' + newFileName;
          res.send(file);
          //delete file from local uploads folder
          fs.unlink('./server/uploads/' + newFileName);
        });
      } else {
        fs.unlink('./server/uploads/' + newFileName);
      }
    }
  }),
    function(req, res) { }]);


  app.use('/auth', require('./auth'));


  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });
};
