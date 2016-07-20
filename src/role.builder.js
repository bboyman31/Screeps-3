var roleBuilder = {
    /** @param {Creep} creep **/
    init: function(creep) {
        if (!creep.room.memory.sources) {
            var sources = creep.room.find(FIND_SOURCES);
            creep.room.memory.sources = new Array(sources.length);
            for (var i = 0; i < sources.length; i++) {
                creep.room.memory.sources[i] = sources[i].id;
            }
        }
        if (!creep.room.memory.sourceWorkers) {
            creep.room.memory.sourceWorkers = new Array(creep.room.memory.sources.length);
            for (var i = 0; i < creep.room.memory.sourceWorkers.length; i++) {
                creep.room.memory.sourceWorkers[i] = 0;
            }
        }
        creep.memory.targetIndex = undefined;
        for (var i = 0; i < creep.room.memory.sourceWorkers.length; i++) {
            if (creep.memory.targetIndex === undefined || creep.room.memory.sourceWorkers[i] < creep.room.memory.sourceWorkers[creep.memory.targetIndex]) {
                creep.memory.targetIndex = i;
            }
        }
        creep.room.memory.sourceWorkers[creep.memory.targetIndex]++;
        creep.memory.building = false;
    },
    
    /** @param {Creep} creep **/
    cleanup: function(creep) {
        if (creep.memory.targetIndex !== undefined) {
            creep.room.memory.sourceWorkers[creep.memory.targetIndex]--;
            creep.memory.targetIndex = undefined;
        }
        creep.memory.building = undefined;
    },
    
    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.memory.building && creep.carry.energy == 0) {
            return false;
        }
        if (!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
            creep.memory.building = true;
        }

        if(creep.memory.building) {
            var sites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
            if (creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sites[0]);
            }
        } else {
            if (creep.memory.targetIndex === undefined) return false; // Should have target, but if not let's cancel task.
            var source = Game.getObjectById(creep.room.memory.sources[creep.memory.targetIndex]);
            if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
        }
        return true;
    }
};

module.exports = roleBuilder;