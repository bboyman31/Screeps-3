var sourceHelper = {
    addWorker: function(source) {
        source.workerCount++;
    },

    removeWorker: function(source) {
        source.workerCount--;
        if (source.workerCount < 0) {
            source.workerCount = 0;
        }
    }
};

module.exports = sourceHelper;
