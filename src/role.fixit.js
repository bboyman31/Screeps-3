var roleFixit = {
    /** @param {Creep} creep **/
    init: function(creep) {
        creep.memory.targetIndex = creep.room.getUnderworkedSource();
        creep.room.memory.sources[creep.memory.targetIndex].workerCount++;
        creep.memory.repairing = false;
        creep.memory.repairTargetId = undefined;
        console.log('[' + creep.name + '] Fixit! Fixit! Fixit!');
    },
    
    /** @param {Creep} creep **/
    cleanup: function(creep) {
        if (creep.memory.targetIndex !== undefined) {
            creep.room.memory.sources[creep.memory.targetIndex].workerCount--;
            creep.memory.targetIndex = undefined;
        }
        creep.memory.repairing = undefined;
        creep.memory.repairTargetId = undefined;
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
                creep.memory.repairTargetId = structures[0].id;
            }

            let structure = Game.getObjectById(creep.memory.repairTargetId);
            let result = creep.repair(structure);
            if (result == ERR_NOT_IN_RANGE) {
                creep.moveTo(structure);
            } else if (result < 0) { // Not ok, cancel repair.
                return false;
            }
        } else {
            if (creep.memory.targetIndex === undefined) return false; // Should have target, but if not let's cancel task.
            var source = Game.getObjectById(creep.room.memory.sources[creep.memory.targetIndex].id);
            if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
        }
        return true;
    }
};

module.exports = roleFixit;
