function RemoteControl (options) {
	var options = options || {},
		host = options.host,
		port = options.port,
		socket = io.connect(host + ':' + port),
		self = this;
	this.key = null; // supplied by server on successful peering
	this.captureEvents = []; // supplied from receiver
	this.token = null;

	socket.on('connect', function () {
		console.log('connected to server');

		socket.on('rcjs:startCapture', function (data) {
			self.key = data.key;
			capture(true, data.events);
		});

		socket.on('rcjs:receiverDisconnect', function (data) {
			console.log('receiver disconnected');
		});

		socket.on('rcjs:supplyToken', function (data) {
			if (data.error) {
				console.log(data.error);
			}
		});

		socket.on('disconnect', function (data) {
			console.log(data.error);
		});
	});

	function touchEventHandler (event) {
		var eventobj = copyTouchEvent(event);
		socket.emit('rcjs:event', { type: event.type, event: eventobj, key: self.key, tokenId: self.tokenId } );
		event.preventDefault();
	}

	function genericEventHandler(event) {
		touchEventHandler(event);
	}

	function capture(doCapture, events) {
		console.log('capture');
		var method = doCapture ? window.addEventListener : window.removeEventListener;
		self.captureEvents = events || self.captureEvents;
		self.captureEvents.forEach(function (type) { 
			console.log('capture ' + type);
			try {
				method(type, genericEventHandler, false); 
			} catch (ex) {
				console.log(ex);
			} 
		} );
	}

	var copyTouchEvent = window.navigator.msPointerEnabled ? copyMSTouchEvent : copyWebkitTouchEvent;

	function copyMSTouchEvent(event) {
		return {
			rotation: event.rotation,
			identifier: event.identifier
		}
	}

	function copyWebkitTouchEvent(event) {

		function copyTouches (prop) {
			var a = [];
			console.log('.....');
			if (event.prop) {
				console.log('copy ' + event.prop);
				Array.prototype.forEach.call(event[prop], function (touch) {
					console.log('copying ' + event.prop);
					a.push(copyTouch(touch));
				});
			}
			return a;
		}

		function copyTouch (event) {
			return {
				clientX: event.clientX,
				clientY: event.clientY,
				pageX: event.pageX,
				pageY: event.pageY,
				identifier: event.identifier
			};
		}

		return {
			changedTouches: event.changedTouches ? copyTouches('changedTouches') : null,
			targetTouches: copyTouches('targetTouches'),
			touches: copyTouches('touches'),
			rotation: event.rotation,
			scale: event.scale,
			gamma: event.gamma,
			beta: event.beta,
			clientX: event.clientX,
			clientY: event.clientY,
			pageX: event.pageX,
			pageY: event.pageY,
			type: event.type
		};
	}

	function supplyToken (tokenId) {
		self.tokenId = tokenId;
		socket.emit('rcjs:supplyToken', { tokenId: tokenId } );
	}

	return {
		supplyToken: supplyToken
	}
}
