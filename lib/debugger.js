var rl = require('readline');

module.exports = function(fsm, options) {
	options = options || {};
	var logger = options.logger = options.logger || console;
	var verbose  = options.verbose;

	var i = rl.createInterface(process.stdin, process.stdout, null);


	function updatePrompt() {
		var events;
		if (fsm[fsm.state]) events = Object.keys(fsm[fsm.state]).join(', ');
		else events = '';

		i.setPrompt(fsm.state + ' [ ' + events + ' ] $ ');
		return i.prompt();
	}

	// override 'emit' so we can capture all events
	var _emit = fsm.emit;

	fsm.emit = function() {
		var args = [];
		for (var k in arguments) args.push(arguments[k]);

		var name = args[0];
		
		args.shift();
		var msg = name + "(" + args.map(function(arg) { return JSON.stringify(arg); }).join(", ") + ")";
		if (verbose) logger.log(':', msg);
		args.unshift(name);

		return _emit.apply(fsm, args);
	};

	i.on('line', function(line) {
		if (line) {
			if (line === "-v") verbose = true;
			else {
				var parts = line.split(' ');
				fsm.push.apply(fsm, parts);
			}
		}
		return updatePrompt();
	});

	updatePrompt();

	return i;
};
