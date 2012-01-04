var rl = require('readline');

module.exports = function(fsm, options) {
	options = options || {};
	var logger = options.logger = options.logger || console;
	var verbose  = options.verbose;
	var logonly = options.logonly;
	var fsmname = fsm.name || '';

	if (fsm.debuggerAttached) return this;
	fsm.debuggerAttached = this;

	fsm.on('$debug', function(msg) {
		if (verbose) logger.log("[fsmdebug]", fsmname, '|', msg);
	});

	if (!logonly) {

		function _completer(subst) {
			return [ Object.keys(fsm[fsm.state]), subst ];
		}

		var i = rl.createInterface(process.stdin, process.stdout, _completer);

		function updatePrompt() {
			var events;
			if (fsm[fsm.state]) events = Object.keys(fsm[fsm.state]).join(', ');
			else events = '';

			i.setPrompt(fsmname + "@" + fsm.state + ' [ ' + events + ' ] $ ');
			return i.prompt();
		}

		i.on('line', function(line) {
			if (line) {
				if (line === "-v") verbose = true;
				else {
					var parts = line.split(' ');
					fsm.trigger.apply(fsm, parts);
				}
			}
			return updatePrompt();
		});

		updatePrompt();
	}

	return this;
};
