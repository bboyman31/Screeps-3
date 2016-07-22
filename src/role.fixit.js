var sourceHelper = require('helper.source');

var roleFixit = {
    /** @param {Creep} creep **/
    init: function(creep) {
        creep.memory.targetSourceIndex = undefined;
        creep.memory.targetId = undefined;
        creep.memory.repairing = false;
        creep.memory.repairTargetId = undefined;
        console.log('[' + creep.name + '] Fixit! Fixit! Fixit!');
        creep.say('Fixit! Fixit! Fixit!');
    },
    
    /** @param {Creep} creep **/
    cleanup: function(creepMemory, roomMemory) {
        // TODO Remove the targetIndex stuff (left over from before).
        if (creepMemory.targetIndex !== undefined) {
            sourceHelper.removeWorker(roomMemory.sources[creepMemory.targetIndex]);
            creepMemory.targetIndex = undefined;
        }
        if (creepMemory.targetSourceIndex !== undefined) {
            sourceHelper.removeWorker(roomMemory.sources[creepMemory.targetSourceIndex]);
            creepMemory.targetSourceIndex = undefined;
        }
        creepMemory.targetId = undefined;
        creepMemory.repairing = undefined;
        creepMemory.repairTargetId = undefined;
    },
    
    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.memory.repairing && creep.carry.energy == 0) {
            // Finished task
            return false;
        }
        if (!creep.memory.repairing && creep.carry.energy == creep.carryCapacity) {
            creep.memory.repairing = true;
        }

        if(creep.memory.repairing) {
            if (!creep.memory.repairTargetId) {
                let structures = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.hits < structure.hitsMax);
                    }
                });
                structures = _.sortBy(structures, function(structure) { return structure.hits / Math.min(structure.hitsMax, 250000); });
                creep.memory.repairTargetId = structures[0].id;
            }

            let structure = Game.getObjectById(creep.memory.repairTargetId);
            let result = creep.repair(structure);
            if (result == ERR_NOT_IN_RANGE) {
                creep.moveTo(structure);
            } else if (result < 0) { // Not ok, cancel repair.
                return false;
            }
            if (structure.hits === structure.hitsMax) return false; // We're done repairing.
        } else {
            if (!creep.memory.targetId) {
                if (creep.room.memory.containerCount) {
                    let container = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                        filter: function(structure) {
                            return structure.structureType === STRUCTURE_CONTAINER;
                        }
                    });
                    creep.memory.targetId = container.id;
                } else {
                    creep.memory.targetSourceIndex = creep.room.getUnderworkedSource();
                    creep.memory.targetId = creep.room.memory.sources[creep.memory.targetSourceIndex].id;
                    sourceHelper.addWorker(creep.room.memory.sources[creep.memory.targetSourceIndex]);
                }
            }
            if (creep.memory.targetId) {
                if (creep.memory.targetSourceIndex) {
                    let source = Game.getObjectById(targetId);
                    if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source);
                    }
                } else {
                    let container = Game.getObjectById(targetId);
                    if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(container);
                    }
                }
            }
        }
        return true;
    }
};

module.exports = roleFixit;
