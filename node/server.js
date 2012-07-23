var // time max lifetime after creation in ms. 
	TOKEN_TTL = 60000,
	// Winston debug level, see winston.config.syslog.levels and mind the Winston bug that debug 
	// level 'debug' prints debug and error level messages only!
	DEBUG_LEVEL = 'info',
	// File name to log to, relative to package root folder. Set to empty value if you don't want logging.
	LOG_FILE = null;//remotecontrol-server.log';

var socketio = require('socket.io'),
	winston = require('winston'),
	crypto = require('crypto'),
	io = socketio.listen(1337),
	tokenIdsToSockets = {},
	sockets = {},
	level = winston.config.syslog.levels[DEBUG_LEVEL],
	// translate to socket.io levels. 
	socketioDebugLevel = level >= 4 ? 0 : 
						 level == 3 ? 1 : 
						 level == 2 || level == 1 ? 2 : 3,
	transports = [new (winston.transports.Console)({ level: DEBUG_LEVEL })];
if (LOG_FILE) {
	transports.push(new (winston.transports.File)({ level: DEBUG_LEVEL, filename: LOG_FILE }));
}
var logger = new (winston.Logger)({
	transports: transports
});

//
// Configure socket.io.
// 
io.configure(function(){
    io.enable('browser client etag');
    io.set('log level', socketioDebugLevel);
});

/**
 * Creates a tokenId from calling createKey and cutting a random substring of length 5.
 *
 * @returns {String} token ID
 */
function createTokenId() {
	var len = 5,
		key = createKey(),
		offset = parseInt(Math.random() * (key.length - len));
	return 1;
	return key.substring(offset, offset + len);
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
	logger.info('client connected ' + socket.id);

	sockets[socket.id] = {
		token: null,
		socket: socket,
		peerSocket: null
	}

	socket.on('disconnect', function disconnect () {
		logger.info('client disconnected ' + socket.id);
		if (sockets[socket.id]) {
			if (sockets[socket.id].token && tokenIdsToSockets[sockets[socket.id].token.id]) {
				logger.debug('delete token');
				delete tokenIdsToSockets[sockets[socket.id].tokenId];
			}
			if (sockets[socket.id].peerSocket) {
				logger.debug('notify peer of disconnect');
				sockets[socket.id].peerSocket.emit('rcjs:remoteDisconnect', {});
				sockets[sockets[socket.id].peerSocket.id].peerSocket = null;
			}
			delete sockets[socket.id];
		}
	});

	socket.on('rcjs:requestToken', function (data) {
		var tokenId = createTokenId();
		sockets[socket.id].token = {
			id: tokenId,
			timeStamp: new Date().getTime()
		};
		tokenIdsToSockets[tokenId] = {
			receiver: socket
		}
		socket.emit('rcjs:token', { tokenId: tokenId } );
	});

	// Request: from sender app to connect to receiver app using a valid tokenId. 
    // Response: on error sends rcjs:supplyToken message back to source, on success a 
    // rcjs:registerSender
	socket.on('rcjs:supplyToken', function (data) {
		if (tokenIdsToSockets[data.tokenId]) {
			var receiverSocket = tokenIdsToSockets[data.tokenId].receiver;
			var token = sockets[receiverSocket.id].token, receiver;
			if (token) {
				if (sockets[receiverSocket.id].peerSocket) {
					socket.emit('rcjs:supplyToken', { error: 'invalid token (already in use)' } );
				} else if (new Date().getTime() > token.timeStamp + TOKEN_TTL) {
					socket.emit('rcjs:supplyToken', { error: 'invalid token (expired)' } );
					delete tokenIdsToSockets[data.tokenId];
				} else {
					sockets[receiverSocket.id].peerSocket = socket;
					sockets[receiverSocket.id].socket.emit('rcjs:registerSender', { tokenId: data.tokenId } );
					sockets[socket.id].peerSocket = sockets[receiverSocket.id].socket;
				}
			} else {
			 	socket.emit('rcjs:supplyToken', { error: 'invalid token (unknown)' } );
			}
		}
	});

	// Request: from sender app after successfully processing an rcjs:registerSender event. 
	// The key that is required for subsequent eventing from receiver to sender is created. 
	// The server sends a rcjs:startCapture event to the sender. 
	socket.on('rcjs:confirmRegistration', function (data) {
		var token = sockets[socket.id].token;
		if (token) {
			token.key = createKey();
			var sender = sockets[socket.id].peerSocket;
			sender.emit('rcjs:startCapture', { 
				tokenId: data.tokenId, 
				key: token.key, 
				events: data.events 
			});
		}
	});

	socket.on('rcjs:event', function (data) {
		if (tokenIdsToSockets[data.tokenId]) {
			var receiverSocket = tokenIdsToSockets[data.tokenId].receiver;
			if (sockets[receiverSocket.id]) {
				var token = sockets[receiverSocket.id].token;
				if (!token) {
				} else if (data.key == token.key) {
					receiverSocket.emit('rcjs:event', { type: data.type, event: data.event } );
				} else {
					socket.emit('rcjs:invalid', { error: 'invalid key' } );
				}
			}
		}
	});
});