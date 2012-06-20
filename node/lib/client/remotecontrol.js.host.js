function RemoteControlHost (options) {
	var options = options || {},
		host = options.host || location.host,
		port = options.port || 1337,
		captureEvents = options.capture || ['touchstart', 'touchmove', 'touchend', 'gesturestart', 'gesturechange', 'gestureend'],
		socket = io.connect(host + ':' + port),
		events = {};
			
	socket.on('connect', function () {
		console.log('connected');
		getToken();
	});

	socket.on('receiveToken', function (data) {
		console.log('receiveToken ' + data.tokenId);
		emitEvent('receiveToken', data)
	}); 

	socket.on('register', function (data) {
		console.log('register ' + data.tokenId);
		socket.emit('confirmRegister', { tokenId: data.tokenId } );

		captureEvents.forEach(function (type) { 
			socket.on(type, function (data) { emitEvent(type, data); } );
		});
	});

	function getToken() {
		socket.emit('getToken');
	}

	function addEventListener (type, handler) {
		if (~captureEvents.indexOf(type) || ~['receiveToken'].indexOf(type)) {
			if (!(type in events)) {
				events[type] = [];
			}
			events[type].push(handler);
		} else {
			throw new Error('not capturing ' + type);
		}
	}

	function removeEventListener (type, handler) {
		if (events[type]) {
			for (var i = 0, et = events.type, l = et.length; i < l; i++) {
				if (et[i] === handler) {
					events[type] = et.slice(0, i == 0 ? 0 : i  >= et.length ? et.length - 1 : i)
									.concat(et.slice(i + 1, et.length))
					break;
				}
			}
		}
	}

	function emitEvent (type) {
		var self = this, args = arguments;
		if (events[type]) {
			events[type].forEach(function (obj) {
				obj.apply(self, Array.prototype.slice.call(args, 1));
			});
		}
	}

	return {
		getToken: getToken, 
		addEventListener: addEventListener,
		removeEventListener: removeEventListener
	};
}
