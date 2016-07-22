var sourceHelper = require('helper.source');

var roleMiner = {
    /** @param {Creep} creep **/
    init: function(creep) {
        creep.memory.targetIndex = creep.room.getUnderMinedSource();
        sourceHelper.addMiner(creep.room.memory.sources[creep.memory.targetIndex]);
        creep.memory.unloading = false;
        console.log('[' + creep.name + '] Hi ho, hi ho!');
        creep.say('MINING!');
    },
    
    /** @param {Creep} creep **/
    cleanup: function(creepMemory, roomMemory) {
        if (creepMemory.targetIndex !== undefined) {
            sourceHelper.removeMiner(roomMemory.sources[creepMemory.targetIndex]);
            creepMemory.targetIndex = undefined;
        }
        creepMemory.unloading = undefined;
    },
    
    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.memory.unloading && creep.carry.energy === 0) {
            // Finished task
            return false;
        }
        if (!creep.memory.unloading && creep.carry.energy === creep.carryCapacity) {
            creep.memory.unloading = true;
        }

        if (!creep.memory.unloading) {
            let source = Game.getObjectById(creep.room.memory.sources[creep.memory.targetIndex].id);
            if(creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
        } else {
            let container = Game.getObjectById(creep.room.memory.sources[creep.memory.targetIndex].containerId);
            if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(container);
            }
            return false;
        }
        return true;
    }
};

module.exports = roleMiner;
