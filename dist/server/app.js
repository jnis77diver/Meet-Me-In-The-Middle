/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

//var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/environment');

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);

// Populate DB with sample data
if(config.seedDB) { require('./config/seed'); }

// Setup server
<<<<<<< Updated upstream
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
=======
var app = express();
var server = require('http').createServer(app);
//Ko: Socket is hooked here
// var socketio = require('socket.io')(server, {
//   serveClient: (config.env === 'production') ? false : true,
//   path: '/socket.io-client'
// });
// //Ko: Server-side socket logic is defined here in ./config/socketio.js
// require('./config/socketio')(socketio);
var socket = require('socket.io');
var io = socket(server);

io.on('connection', function(socket){

  socket.on('move-pin', function(data){
    // do stuff with data received from cliend

    socket.emit('move-pin', data)
    console.log('TESTING SOCKET.IO' + socket.id)

  })
})


require('./config/express')(app);
require('./routes')(app);
>>>>>>> Stashed changes

server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});


//var server = require('http').Server(app);
//Ko: Socket is hooked here
// var socketio = require('socket.io')(server, {
//   serveClient: (config.env === 'production') ? false : true,
//   path: '/socket.io-client'
// });
// //Ko: Server-side socket logic is defined here in ./config/socketio.js
// require('./config/socketio')(socketio);
//var socket = require('socket.io');
//var io = socket(server);

//temporary inject roomsController here
var RoomsController = require('./api/rooms/rooms.controller');


var dataCollection = {};
io.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log('inside socket connection ', data);
  });


  socket.on('move-pin', function(data){
    // If it's new socket.id
    dataCollection[data._id] = data;
    var userRoomObj = {
       roomId: data.roomId,
       user: {
         _id: data._id,
         name: data.name,
         coords: {
           latitude: data.coords.latitude,
           longitude: data.coords.longitude,
         },
         owner: false
       },
       info: 'How awesome',
       active: true
     };
    //Update Database with new info (coords) but don't send data back
    //Data will be sent back from Data Cache for performance reasons
    RoomsController.updateRoom(userRoomObj, function(usersData) {
      //do something with usersData maybe
    });
    // Sendback all the data
    //dataCollection = {socket.id1:{longitude:num, latitude: num, roomNumber: num}, ..., socket.idN:{longitude:num, latitude:num, roomNumber: num}}
    io.emit('move-pin-reply', dataCollection)

    // Testing
    //socket.emit('move-pin', data);
    console.log('TESTING SOCKET.IO' + socket.id)
    console.dir(dataCollection);

  });

  socket.on('updateMap', function(data) {
    console.log('data is ', data);
    var userRoomObj = {
      roomId: data.roomId,
      userId: data._id
    };
    RoomsController.getUsersForRoom(userRoomObj, function(usersData) {
    //return object of objects indexed by userId
      io.emit('updateMapReply', usersData);
    });

  });

  // Delete the data after disconnecting.
  socket.on('disconnect', function(data){
    delete dataCollection[socket.id];
    io.emit('move-pin-reply', dataCollection);
  })
});


require('./config/express')(app);
require('./routes')(app);


// Expose app
module.exports = app;
