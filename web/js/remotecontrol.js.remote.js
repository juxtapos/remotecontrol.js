function RemoteControl (options) {
	var options = options || {},
		host = options.host,
		port = options.port,
		socket = io.connect(host + ':' + port),
		self = this;
	this.key = null; // supplied by server on successful peering
	this.captureEvents = []; // supplied from receiver
	this.events = {};
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
				this.emit('rcjs:error', { msg: data.error } );
			}
		});

		socket.on('disconnect', function (data) {
			//console.log(data.error);
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
		var method = doCapture ? window.addEventListener : window.removeEventListener;
		self.captureEvents = events || self.captureEvents;
		self.captureEvents.forEach(function (type) { 
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
			if (event[prop]) {
				Array.prototype.forEach.call(event[prop], function (touch) {
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
		emitEvent('rcjs:supplyToken', { tokenId: tokenId } );
	}

	/**
	 * Simple event listener implementation. Allows for the registration of all events that are
	 * captured per options, plus event types that are prefixed 'rcjs:'.
	 * 
	 * @param type {String} Event type identifier.
	 * @param handler {Function} Event handler function.
	 */
	function addEventListener (type, handler) {
		if (!type.indexOf('rcjs:') || ~self.captureEvents.indexOf(type)) {
			if (!(type in self.events)) {
				self.events[type] = [];
			}
			self.events[type].push(handler);
		}
	}

	/**
	 * Removes the given type and handler pair from the list of registered event listeners. 
	 * 
	 * @param type {String} Event type. 
	 * @param handler {Function} Handler function. 
	 */
	function removeEventListener (type, handler) {
		if (self.events[type]) {
			for (var i = 0, 
					 et = self.events[type], 
					 etl = et.length; i < l; i++) {
				if (et[i] === handler) {
					self.events[type] = et.slice(0, i == 0 ? 0 : i  >= etl ? etl - 1 : i)
									 	  .concat(et.slice(i + 1, etl));
					break;
				}
			}
		}
	}

	/**
	 * Emits any type of event to all registered listeners. Additional arguments used for calling
	 * this method are used as listener function arguments. 
	 * 
	 * @param type {String} Event type. 
	 * @param handler {Function} Handler function. 
	 */
	function emitEvent (type) {
		var args = arguments;
		if (self.events[type]) {
			self.events[type].forEach(function (obj) {
				obj.apply(self, Array.prototype.slice.call(args, 1));
			});
		}
	}

	return {
		supplyToken: supplyToken,
		addEventListener: addEventListener,
		removeEventListener: removeEventListener
	}
}
