var roleHarvester = {
    /** @param {Creep} creep **/
    init: function(creep) {
        creep.memory.targetIndex = creep.room.getUnderworkedSource();
        creep.room.memory.sources[creep.memory.targetIndex].workerCount++;
        console.log('[' + creep.name + '] POWER OVERWHELMING!');
    },
    
    /** @param {Creep} creep **/
    cleanup: function(creepMemory, roomMemory) {
        if (creepMemory.targetIndex !== undefined) {
            roomMemory.sources[creepMemory.targetIndex].workerCount--;
            creepMemory.targetIndex = undefined;
        }
    },
    
    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.carry.energy < creep.carryCapacity) {
            var source = Game.getObjectById(creep.room.memory.sources[creep.memory.targetIndex].id);
            if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
        } else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                            structure.energy < structure.energyCapacity;
                    }
            });
            if (targets.length > 0) {
                if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0]);
                } else {
                    return false;
                }
            } else {
                var targets = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.structureType == STRUCTURE_SPAWN);
                        }
                });
                if (targets.length > 0) {
                    var home = targets[0];
                    var dx = creep.pos.x - home.pos.x;
                    var dy = creep.pos.y - home.pos.y;
                    var distanceSq = dx * dx + dy * dy;
                    if (distanceSq > 2) {
                        creep.moveTo(home);
                    } else {
                        return false;
                    }
                }
            }
        }
        return true;
    }
};

module.exports = roleHarvester;
