var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleFixit = require('role.fixit');

var managerRole = {
    run: function() {
        // Always place this memory cleaning code at the very top of your main loop!
        for(var name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log('[RoleManager] Clearing non-existing creep memory:', name);
            }
        }

        var mainSpawn;
        for (var name in Game.spawns) {
            mainSpawn = Game.spawns[name];
        }

        if (!mainSpawn.memory.creepNum) {
            mainSpawn.memory.creepNum = 0;
        }

        var creepPriority = ['harvester', 'harvester', 'harvester', 'upgrader', 'builder', 'builder', 'fixit', 'fixit', 'upgrader', 'harvester', 'harvester', 'builder', 'fixit', 'upgrader', 'upgrader'];

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
            var roleHandler = undefined;
            switch (creep.memory.role) {
                case 'harvester' : roleHandler = roleHarvester; break;
                case 'upgrader' : roleHandler = roleUpgrader; break;
                case 'builder' : roleHandler = roleBuilder; break;
                case 'fixit' : roleHandler = roleFixit; break;
            }
            
            if (!roleHandler) {
                var creepRoles = [];
                creepRoles['harvester'] = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester').length;
                creepRoles['upgrader'] = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader').length;
                creepRoles['builder'] = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder').length;
                creepRoles['fixit'] = _.filter(Game.creeps, (creep) => creep.memory.role == 'fixit').length;
                
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
                    switch (creep.memory.role) {
                        case 'harvester' : roleHandler = roleHarvester; break;
                        case 'upgrader' : roleHandler = roleUpgrader; break;
                        case 'builder' : roleHandler = roleBuilder; break;
                        case 'fixit' : roleHandler = roleFixit; break;
                    }
                    roleHandler.init(creep);
                } else {
                    creep.suicide();    
                }
            }
            
            if (creep.memory.role !== 'idle') {
                if (!roleHandler.run(creep)) {
                    roleHandler.cleanup(creep);
                    creep.memory.role = 'idle';
                }
            }
        }
    }
};

module.exports = managerRole;
