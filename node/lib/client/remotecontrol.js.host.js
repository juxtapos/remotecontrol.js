function RemoteControlHost (options) {
	var options = options || {},
		socket = io.connect(options.host + ':' + options.port),
		self = this;
	this.captureEvents = options.capture || [];
	this.events = {};
	
	socket.on('connect', function () {
		console.log('connected to server');

		// Request: from server to receiver after a valid rcjs:supplyToken message from sender. 
		// Response: rcjs:confirmRegister message to server.  
		socket.on('rcjs:registerSender', function (data) {
			socket.emit('rcjs:confirmRegistration', { tokenId: data.tokenId, events: self.captureEvents } );
			socket.on('rcjs:event', function (data) { 
				type = data.type;
				if (type) { emitEvent(type, data.event); }
			} );
		});

		// Request: from server as response to rcjs:requestToken message with tokenId property.
		// Emits rcjs:requestToken event 
		socket.on('rcjs:token', function (data) {
			emitEvent('rcjs:token', data);
		});
	});

	/**
	 * Sends a token request message to the server. 
	 */
	function requestToken() {
		socket.emit('rcjs:requestToken');
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
									 	  .concat(et.slice(i + 1, etl))
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

	/**
	 * Return public symbols.
	 */
	return {
		requestToken: requestToken, 
		addEventListener: addEventListener,
		removeEventListener: removeEventListener
	};
}