# fsmjs #

[![Build Status](https://secure.travis-ci.org/anodejs/node-fsmjs.png)](http://travis-ci.org/anodejs/node-fsmjs)

State machines are back, the async way!

```bash
$ npm install fsmjs
```

## By example ##

```js
var fsmjs = require('../lib/fsmjs');

var tim = fsmjs({

	idle: {

		// when 'go' or 'start' or 'g' are pushed, we move to 'running' and start
		// an interval that emits a 'tick' event every 100ms.
		'(go|start|g)': function(cb) {
			process.stdout.write('starting engines...\n');
			tim.state = 'running'; 
			tim._timer = tim.interval('tick', 100);
			cb();
		},

		// strings are target states (and emitted events)
		exit: 'end',
		e: 'error',

		// any other event in this state shows this error
		'.*': function(cb, e) {
			console.log('error: i cant understand what you mean by "' + e + '"');
			cb();
		},
	},

	running: {

		// animate clock every tick
		tick: function(cb) {
			var clock = [ '|', '/', '-', '\\' ];
			process.stdout.write('(' + clock[tim._i] + ")");
			for (var i = 0; i < 50; ++i) process.stdout.write(' ');
			process.stdout.write('\r');
			tim._i = (tim._i + 1) % clock.length;
			cb();
		},

		// cannot exit from this state
		exit: 'error',

		// when 'no' or 'stop' or 'x' are pushed, move to 'stopping' and start
		// a 2sec timeout that emits 'elapsed' when elapsed (surpise!)
		'(no|stop|x)': function(cb) { 
			process.stdout.write('stopping...\n');
			tim.state = 'stopping';
			tim.timeout('stopped', 5000);

			cb();
		},

		$exit: function(cb) {
			// take some time before changing state.
			console.log('our running times are over.. give me 2 more seconds.');
			setTimeout(cb, 2000);
		},

	},

	stopping: {

		// called when the stopping timer elapses. clears the 
		// interval and changes state to 'idle'
		stopped: function(cb) {
			process.stdout.write('\nall done.\n');
			clearInterval(tim._timer);
			tim.state = 'idle';
			cb();
		},

		// a tick during stop operation, show dots
		tick: function(cb) {
			process.stdout.write(".");
			cb();
		},

		exit: 'error',

	},

	error: function(cb, state) {
		console.log('An error occured in state', state);
		tim.state = state;
		cb();
	},

	_timer: null, // timer object to allow clearing the interval
	_i: 0, // animated clock
});

tim.on('end', function() {
	process.exit();
});

tim.on('error', function() {
	console.log('on-error');
});

tim.on('idle.start', function() {
	console.log("try 'go' the next time...");
});

var i = require('../lib/debugger')(tim, { verbose: false });
```

More examples under `examples/`.

## Lisence

MIT