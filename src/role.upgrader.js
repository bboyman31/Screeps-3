var roleUpgrader = {
    /** @param {Creep} creep **/
    init: function(creep) {
        
    },
    
    /** @param {Creep} creep **/
    cleanup: function(creep) {
        
    },
    
    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.upgrading && creep.carry.energy == 0) {
            creep.memory.upgrading = false;
        }
        if(!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
            creep.memory.upgrading = true;
        }

        if(creep.memory.upgrading) {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
        }
        else {
            var loot = creep.room.find(FIND_DROPPED_RESOURCES);
            if (loot && loot.length > 0) {
                if (creep.pickup(loot[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(loot[0]);
                }
            } else {
                var sources = creep.room.find(FIND_SOURCES);
                if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(sources[0]);
                }
            }
        }
        return true;
    }
};

module.exports = roleUpgrader;
