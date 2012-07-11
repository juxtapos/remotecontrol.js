var socketio = require('socket.io'),
	crypto = require('crypto'),
	io = socketio.listen(1337),
	tokens = {},
	sockets = {},
	TOKEN_TTL = 60000,
	DEBUG_LEVEL = 1; // 3 for full message logging

//
// Configure socket.io.
// 
io.configure(function(){
    io.enable('browser client etag');
    io.set('log level', DEBUG_LEVEL);
});

/**
 * Creates a tokenId from calling createKey and cutting a random substring of length 5.
 *
 * @returns {String} token ID
 */
function createTokenId() {
	var key = createKey(),
		offset = parseInt(Math.random() * (key.length - 5))
	//return key.substring(offset, offset + 5);
	return 1;
}

/**
 * Creates a SHA1 hash, using a random value, unix epoch seconds and a salt string as input. 
 * 
 * @returns {String} SHA1 hash value. 
 */
function createKey() {
	var salt = 'AddS417',
		sha = crypto.createHash('sha1').update(Math.random() + new Date().getTime() + salt).digest('hex');
	return sha;
}

io.sockets.on('connection', function (socket) {
	//console.log('socket connected ' + socket.id);

	sockets[socket.id] = {
		tokenId: null,
		socket: socket
	}

	socket.on('disconnect', function disconnect () {
		//console.log('client disconnected ' + socket.id);
		if (sockets[socket.id]) {
			if (sockets[socket.id].tokenId) {
				delete tokens[sockets[socket.id].tokenId];
			}
			delete sockets[socket.id];
		}
	});

	socket.on('rcjs:requestToken', function (data) {
		if (tokens[sockets[socket.id].tokenId]) {
			delete tokens[sockets[socket.id].tokenId];
		}
		var tokenId = createTokenId();
		sockets[socket.id].tokenId = tokenId;
		tokens[tokenId] = {
			timeStamp: new Date().getTime(),
			receiverId: socket.id
		};
		socket.emit('rcjs:token', { tokenId: tokenId } );
	});

	// Request: from sender app to connect to receiver app using a valid tokenId. 
    // Response: on error sends rcjs:supplyToken message back to source, on success a 
    // rcjs:registerSender
	socket.on('rcjs:supplyToken', function (data) {
		var token;
		console.log('supplyToken');
		if ( (token = tokens[data.tokenId]) ) {
			var receiver = sockets[token.receiverId].socket;
			if (receiver.sender) {
				socket.emit('rcjs:supplyToken', { error: 'invalid token (already in use)' } );
			} else if (new Date().getTime() > token.timeStamp + TOKEN_TTL) {
				socket.emit('rcjs:supplyToken', { error: 'invalid token (expired)' } );
				delete tokens[data.tokenId];
			} else {
				token.senderId = socket.id;
				receiver.emit('rcjs:registerSender', { tokenId: data.tokenId } );
			}
		} else {
			socket.emit('rcjs:supplyToken', { error: 'invalid token (unknown)' } );
		}
	});

	socket.on('rcjs:confirmRegistration', function (data) {
		var token = tokens[data.tokenId];
		token.key = createKey();
		var sender = sockets[token.senderId].socket;
		sender.emit('rcjs:startCapture', { tokenId: data.tokenId, key: token.key, events: data.events } );
	});

	socket.on('rcjs:event', function (data) {
		var token = tokens[data.tokenId];
		if (!token) {
			socket.emit('rcjs:receiverDisconnect', { error: 'tokenId missing, disconnect.' } );
		} else if (data.key == token.key) {
			var receiver = sockets[token.receiverId].socket;
			receiver.emit('rcjs:event', { type: data.type, event: data.event } );
		} else {
			socket.emit('rcjs:invalid', { error: 'invalid key' } );
		}
	});
});