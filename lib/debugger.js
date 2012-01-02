var rl = require('readline');

module.exports = function(fsm, options) {
	options = options || {};
	var logger = options.logger = options.logger || console;
	var verbose  = options.verbose;

	var i = rl.createInterface(process.stdin, process.stdout, null);

	// override 'emit' so we can capture all events
	var _emit = fsm.emit;

	function updatePrompt() {
		var events = Object.keys(fsm[fsm.state]).join(', ');
		i.setPrompt(fsm.state + ' [ ' + events + ' ] $ ');
		return i.prompt();
	}

	fsm.emit = function() {
		var args = [];
		for (var k in arguments) args.push(arguments[k]);

		var name = args[0];
		args.shift();
		var msg = name + "(" + args.map(function(arg) { return JSON.stringify(arg); }).join(", ") + ")";
		if (verbose) logger.log(':', msg);
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
