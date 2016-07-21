var roleBuilder = {
    /** @param {Creep} creep **/
    init: function(creep) {
        creep.memory.targetIndex = creep.room.getUnderworkedSource();
        creep.room.memory.sources[creep.memory.targetIndex].workerCount++;
        creep.memory.building = false;
        creep.memory.buildTargetId = undefined;
        console.log('[' + creep.name + '] Let\'s get building!');
    },
    
    /** @param {Creep} creep **/
    cleanup: function(creepMemory, roomMemory) {
        if (creepMemory.targetIndex !== undefined) {
            roomMemory.sources[creepMemory.targetIndex].workerCount--;
            creepMemory.targetIndex = undefined;
        }
        creepMemory.building = undefined;
        creepMemory.buildTargetId = undefined;
    },
    
    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.memory.building && creep.carry.energy == 0) {
            // Finished task
            return false;
        }
        if (!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
            creep.memory.building = true;
        }

        if (creep.memory.building) {
            if (!creep.memory.buildTargetId) {
                let constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
                creep.memory.buildTargetId = constructionSites[0].id;
            }

            let constructionSite = Game.getObjectById(creep.memory.buildTargetId);
            let result = creep.build(constructionSite);
            if (result == ERR_NOT_IN_RANGE) {
                creep.moveTo(constructionSite);
            } else if (result < 0) { // Not ok, cancel construction.
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

module.exports = roleBuilder;
