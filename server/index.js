const { Server } = require("socket.io");
const NodeRSA = require("node-rsa");    
//const { createServer } = require("http");

//const httpServer = createServer();
const io = new Server({
    allowEIO3: true, // false by default
    cors: {
        origin: ["http://localhost:8080","http://172.19.201.179","http://localhost"],
        methods: ["GET","POST"],
        credentials: true
    } 
});

const serverRSA = new NodeRSA({b : 2048},{
    encryptionScheme: 'pkcs1',
});

async function checkNameIsAvailable (name) {
    const sockets = await io.fetchSockets();
    var count = sockets.filter(function (socket) {
        if (socket.data.user)
            return socket.data.user.name === name;
        return false;
      }).length;
    return count == 0;
}

async function getRoomSockets(room) {
    const sockets = await io.in(room).fetchSockets();
    return sockets;
}

function sendMessageToRoom (room, msg, from = null) {
    new Date().toLocaleTimeString('vi-VN', { hour12: false, 
        hour: "numeric", 
        minute: "numeric"});
    getRoomSockets(room).then((sockets) => {
        sockets.forEach((s) => {
            
            destination = new NodeRSA(s.data.user.clientRSA,{
                encryptionScheme: 'pkcs1',
            }   );
            console.log("[ SERVER => "+ s.data.user.name +" IN ROOM("+room+") ] : " + destination.encrypt(msg,'base64'));
            io.to(room).emit('chat',{ from: (from ? from : "[HỆ THỐNG]"), forTo: s.data.user.name, content: destination.encrypt(msg,'base64') })
        })
    })
}

function syncRoomsData (socket = null) {
    //console.log(io.sockets.adapter.rooms);
    var rooms = [];

    io.sockets.adapter.rooms.forEach(function(value, key) {
        if(/^\d+$/.test(key))
        rooms.push({
            name: key,
            count: value.size,
        });
    })

    if (socket) socket.emit('syncRooms',rooms);
    else io.sockets.emit('syncRooms',rooms);
}


function mainProcess(socket) {
    socket.on('disconnecting', (reason) => {
        console.log("[" + socket.data.user.name + "] đã rời khỏi máy chủ");
        if (socket.data.currentJoining)
            getRoomSockets(socket.data.currentJoining).then((sockets) => {
                sockets.forEach((s) => {
                    destination = new NodeRSA(s.data.user.clientRSA,{
                        encryptionScheme: 'pkcs1',
                    }   );
                    io.to(socket.data.currentJoining).emit('chat',{ from: "[HỆ THỐNG]", forTo: s.data.user.name, content: destination.encrypt(socket.data.user.name + " đã rời khỏi phòng",'base64') })
                })
            })
    });

    socket.on('joinRoom', (roomName,callback) => {
        // if(!io.sockets.adapter.rooms.get(roomName))
        //     callback(false);
        // else {
            socket.join(roomName);
            socket.data.currentJoining = roomName;  
            //console.log("[" + roomName + "]: " +io.sockets.adapter.rooms.get(roomName).size);
            //console.log(socket.rooms);
          
            sendMessageToRoom(socket.data.currentJoining,socket.data.user.name + " đã tham gia phòng")
            syncRoomsData();
            callback(true);

            
    });

    socket.on('changeRoom', (roomName,callback) => {
        // if(!io.sockets.adapter.rooms.get(roomName))
        //     callback(false);
        // else {
            socket.leave(socket.data.currentJoining)
            var oldRoom = socket.data.currentJoining;
            socket.join(roomName);
            socket.data.currentJoining = roomName;  
        

            sendMessageToRoom(oldRoom,socket.data.user.name + " đã rời khỏi phòng")
            sendMessageToRoom(roomName,socket.data.user.name + " đã tham gia phòng")
            // getRoomSockets(oldRoom).then((sockets) => {
            //     sockets.forEach((s) => {
            //         destination = new NodeRSA(s.data.user.clientRSA,{
            //             encryptionScheme: 'pkcs1',
            //         }   );
            //         io.to(oldRoom).emit('chat',{ from: "[HỆ THỐNG]", forTo: s.data.user.name, content: destination.encrypt(socket.data.user.name + " đã rời khỏi phòng",'base64') })
            //     })
            // })
            

            // getRoomSockets(roomName).then((sockets) => {
            //     sockets.forEach((s) => {
            //         destination = new NodeRSA(s.data.user.clientRSA,{
            //             encryptionScheme: 'pkcs1',
            //         }   );
            //         io.to(roomName).emit('chat',{ from: "[HỆ THỐNG]", forTo: s.data.user.name, content: destination.encrypt(socket.data.user.name + " đã tham gia phòng",'base64') })
            //     })
            // })
            syncRoomsData();
            callback(true);
    });

    socket.on('leaveRoom', (roomName,callback) => {
        // if(!io.sockets.adapter.rooms.get(roomName))
        //     callback(false);
        // else {
            socket.leave(roomName);
            socket.data.currentJoining = null;  
        
            sendMessageToRoom(roomName,socket.data.user.name + " đã rời khỏi phòng")
            syncRoomsData();
            callback(true);
    });

    socket.on('chat', (msg,callback) => {
        
        if (!msg || !socket.data.currentJoining)
            callback(false);
        else {
            plaintext = serverRSA.decrypt(msg);
            console.log("[ "+socket.data.user.name+" IN ROOM ("+ socket.data.currentJoining +") => SERVER ] : "+ msg);
            sendMessageToRoom(socket.data.currentJoining,plaintext,socket.data.user.name)
        
            callback(true)
        }
    })
}

  
io.on("connection", (socket) => {



    // socket.on('createRoom', (roomName,callback) => {
    //     if(io.sockets.adapter.rooms.get(roomName))
    //         callback(false);
    //     else {
    //         socket.join(roomName);
    //         callback(true);
    //         console.log("[" + roomName + "]: " +io.sockets.adapter.rooms.get(roomName).size);
    //     }

    // });


    

    socket.on('authenticate', (user,callback) => {
        if(user.name && user.clientRSA) {
            checkNameIsAvailable(user.name).then((available) => {
                if (available) {
                    socket.data.user = user; 
                    console.log("[" + user.name + "] đã tham gia máy chủ" )
                    mainProcess(socket);
                    callback(true, serverRSA.exportKey("public"))
                    syncRoomsData(socket);
                } 
                else {
                    callback(false, null);
                }
            });
        }
        else
            callback(false);

        
    });

    




  
});

io.listen(3000);

//httpServer.listen(3000);