var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleFixit = require('role.fixit');
var roleMiner = require('role.miner');
var roleCollector = require('role.collector');

var managerRole = {
    run: function(room, workers) {
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

        let creepPriority = ['harvester', 'harvester', 'harvester', 'upgrader', 'builder', 'builder', 'builder', 'builder', 'upgrader', 'harvester', 'harvester', 'builder', 'builder', 'upgrader', 'upgrader'];
        if (room.memory.phase > 4)
            creepPriority = ['miner', 'collector', 'collector', 'upgrader', 'builder', 'builder', 'builder', 'builder', 'upgrader', 'harvester', 'harvester', 'builder', 'builder', 'upgrader', 'upgrader'];
        if (room.memory.phase > 5)
            creepPriority = ['miner', 'collector', 'miner', 'collector', 'miner', 'collector', 'miner', 'collector', 'upgrader', 'upgrader', 'builder', 'builder', 'upgrader', 'builder', 'upgrader'];

        if (room.memory.creepCount < creepPriority.length) {
            let creepBody = [WORK, CARRY, MOVE];
            if (room.memory.phase > 2)
                creepBody = [WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
            if (room.memory.phase > 3)
                creepBody = [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];

            if (mainSpawn.canCreateCreep(creepBody) === OK) {
                var creepName = mainSpawn.createCreep(creepBody, 'Creep-' + (++mainSpawn.memory.creepNum), { type: 'worker', role: 'idle', num: mainSpawn.memory.creepNum });
                if (creepName !== ERR_BUSY && creepName !== ERR_NOT_ENOUGH_ENERGY) {
                    console.log('[RoleManager] Spawning new creep: ' + creepName);
                }
            }
        }

        for (let workerIndex = 0; workerIndex < workers.length; workerIndex++) {
            let creep = workers[workerIndex];
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
                            return (structure.hits < structure.hitsMax && structure.hits < 300000);
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
