var util = require('util');

module.exports = function(states) {
	var that = states;

	// mixin eventemitter
	var ee = new process.EventEmitter();
	for (var k in ee) that[k] = ee[k];

	// some local state
	var events = [];
	var states = states;
	var current = Object.keys(states)[0];

	// push an event. callback is called after event is handled
	that.push = function(event, _args_, _callback_) {
		var callback = null;
		
		var args = []; for (var k in arguments) args.push(arguments[k]);
		args.shift(); // first argument is the event name

		// callback is last one, if at all
		if (typeof args[args.length - 1] === "function") {
			callback = args[args.length - 1];
			args.pop();
		}

		if (!callback) callback = function() { };
		events.push({ name: event, args: args, callback: callback });
		if (events.length === 1) return tick();
		return false;
	};

	// push event every interval
	that.interval = function(event, interval) {
		return setInterval(function() {
			that.push(event);
		}, interval);
	};

	// push an event after a timeout
	that.timeout = function(event, timeout) {
		return setTimeout(function() {
			that.push(event);
		}, timeout);
	};

	// set current state (pushes '$exit' to leaving state
	// and '$enter' from entering state).
	that.__defineSetter__('state', function(next) {
		var prev = current;
		return that.push('$exit', prev, next, function() {
			current = next;
			that.emit(next);
			return that.push('$enter', prev, next);
		});
	});

	// retrieve the current state
	that.__defineGetter__('state', function() {
		return current;
	});
	
	// finds an event in a state. returns a function.
	function lookup(state, event) {
		if (!state) return null;

		// if the state is a function, it matches the $enter event.
		if (typeof state === "function" && event === "$enter") return state;

		// look for a key that matches
		for (var key in state) {
			var match = false;
		
			if (event[0] === "$") match = (event === key);
			else match = new RegExp("^" + key + "$").test(event);

			if (match) {
				var handler = state[key];

				// convert string handler to a function the changes state
				if (typeof handler === "string") handler = (function(_h) { 
					return function(_cb) { 
						that.state = _h;
						return _cb(); 
					};
				})(handler);
				
				// now, only functions are allowed
				if (typeof handler !== "function") {
					throw new Error("Handles must be either {string} with target state or {function(cb)}");
				}

				return handler;
			}
		}

		return null;
	}

	// process events from queue
	function tick() {
		if (!current) throw new Error("No state");
		if (events.length === 0) return false;
		
		// extract next event (and promise)
		var event = events[0];
		function next() {
			events.shift();
			tick();
			return event.callback();
		}

		// emit 'state.event' event
		var name = current + "." + event.name;
		
		// clone args
		var args = [];
		event.args.forEach(function(arg) { args.push(arg); });
		args.unshift(name);

		// emit eventemitter event, with args
		that.emit.apply(that, args);

		// call handler, if defined, or just move to next event
		var handler = lookup(states[current], event.name);
		if (handler) {

			// first argument is callback, last is event name	
			args.shift();
			args.unshift(next);
			args.push(event.name);

			return handler.apply(that, args);
		}
		
		return next();
	};

	return that;
};