function RemoteControl (options) {
	var options = options || {},
		host = options.host || location.host,
		port = options.port || 1337,
		socket = io.connect(host + ':' + port);

	socket.on('connect', function () {
		console.log('connect');
	});

	socket.on('confirmRegister', function () {
		console.log('confirmRegister');
		capture(true);
	});

	socket.on('disconnect', function (data) {
		console.log(data.error);
	});

	socket.on('last_token_danger', function (data) {
		document.getElementById('tokenField').value = data.last_token_danger;
	});

	socket.on('supplyToken', function (data) {
		if (data.error) {
			console.log(data.error);
		}
	});

	function touchEventHandler (event) {
		var msg = copyTouchEvent(event);
		socket.emit('event:' + event.type, msg);
		event.preventDefault();
	}

	function capture(doCapture) {
		var method = doCapture ? window.addEventListener : window.removeEventListener;
		// Internet Explorer 10
		if (window.navigator.msPointerEnabled) {
			[
				'MSPointerDown', 'MSPointerMove', 'MSPointerUp', 
				'MSGestureStart', 'MSGestureChange', 'MSGestureEnd'
			].forEach(function (type) { method(type, touchEventHandler, false); } );
		// Webkit
		} else {
			[
				'gesturestart', 'gesturechange', 'gestureend', 
				'touchmove', 'touchstart', 'touchend'
			].forEach(function (type) { method(type, touchEventHandler, false); });
		}
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
			Array.prototype.forEach.call(event[prop], function (touch) {
				a.push(copyTouch(touch));
			});
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
			scale: event.scale
		};
	}

	function supplyToken (tokenId) {
		socket.emit('supplyToken', { tokenId: tokenId } );
	}

	return {
		supplyToken: supplyToken
	}
}
