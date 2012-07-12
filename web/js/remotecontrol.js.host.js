function RemoteControlHost (options) {
	var options = options || {},
		socket = io.connect(options.host + ':' + options.port),
		self = this;
	this.captureEvents = options.capture || []; // required by the EventHandler 'mixin' 
	this.events = {};	// required by the EventHandler 'mixin'
	
	socket.on('connect', function () {
		console.log('connected to server');

		// Request: from server to receiver after a valid rcjs:supplyToken message from sender. 
		// Response: rcjs:confirmRegister message to server.  
		socket.on('rcjs:registerSender', function (data) {
			console.log('sender registered');
			socket.emit('rcjs:confirmRegistration', { tokenId: data.tokenId, events: self.captureEvents } );
			socket.on('rcjs:event', function (data) {
				type = data.type;
				if (type) { self.emitEvent(type, data.event); }
			} );
		});

		// Request: from server as response to rcjs:requestToken message with tokenId property.
		// Emits rcjs:requestToken event 
		socket.on('rcjs:token', function (data) {
			self.emitEvent('rcjs:token', data);
		});
	});

	/**
	 * Sends a token request message to the server. 
	 */
	function requestToken() {
		socket.emit('rcjs:requestToken');
	}

	function plugin (objs) {
		for (event in objs) {
			this.addEventListener(event, objs[event]);
		}
	}

	this.addEventListener = function () {
		EventHandler.addEventListener.apply(self, arguments);
	}

	this.removeEventListener = function () {
		EventHandler.removeEventListener.apply(self, arguments);
	}

	this.emitEvent = function () {
		EventHandler.emitEvent.apply(self, arguments);
	}

	return {
		requestToken: requestToken, 
		addEventListener: this.addEventListener,
		removeEventListener: this.removeEventListener,
		emitEvent: this.emitEvent,
		plugin: plugin
	};
}