var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleFixit = require('role.fixit');
var roleMiner = require('role.miner');
var roleCollector = require('role.collector');

var managerRole = {
    run: function(room) {
        var mainSpawn = Game.getObjectById(room.memory.home.id);

        // Always place this memory cleaning code at the very top of your main loop!
        for(var name in Memory.creeps) {
            if (!Game.creeps[name]) {
                let creepMemory = Memory.creeps[name];
                let creepRoleHandler = this.getRoleHandler(creepMemory);
                if (creepRoleHandler) {
                    creepRoleHandler.cleanup(creepMemory, room.memory);
                }
                creepMemory = undefined;
                delete Memory.creeps[name];
                console.log('[RoleManager] Clearing non-existing creep memory:', name);
            }
        }

        if (!mainSpawn.memory.creepNum) {
            mainSpawn.memory.creepNum = 0;
        }

        let sourceContainers = 0;
        room.memory.sources.forEach(function(source) {
            if (source.containerId) sourceContainers++;
        });

        var creepPriority = ['harvester', 'harvester', 'harvester', 'upgrader', 'builder', 'builder', 'fixit', 'fixit', 'upgrader', 'harvester', 'harvester', 'builder', 'fixit', 'upgrader', 'upgrader'];
        switch (sourceContainers) {
            case 1 : creepPriority = ['miner', 'collector', 'collector', 'upgrader', 'builder', 'builder', 'fixit', 'fixit', 'upgrader', 'harvester', 'harvester', 'builder', 'fixit', 'upgrader', 'upgrader']; break;
            case 2 : creepPriority = ['miner', 'collector', 'miner', 'collector', 'collector', 'upgrader', 'builder', 'builder', 'fixit', 'fixit', 'upgrader', 'builder', 'fixit', 'upgrader', 'upgrader']; break;
        }

        if (_.size(Game.creeps) < creepPriority.length) {
            var extensions = _.size(mainSpawn.room.find(FIND_STRUCTURES, { filter: (structure) => { return structure.structureType == STRUCTURE_EXTENSION; } }));

            var body = [WORK, CARRY, MOVE];
            if (extensions >= 5) {
                body = [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
            }

            if (mainSpawn.canCreateCreep(body) === OK) {
                var creepName = mainSpawn.createCreep(body, 'Creep-' + (++mainSpawn.memory.creepNum), { role: 'idle', num: mainSpawn.memory.creepNum });
                if (creepName !== ERR_BUSY && creepName !== ERR_NOT_ENOUGH_ENERGY) {
                    console.log('[RoleManager] Spawning new creep: ' + creepName);
                }
            }
        }

        for(var name in Game.creeps) {
            var creep = Game.creeps[name];

            var roleHandler = this.getRoleHandler(creep.memory);
            
            if (!roleHandler) {
                var creepRoles = [];
                creepRoles['harvester'] = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester').length;
                creepRoles['upgrader'] = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader').length;
                creepRoles['builder'] = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder').length;
                creepRoles['fixit'] = _.filter(Game.creeps, (creep) => creep.memory.role == 'fixit').length;
                creepRoles['miner'] = _.filter(Game.creeps, (creep) => creep.memory.role == 'miner').length;
                creepRoles['collector'] = _.filter(Game.creeps, (creep) => creep.memory.role == 'collector').length;
                
                var desiredRole = 'idle'
                for (var i = 0; i < creepPriority.length; i++) {
                    creepRoles[creepPriority[i]]--;
                    if (creepRoles[creepPriority[i]] < 0) {
                        desiredRole = creepPriority[i];
                        break;
                    }
                }
                
                // If we're a harvester but we have too much energy, let's help the builders
                if (desiredRole === 'harvester') {
                    var energyTargets = creep.room.find(FIND_MY_STRUCTURES, {
                            filter: (structure) => {
                                return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                                    structure.energy < structure.energyCapacity;
                            }
                    });
                    if (energyTargets.length == 0) {
                        desiredRole = 'builder';
                    }
                }

                // If we're a builder but there's nothing to build, then fixit fixit fixit
                if (desiredRole === 'builder') {
                    var constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
                    if (constructionSites.length == 0) {
                        desiredRole = 'fixit';
                    }
                }

                // If we're a fixit but there's nothing to fix, let's help the upgraders
                if (desiredRole === 'fixit') {
                    var bustedStructures = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return (structure.hits < structure.hitsMax);
                        }
                    });
                    if (bustedStructures.length == 0) {
                        desiredRole = 'upgrader';
                    }
                }
                
                creep.memory.role = desiredRole;
                
                if (creep.memory.role !== 'idle') {
                    roleHandler = this.getRoleHandler(creep.memory);
                    roleHandler.init(creep);
                } else {
                    creep.suicide();    
                }
            }
            
            if (creep.memory.role !== 'idle') {
                if (!roleHandler.run(creep)) {
                    roleHandler.cleanup(creep.memory, room.memory);
                    creep.memory.role = 'idle';
                }
            }
        }
    },

    getRoleHandler: function(creepMemory) {
        switch (creepMemory.role) {
            case 'harvester' : return roleHarvester;
            case 'upgrader' : return roleUpgrader;
            case 'builder' : return roleBuilder;
            case 'fixit' : return roleFixit;
            case 'miner' : return roleMiner;
            case 'collector' : return roleCollector;
        }
        return null;
    }
};

module.exports = managerRole;
