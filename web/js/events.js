var EventHandler = {
	/**
	 * Simple event listener implementation. Allows for the registration of all events that are
	 * captured per options, plus event types that are prefixed 'rcjs:'.
	 * 
	 * @param type {String} Event type identifier.
	 * @param handler {Function} Event handler function.
	 */
	addEventListener: function addEventListener (type, handler) {
		if (!type.indexOf('rcjs:') || ~this.captureEvents.indexOf(type)) {
			if (!(type in this.events)) {
				this.events[type] = [];
			}
			this.events[type].push(handler);
		}
	},

	/**
	 * Removes the given type and handler pair from the list of registered event listeners. 
	 * 
	 * @param type {String} Event type. 
	 * @param handler {Function} Handler function. 
	 */
	removeEventListener: function removeEventListener (type, handler) {
		if (this.events[type]) {
			for (var i = 0, 
					 et = this.events[type], 
					 etl = et.length; i < l; i++) {
				if (et[i] === handler) {
					this.events[type] = et.slice(0, i == 0 ? 0 : i  >= etl ? etl - 1 : i)
									 	  .concat(et.slice(i + 1, etl));
					break;
				}
			}
		}
	},

	/**
	 * Emits any type of event to all registered listeners. Additional arguments used for calling
	 * this method are used as listener function arguments. 
	 * 
	 * @param type {String} Event type. 
	 * @param handler {Function} Handler function. 
	 */
	emitEvent: function emitEvent (type) {
		var args = arguments;
		if (this.events[type]) {
			this.events[type].forEach(function (obj) {
				obj.apply(this, Array.prototype.slice.call(args, 1));
			});
		}
	}
}
	