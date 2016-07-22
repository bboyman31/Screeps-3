var roomManager = require('manager.room');

module.exports.loop = function () {
    roomManager.run();
};

Room.prototype.getUnderworkedSource = function() {
	let sourceIndex = undefined;
    for (var i = 0; i < this.memory.sources.length; i++) {
    	if (!this.memory.sources[i].workerCount) this.memory.sources[i].workerCount = 0;
        if (sourceIndex === undefined || this.memory.sources[i].workerCount < this.memory.sources[sourceIndex].workerCount) {
            sourceIndex = i;
        }
    }
    return sourceIndex;
};

Room.prototype.getUnderMinedSource = function() {
	let sourceIndex = undefined;
    for (var i = 0; i < this.memory.sources.length; i++) {
    	if (!this.memory.sources[i].minerCount) this.memory.sources[i].minerCount = 0;
        if (sourceIndex === undefined || this.memory.sources[i].minerCount < this.memory.sources[sourceIndex].minerCount) {
            sourceIndex = i;
        }
    }
    return sourceIndex;
};
