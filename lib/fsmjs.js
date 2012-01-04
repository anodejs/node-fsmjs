var util = require('util');

module.exports = function(states, opts) {
	var that = states;

	opts = opts || {};

	// mixin eventemitter
	var ee = new process.EventEmitter();
	for (var k in ee) that[k] = ee[k];

	// some local state
	var events = [];
	var states = states;
	var current = Object.keys(states)[0];

	that.trigger = function(name, _args) {
		var args = []; for (var k in arguments) args.push(arguments[k]);
		args.shift(); // first argument is the event name
		
		return queue(function(cb) {
			debug(current + "." + name + "(" + args.slice(2) + ")");

			// call handler, if defined, or just move to next event
			var handler = lookup(states[current], name);
			if (handler) {

				// first argument is callback, last is event name	
				args.unshift(cb);
				args.push(name);

				return handler.apply(that, args);
			}
			
			return cb();
		});
	};

	// enqueues a state change (with $exit and $enter)
	that.change = function(next) {
		var prev = current;
		
		that.trigger('$exit', prev, next);
		
		queue(function(cb) {
			debug(prev + " => " + next);

			current = next;
			return cb();
		});

		that.trigger('$enter', prev, next);
		
		return true;
	};

	// queues an emission of an event emitter event
	that.qemit = function() {
		var args = [];
		for (var k in arguments) args.push(arguments[k]);
		
		return queue(function(cb) {
			debug("@" + args[0]);
			that.emit.apply(that, args);
			return cb();
		});
	};

	// set current state (queues '$exit' to leaving state
	// and '$enter' from entering state).
	that.__defineSetter__('state', that.change);
	that.__defineGetter__('state', function() {	return current;	});

	// queue a trigger every interval
	that.interval = function(trigger, interval) {
		return setInterval(function() {
			that.trigger(trigger);
		}, interval);
	};

	// queue a a trigger after a timeout
	that.timeout = function(trigger, timeout) {
		return setTimeout(function() {
			that.trigger(trigger);
		}, timeout);
	};

	// enqueue an event
	function queue(event, _args_) {
		events.push(event);
		if (events.length === 1) return tick();
		return false;
	};

	// process events from queue
	function tick() {
		if (!current) throw new Error("No state");
		if (events.length === 0) return false;

		// this is the event loop, awesone.		
		var fn = events[0];
//		console.log('handing event:', fn);
		return fn(function() {
			events.shift();
			return tick();
		});
	};

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

	function debug(msg) {
		return that.emit('$debug', msg);
	}
	
	return that;
};