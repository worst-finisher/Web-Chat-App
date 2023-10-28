
const userDetails = {}

function setUser( socket, name )
{
    userDetails[name] = {
        username : name, 
        id : socket.id
    }
}

function getUser( name )
{
    return userDetails[name];
}

module.exports = {
    setUser: setUser,
    getUser: getUser,
    users: userDetails
}
