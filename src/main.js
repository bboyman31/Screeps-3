var roomManager = require('manager.room');
var roleManager = require('manager.role');

module.exports.loop = function () {
    roomManager.run();
    roleManager.run();
};

Room.prototype.getUnderworkedSource = function() {
	let sourceIndex = undefined;
    for (var i = 0; i < this.memory.sources.length; i++) {
    	this.memory.sources.length
        if (sourceIndex === undefined || this.memory.sources[i].workerCount < this.memory.sources[sourceIndex].workerCount) {
            sourceIndex = i;
        }
    }
    return sourceIndex;
};