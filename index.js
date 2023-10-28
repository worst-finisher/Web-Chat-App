const fs = require("fs");
const express = require('express');
const app = express();

const http = require('http');
const socketServer = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(socketServer);

const userbase = require('./userbase/users');


app.use(express.json()); 

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/chat', (req, res) => {
    res.sendFile(__dirname + '/chat.html');
  });

app.post('/savechat', async function( req, res) {

    console.log(req.method)
    
    const msgdata = req.body;
    const id = msgdata.id;
    let flag = false;

    flag = await checkFileExist(id);

    if( flag )
    {
        fs.readFile( './chatLogs/' + id, 'utf-8', function( err, data ){
            
            if( err )
            {
                res.status(500).json({result:'Error in reading the file'});
                return;
            } 
            
            data = JSON.parse(data);
            data.push(msgdata);

            fs.writeFile( './chatLogs/' + id , JSON.stringify(data) ,function( err ){
                if(err){
                    res.status(500).json({result:'Error in writing the file'});
                }
            });

            res.status(200).json({result:'success'});
        });
    }
    else{

        const data = [];
        data.push(msgdata);

        fs.writeFile( './chatLogs/' + id , JSON.stringify(data) ,function( err ){
            if(err){
                res.status(500).json({result:'Error in writing the file'});
            }
            res.status(200).json({result:'success'});
        });
    }

});


  async function checkFileExist( id )
  {
     try {
        const res = await readDirectory(id);
        return res;
     } catch (error) {
        throw error;
     }
  }

  function readDirectory( id )
  {

    return new Promise( function( resolve, reject ){

             let flg = false;
             fs.readdir('./chatLogs/', function(err,files){

                    if(err){
                        reject(err)
                    }

                    files.forEach( function( file ){
                        if( file == id )
                        {
                            flg = true;
                        }
                    });
                    resolve(flg)
                });
    })
  }

app.post('/loadchat', async function( req, res ) {

    const id = req.body.id;

    fileExists = await checkFileExist(id);

    if( fileExists )
    {
        fs.readFile( './chatLogs/'+id, 'utf-8', function( err, data){

            if( err ){
                res.status(500).json({result:'fail to load file'});
                return;
            }

            res.status(200).json({data});
        })
    }
    else{
        res.status(201).json({result:'fail to load file'});
    }

})


io.on('connection', function (socket) {

    console.log( 'At the server' + socket.id); 

socket.on('setUsername', function(data){

    if( userbase.getUser(data) === undefined ){
        console.log('Username :' + data)
        userbase.setUser(socket, data );

       socket.emit('userSet', { name:data , id: socket.id });
       io.sockets.emit( 'broadcast', ` ${data} is now Connected`);
    } else {
       io.emit('userExists', data + ' username is taken! Try some other username.');
   }
 })

 socket.on('setfname', function(data) {
    const friend = userbase.getUser(data);
    console.log('While setting fname ' +friend.username  )
    socket.emit( 'setfid', friend.id )
 })

 
  socket.on('disconnect', function() {
    io.sockets.emit( 'broadcast',  ' user is now Disconnected');
  });

  socket.on('msg', function(data){

        if(  userbase.users[data.friendName] !== undefined  && userbase.users[data.user] !== undefined )
        {
            socket.emit('newmsg', { data:data , uId: userbase.users[(data.user).toString()].id } );
            io.emit('friendMsg', { data: data , fId: userbase.users[(data.friendName).toString()].id });
        }
 })


let timeout;

socket.on('typing', function(data){
   clearTimeout(timeout);
   timeout = setTimeout(  function() {

       if(  userbase.users[data.friendName] !== undefined  && userbase.users[data.name] !== undefined )
       {
       io.emit('typoo',  { data: data.name + ' is typing...', uId: userbase.users[(data.name).toString()].id } );
       io.emit('typoof',  { data: data.name + ' is typing...', fId: userbase.users[(data.friendName).toString()].id } );
       }
   }, 500);
   
})


});

socketServer.listen(3000, () => {
  console.log('listening on http://localhost:3000');
});


