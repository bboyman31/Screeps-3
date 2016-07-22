var sourceHelper = {

    addWorker: function(source) {
        if (source.workerCount === undefined) source.workerCount = 0;
        source.workerCount++;
    },

    removeWorker: function(source) {
        if (source.workerCount === undefined) source.workerCount = 0;
        source.workerCount--;
        if (source.workerCount < 0) {
            source.workerCount = 0;
        }
    },

    addMiner: function(source) {
        if (source.minerCount === undefined) source.minerCount = 0;
        source.minerCount++;
    },

    removeMiner: function(source) {
        if (source.minerCount === undefined) source.minerCount = 0;
        source.minerCount--;
        if (source.minerCount < 0) {
            source.minerCount = 0;
        }
    }

};

module.exports = sourceHelper;
