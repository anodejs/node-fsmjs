var fsmjs = require('../lib/fsmjs');

var machine = fsmjs({

	idle: {

		'(start|s)': function(cb) {
			console.log('starting engine...');
			return setTimeout(function() {
				console.log('lets rock');
				machine.state = 'started';
				return cb(); 
			}, 2000);
		},

		exit: 'end',

	},
 	
 	started: {

		'(stop|x)': function(cb) {
			console.log('okay, stopping dude...');

			var countdown = 4;

			(function _tick() {
				if (countdown-- === 0) {
					console.log('all done...');
					machine.state = 'idle';
					return cb();
				}

				console.log(countdown, 'seconds left');
				return setTimeout(_tick, 1000);
			})();
		},

		exit: 'end',
		
	},

	// states can be defined as functions, in which case the function
	// will be called when entering the state
	end: function(cb) {
		console.log('farewell...');
		process.exit();
		cb();
	}

});

// start debugger
require('../lib/debugger')(machine);
