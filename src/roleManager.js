var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');

var roleManager = {
    run: function() {
        // Always place this memory cleaning code at the very top of your main loop!
        for(var name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log('Clearing non-existing creep memory:', name);
            }
        }

        if (!Game.spawns.Jargonia.memory.creepNum) {
            Game.spawns.Jargonia.memory.creepNum = 0;
        }

        var creepPriority = ['harvester', 'harvester', 'harvester', 'upgrader', 'builder', 'builder', 'upgrader', 'builder', 'upgrader', 'harvester', 'harvester', 'builder', 'upgrader', 'upgrader'];

        if (_.size(Game.creeps) < creepPriority.length) {
            var creepName = Game.spawns.Jargonia.createCreep([WORK,CARRY,MOVE], 'Creep-' + (++Game.spawns.Jargonia.memory.creepNum), { role: 'idle', num: Game.spawns.Jargonia.memory.creepNum });
            if (creepName !== ERR_BUSY && creepName !== ERR_NOT_ENOUGH_ENERGY) {
                console.log('Spawning new creep: ' + creepName);
            }
        }

        for(var name in Game.creeps) {
            var creep = Game.creeps[name];
            var roleHandler = undefined;
            switch (creep.memory.role) {
                case 'harvester' : roleHandler = roleHarvester; break;
                case 'upgrader' : roleHandler = roleUpgrader; break;
                case 'builder' : roleHandler = roleBuilder; break;
            }
            
            if (!roleHandler) {
                var creepRoles = [];
                creepRoles['harvester'] = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester').length;
                creepRoles['upgrader'] = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader').length;
                creepRoles['builder'] = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder').length;
                
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
                    var energyTargets = creep.room.find(FIND_STRUCTURES, {
                            filter: (structure) => {
                                return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                                    structure.energy < structure.energyCapacity;
                            }
                    });
                    if (energyTargets.length == 0) {
                        desiredRole = 'builder';
                    }
                }
                
                creep.memory.role = desiredRole;
                creep.name = desiredRole + '-' + creep.memory.num;
                
                if (creep.memory.role !== 'idle') {
                    switch (creep.memory.role) {
                        case 'harvester' : roleHandler = roleHarvester; break;
                        case 'upgrader' : roleHandler = roleUpgrader; break;
                        case 'builder' : roleHandler = roleBuilder; break;
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
                    creep.name = 'Creep-' + creep.memory.num;
                }
            }
        }
    }
};

module.exports = roleManager;
