var sourceHelper = require('helper.source');

var roleBuilder = {
    /** @param {Creep} creep **/
    init: function(creep) {
        creep.memory.targetSourceIndex = undefined;
        creep.memory.targetId = undefined;
        creep.memory.building = false;
        creep.memory.buildTargetId = undefined;
        console.log('[' + creep.name + '] Let\'s get building!');
        creep.say('BUILD!');
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
                if (constructionSites.length) {
                    creep.memory.buildTargetId = constructionSites[0].id;
                } else {
                    // Our build target has disappeared so we'll cancel our task.
                    return false;
                }
            }

            let constructionSite = Game.getObjectById(creep.memory.buildTargetId);
            let result = creep.build(constructionSite);
            if (result == ERR_NOT_IN_RANGE) {
                creep.moveTo(constructionSite);
            } else if (result < 0) { // Not ok, cancel construction.
                return false;
            }
        } else {
            if (!creep.memory.targetId) {
                if (creep.room.memory.containerCount) {

                    let container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: { structureType: STRUCTURE_CONTAINER }
                    });

                    if (container) {
                        creep.memory.targetId = container.id;
                    } else {
                        console.log('Fallback');
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
                    }
                    
                } else {
                    creep.memory.targetSourceIndex = creep.room.getUnderworkedSource();
                    creep.memory.targetId = creep.room.memory.sources[creep.memory.targetSourceIndex].id;
                    sourceHelper.addWorker(creep.room.memory.sources[creep.memory.targetSourceIndex]);
                }
            }
            if (creep.memory.targetId) {
                if (creep.memory.targetSourceIndex) {
                    let source = Game.getObjectById(creep.memory.targetId);
                    if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(source);
                    }
                } else {
                    let container = Game.getObjectById(creep.memory.targetId);
                    let result = creep.withdraw(container, RESOURCE_ENERGY);
                    if (result == ERR_NOT_IN_RANGE) {
                        creep.moveTo(container);
                    } else if (result == ERR_NOT_ENOUGH_RESOURCES) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
};

module.exports = roleBuilder;
