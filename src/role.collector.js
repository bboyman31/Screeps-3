var roleCollector = {
    /** @param {Creep} creep **/
    init: function(creep) {

        let containers = [];
        creep.room.memory.sources.forEach(function(source) {
            if (source.containerId) {
                containers[containers.length] = Game.getObjectById(source.containerId);
            }
        });

        creep.memory.targetId = undefined;
        if (containers.length) {
            containers = _.sortBy(containers, function(container) {
                _.sum(container.store);
            });
            creep.memory.targetId = containers[0].id;
        }
        creep.memory.collecting = true;

        console.log('[' + creep.name + '] Gimme the money!');
        creep.say('Gimme the money!');
    },
    
    /** @param {Creep} creep **/
    cleanup: function(creepMemory, roomMemory) {
        creepMemory.targetId = undefined;
        creepMemory.collecting = undefined;
    },
    
    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.memory.collecting) {
            let container = Game.getObjectById(creep.memory.targetId);
            let result = creep.withdraw(container, RESOURCE_ENERGY);
            if (result === ERR_NOT_IN_RANGE) {
                creep.moveTo(container);
                return true;
            } else if (result === OK) {
                creep.memory.collecting = false;
                return true;
            } else if (result === ERR_FULL) {
                creep.memory.collecting = false;
                return true;
            }
        } else {
            if (creep.carry.energy > 0) {
                let targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                            structure.energy < structure.energyCapacity;
                    }
                });
                if (targets.length > 0) {
                    if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(targets[0]);
                    }
                } else {
                    targets = creep.room.find(FIND_STRUCTURES, {
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
                return true;
            }
        }
        return false;
    }
};

module.exports = roleCollector;
