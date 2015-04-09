'use strict';

var _ = require('lodash');
var Rooms = require('./rooms.model');
var User = require('../user/user.model')

// Get list of rooms
exports.index = function(req, res) {
  console.log('got into index');
/*  User.findById(userId, function (err, user) {
    if(user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.send(200);
      });
    } else {
      res.send(403);
    }
  });*/


  /*Rooms.find(function (err, roomss) {
    if(err) { return handleError(res, err); }
    return res.json(200, roomss);
  });*/
};

// Get a single rooms' user objects
exports.show = function(req, res) {
  User.findById(req.params.id, function (err, user) {
    if(!err ) {
      var rooms = user.memberOfRooms;
      res.send(200, rooms);
    } else {
      res.send('error');
    }
  });

};

// Creates a new rooms in the DB.
exports.create = function(req, res) {
/*  var userRoomObj = {
    roomId: roomId,
    name: $scope.editableText,
    user: {
      _id: user._id,
      name: user.name,
      coords: {
        latitude: "",
        longitude: "",
      },
      owner: false
    },
    info: 'How awesome',
    active: true
  };*/
  var newRoom = {
    name: req.body.name,
    info: req.body.info,
    active: req.body.active,
    users: [req.body.user]
  };
  //create new roomId to user data in user collection
  Rooms.create(newRoom, function(err, room) {
    console.log('req.body.user._id ', req.body.user._id);
    if(err) { return handleError(res, err); }
    else {
      //add room to in users collection
      User.findById(req.body.user._id, function (err, user) {
          var roomId = room._id.toString();
          user.memberOfRooms.push({roomId: roomId, name: req.body.name});
          user.save(function(err) {
            if (err) return validationError(res, err);
            //res.send(200);
          });
        });
    }
    return res.json(201, room);
  });
};

/*var userRoomObj = {
  roomId: roomId,
  user: {
    _id: user._id,
    name: user.name,
    coords: {
      latitude: 54.2058804,
      longitude: long+1,
    },
    owner: false
  },
  info: 'How awesome',
  active: true
};*/


// Updates an existing room in the DB.
exports.update = function(req, res) {
  console.log('called update');
  var userId = req.body.user._id;
  var roomId = req.body.roomId;
    Rooms.findById(roomId, function (err, room) {
    if (err) { return handleError(res, err); }
    if(!room) { return res.send(404); }
    var roomName = room.name;
    var preExistingUser = false;
    var usersInRoom = room.users;
    for( var j = 0, len = usersInRoom.length; j < len; j++ ) {
      if( usersInRoom[j]._id === userId ) {
        usersInRoom[j].user = req.body.user;
        preExistingUser = true;
        break;
      }
    }
    if( !preExistingUser ) {
      usersInRoom.push(req.body.user);
    }
    room.save(function (err) {
      if (err) { return handleError(res, err); }
      else {
        User.findById(userId, function (err, user) {
          var flag = false;
          var userInRooms = user.memberOfRooms;
          for( var i = 0, len = userInRooms.length; i < len ; i++ ) {
            if( user.memberOfRooms[i].roomId === roomId ) {
              new Error('user already a member of this room');
              flag = true;
              break;
            }

          }
          if( !flag ) { user.memberOfRooms.push({roomId: roomId, name: roomName}); }
          user.save(function(err) {
            if (err) return validationError(res, err);
          });
        });
      }
      //return json array of all users in room
      return res.json(200, room.users);
    });
  });
};

// Deletes a rooms from the DB.
exports.destroy = function(req, res) {
  Rooms.findById(req.params.id, function (err, rooms) {
    if(err) { return handleError(res, err); }
    if(!rooms) { return res.send(404); }
    rooms.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}


/**
 * Function is called by socket.io listener to update room DB and user DB with user data
 * @param data
 * @param cb
 */
exports.updateRoom = function(data, cb) {
  var userId = data.user._id;
  var roomId = data.roomId;
    Rooms.update({'users._id': userId}, {'$set': {
      'users.$.coords': data.user.coords
    }}, function (err) {
        if (err) {
          return handleError(res, err);
        }
        else {
          User.findById(userId, function (err, user) {
            var flag = false;
            var userRooms = user.memberOfRooms;
            for (var i = 0, len = userRooms.length; i < len; i++) {
              if (userRooms[i].roomId === roomId) {
                flag = true;
                break;
              }
            }
            if (!flag) {
              userRooms.push({roomId: roomId, name: req.body.name});
            }
            user.save(function (err) {
              if (err) return validationError(res, err);
            });
          });
        }
        //return json array of all users in room
        //return res.json(200, room.users);
        Rooms.findById(roomId, function(err, room) {
          var usersObj = room.users.reduce(function (a, b) {
            a[b._id] = b;
            return a;
          }, {});
          cb(usersObj);
        });
      });
};


exports.getUsersForRoom = function(data, cb) {
  var userId = data.userId;
  var roomId = data.roomId;
  Rooms.findById(roomId, function (err, room) {
    if (err) { console.log('getUsersForRoom in rooms.controller ', err); }
    if(!room) { console.log('theres no room dude... im in getUsersForRoom in rooms.controller'); }
    var usersObj = room.users.reduce(function(a, b) {
      a[b._id] = b;
      return a;
    }, {});
    console.log('USER OBJ!!!!!!!!!!', usersObj);
    cb(usersObj);
  });
};
