var socketio = require('socket.io'),
	crypto = require('crypto'),
	io = socketio.listen(1337),
	tokens = {},
	TOKEN_TTL = 60000;

io.configure(function(){
    io.enable('browser client etag');
    io.set('log level', 1); // 3 for full message logging
    io.set('debug', true); // set to true for testing, sends token automatically to next connecting client. 
});

function createTokenId() {
	var salt = "AddS417",
		sha = crypto.createHash('sha1').update(Math.random() + new Date().getTime() + salt).digest('hex'), 
		offset = parseInt(Math.random() * (sha.length - 5))
	return sha.substring(offset, offset + 5);
}


var last_token_danger = null;

var sockets = {};

io.sockets.on('connection', function (socket) {
	console.log('client connected')

	if (io.get('debug')) {
		socket.emit('last_token_danger', { last_token_danger: last_token_danger } );
	}

/*
	if (!sockets[socket.id]) {
		console.log('add socket');
		sockets[socket.id] = socket;
	}*/

	socket.on('disconnect', function () {
		console.log('disconnect');
		console.log(this.id)
		if (socket.get('remoteTarget', function (err, obj) {
			console.log('remoteTarget');console.log(obj);
			obj && obj.emit('disconnect', { error: 'remote host disconnected' } );
		}));
	});

	socket.on('host:getToken', function (data) {
		var token = createTokenId();
		tokens[token] = {
			timeStamp: new Date().getTime(),
			sourceSocket: socket,
		}

		last_token_danger = token;

		socket.emit('receiveToken', { tokenId: token });
	});

	

	socket.on('remote:supplyToken', function (data) {
		if (tokens[data.tokenId]) {
			var token = tokens[data.tokenId];
			if (token.targetSocket) {
				socket.emit('supplyToken', { error: "invalid token (already in use)" } );
			} else if (new Date().getTime() > token.timeStamp + TOKEN_TTL) {
				socket.emit('supplyToken', { error: "invalid token (expired)" } );
				delete tokens[data.tokenId];
			} else {
				token.targetSocket = this;
				token.sourceSocket.emit('register', { tokenId: data.tokenId } );
			}
		} else {
			socket.emit('supplyToken', { error: "invalid token (unknown)" } );
		}
	});

	socket.on('*', function () {
		console.log('yoghurt');

	});

	socket.on('confirmRegister', function (data) {
		tokens[data.tokenId].targetSocket.set('remoteTarget', this);
		tokens[data.tokenId].targetSocket.emit('confirmRegister', { tokenId: data.tokenId } );
	});

	// 
	// Register handlers for all gesture and touch event messages coming from the socket
	[
		'event:MSPointerDown', 'event:MSPointerMove', 'event:MSPointerUp', 
		'event:MSGestureStart', 'event:MSGestureChange', 'event:MSGestureEnd', 
		'event:gesturestart', 'event:gesturechange', 'event:gestureend', 
		'event:touchstart', 'event:touchmove','event:touchend'
	].forEach(function (type) {
		socket.on(type, function (data) {
			this.get('remoteTarget', function (err, obj) {
				obj.emit(type, data);	
			});
		});
	});
});