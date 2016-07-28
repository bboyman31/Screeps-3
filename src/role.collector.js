var roleCollector = {
    /** @param {Creep} creep **/
    init: function(creep) {
        creep.memory.targetId = undefined;

        let loot = creep.room.find(FIND_DROPPED_ENERGY);
        if (loot.length) {
            creep.memory.targetId = loot[0].id;
            creep.memory.looting = true;
        } else {
            let containers = [];
            creep.room.memory.sources.forEach(function(source) {
                if (source.containerId) {
                    containers[containers.length] = Game.getObjectById(source.containerId);
                }
            });
            if (containers.length) {
                containers = _.sortBy(containers, function(container) {
                    return _.sum(container.store) * -1;
                });
                creep.memory.targetId = containers[0].id;
            }
            creep.memory.looting = false;
        }
        creep.memory.collecting = true;

        console.log('[' + creep.name + '] Gimme the money!');
        creep.say('ENERGY!');
    },
    
    /** @param {Creep} creep **/
    cleanup: function(creepMemory, roomMemory) {
        creepMemory.targetId = undefined;
        creepMemory.collecting = undefined;
        creepMemory.looting = undefined;
    },
    
    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.memory.collecting) {
            let object = Game.getObjectById(creep.memory.targetId);
            let result = undefined;
            if (creep.memory.looting) {
                result = creep.pickup(object);
            } else {
                result = creep.withdraw(object, RESOURCE_ENERGY);
            }
            if (result === ERR_NOT_IN_RANGE) {
                creep.moveTo(object);
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
                if (targets.length == 0) {
                    targets = creep.room.find(FIND_STRUCTURES, {
                        filter: (tower) => {
                            return (tower.structureType == STRUCTURE_TOWER && tower.energy < tower.energyCapacity);
                        }
                    });
                }
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
