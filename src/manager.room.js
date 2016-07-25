var roleManager = require('manager.role');
var helperWall = require('helper.wall');
var helperRoad = require('helper.road');

var managerRoom = {
    run: function() {
        for (var name in Game.rooms) {
            var room = Game.rooms[name];
            
            if (room.controller.my) {

                // Find the primary spawn in the room and set it as home.
                if (!room.memory.home) {
                    for (var name in Game.spawns) {
                        let spawn = Game.spawns[name];
                        if (spawn.room.name === room.name) {
                            room.memory.home = spawn;
                            break;
                        }
                    }
                }

                // If the room does have a spawn then let's get crackin'
                if (room.memory.home) {
                    let creeps = room.find(FIND_MY_CREEPS);
                    room.memory.creepCount = creeps.length;
                    room.memory.phase = this.getRoomPhase(room);

                    this.checkSources(room);
                    this.checkExtensions(room);
                    this.checkContainers(room);
                    this.checkRoads(room);
                    this.checkWalls(room);
                    this.renewCreeps(room);

                    roleManager.run(room, creeps);
                }

            }
        }
    },

    checkSources: function(room) {
        if (!room.memory.sources) {
            this.initSources(room);
        }
    },

    initSources: function(room) {
        var sources = room.find(FIND_SOURCES);
        room.memory.sources = new Array(sources.length);
        for (var i = 0; i < sources.length; i++) {
            room.memory.sources[i] = {
                id: sources[i].id,
                workerCount: 0,
                minerCount: 0,
                containerId: null,
                containerBuilding: false,
                containerPos: null
            };
        }
    },

    /** @param {Room} room **/
    checkExtensions: function(room) {
        if (!room.memory.initExtensionsTick || Game.time >= room.memory.initExtensionsTick) {
            this.initExtensions(room);
            room.memory.initExtensionsTick = Game.time + 50;
        }
    },

    
    /** @param {Room} room **/
    initExtensions: function(room) {
        if (room.memory.phase >= 2) {
            if (room.memory.extensionCount < 1) room.createConstructionSite(room.memory.home.pos.x - 2, room.memory.home.pos.y, STRUCTURE_EXTENSION);
            if (room.memory.extensionCount < 2) room.createConstructionSite(room.memory.home.pos.x + 2, room.memory.home.pos.y, STRUCTURE_EXTENSION);
            if (room.memory.extensionCount < 3) room.createConstructionSite(room.memory.home.pos.x, room.memory.home.pos.y - 2, STRUCTURE_EXTENSION);
            if (room.memory.extensionCount < 4) room.createConstructionSite(room.memory.home.pos.x, room.memory.home.pos.y + 2, STRUCTURE_EXTENSION);
            if (room.memory.extensionCount < 5) room.createConstructionSite(room.memory.home.pos.x - 1, room.memory.home.pos.y - 2, STRUCTURE_EXTENSION);
        }
        if (room.memory.phase >= 3) {
            if (room.memory.extensionCount < 6) room.createConstructionSite(room.memory.home.pos.x + 1, room.memory.home.pos.y - 2, STRUCTURE_EXTENSION);
            if (room.memory.extensionCount < 7) room.createConstructionSite(room.memory.home.pos.x - 1, room.memory.home.pos.y + 2, STRUCTURE_EXTENSION);
            if (room.memory.extensionCount < 8) room.createConstructionSite(room.memory.home.pos.x + 1, room.memory.home.pos.y + 2, STRUCTURE_EXTENSION);        
            if (room.memory.extensionCount < 9) room.createConstructionSite(room.memory.home.pos.x + 2, room.memory.home.pos.y - 1, STRUCTURE_EXTENSION);
            if (room.memory.extensionCount < 10) room.createConstructionSite(room.memory.home.pos.x + 2, room.memory.home.pos.y + 1, STRUCTURE_EXTENSION); 
        }
    },

    /** @param {Room} room **/
    checkContainers: function(room) {
        if (room.memory.phase >= 4) {
            this.initContainers(room);
        } else {
            room.memory.containerCount = 0;
        }
    },

    /** @param {Room} room **/
    initContainers: function(room) {
        let containerCount = 0;
        room.memory.sources.forEach(function (source) {
            if (!source.containerId && !source.containerBuilding) {
                let path = Game.getObjectById(source.id).pos.findPathTo(room.memory.home.pos.x, room.memory.home.pos.y);
                if (path.length >= 3) {
                    if (room.createConstructionSite(path[1].x, path[1].y, STRUCTURE_CONTAINER) === OK) {
                        source.containerBuilding = true;
                        source.containerPos = room.getPositionAt(path[1].x, path[1].y);
                    }
                }
            } else if (!source.containerId && source.containerBuilding) {
                let structures = room.lookForAt(LOOK_STRUCTURES, source.containerPos.x, source.containerPos.y);
                for (let i = 0; i < structures.length; i++) {
                    if (structures[i].structureType === STRUCTURE_CONTAINER) {
                        source.containerId = structures[i].id;
                        source.containerBuilding = false;
                        break;
                    }
                }
            } else if (source.containerId) {
                containerCount++;
            }
        });
        room.memory.containerCount = containerCount;
    },

    /** @param {Room} room **/
    checkRoads: function(room) {
        if (room.memory.phase >= 4) {
            if (!room.memory.initRoadsTick || Game.time >= room.memory.initRoadsTick) {
                this.initRoads(room);
                room.memory.initRoadsTick = Game.time + 50;
            }
        }
    },
       
    /** @param {Room} room **/
    initRoads: function(room) {
        let goals = [];

        let sourceGoals = _.map(room.find(FIND_SOURCES), function(source) {  
            return { pos: source.pos, range: 1 };
        });
        
        let rampartGoals = _.map(room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_RAMPART } }), function(source) {  
            return { pos: source.pos, range: 0 };
        });

        goals = goals.concat(sourceGoals);
        goals = goals.concat(rampartGoals);
        goals = goals.concat([{ pos: room.controller.pos, range: 1 }]);

        goals.forEach(function(goal) {
            let pathResult = PathFinder.search(room.memory.home.pos, goal, {
                // We don't want to priortise terrain type because we're building
                // roads the most direct route.
                plainCost: 1,
                swampCost: 1,
                
                roomCallback: function(roomName) {
                    let costs = new PathFinder.CostMatrix;
                
                    room.find(FIND_STRUCTURES).forEach(function(structure) {
                        if (structure.structureType !== STRUCTURE_CONTAINER && (structure.structureType !== STRUCTURE_RAMPART || !structure.my) && structure.structureType !== STRUCTURE_ROAD) {
                            // Can't walk through non-walkable buildings
                            costs.set(structure.pos.x, structure.pos.y, 0xff);
                        }
                    });
    
                    return costs;
                }
            });
            
            let path = pathResult.path;
            for (let i = 0; i < path.length; i++) {
                room.createConstructionSite(path[i].x, path[i].y, STRUCTURE_ROAD);
            }
        });

        // Create a ring road around the spawn.
        helperRoad.createRingRoad(room, room.memory.home.pos);
    },

    /** @param {Room} room **/
    checkWalls: function(room) {
        if (room.memory.phase >= 6) {
            if (!room.memory.initWallsTick || Game.time >= room.memory.initWallsTick) {
                this.initialiseWalls(room);
                room.memory.initWallsTick = Game.time + 100;
            }
        }
    },

    initialiseWalls: function(room) {
        var bottomExitPoses = room.find(FIND_EXIT_BOTTOM);
        var leftExitPoses = room.find(FIND_EXIT_LEFT);
        bottomExitPoses = _.sortBy(bottomExitPoses, function(exit) { return exit.x; });
        leftExitPoses = _.sortBy(leftExitPoses, function(exit) { return exit.y; });

        var exitAreaIndex = 0;
        var exitAreas = [];
        var lastX = undefined;
        var lastY = undefined;

        lastX = undefined;
        lastY = undefined;
        for (let i = 0; i < bottomExitPoses.length; i++) {
            if (lastX !== undefined) {
                // Check if part of the same exit
                let dx = lastX - bottomExitPoses[i].x;
                dx = dx * dx;
                if (dx > 1) {
                    // Not part of the same exit so create the ends and start next
                    helperWall.addWallEnds(exitAreas[exitAreaIndex], BOTTOM);
                    exitAreaIndex++;
                }
            }
            if (exitAreas[exitAreaIndex] !== undefined) {
                exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length] = { x: bottomExitPoses[i].x, y: bottomExitPoses[i].y - 2 };
            } else {
                exitAreas[exitAreaIndex] = [{ x: bottomExitPoses[i].x, y: bottomExitPoses[i].y - 2 }];
            }
            lastX = bottomExitPoses[i].x;
        }
        helperWall.addWallEnds(exitAreas[exitAreaIndex], BOTTOM);
        exitAreaIndex++;

        lastX = undefined;
        lastY = undefined;
        for (let i = 0; i < leftExitPoses.length; i++) {
            if (lastY !== undefined) {
                // Check if part of the same exit
                let dy = lastY - leftExitPoses[i].y;
                dy = dy * dy;
                if (dy > 1) {
                    // Not part of the same exit so create the ends and start next
                    helperWall.addWallEnds(exitAreas[exitAreaIndex], LEFT);
                    exitAreaIndex++;
                }
            }
            if (exitAreas[exitAreaIndex] !== undefined) {
                exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length] = { x: leftExitPoses[i].x + 2, y: leftExitPoses[i].y };
            } else {
                exitAreas[exitAreaIndex] = [{ x: leftExitPoses[i].x + 2, y: leftExitPoses[i].y }];
            }
            lastY = leftExitPoses[i].y;
        }
        helperWall.addWallEnds(exitAreas[exitAreaIndex], LEFT);
        exitAreaIndex++;

        room.memory.exitAreas = exitAreas;

        exitAreas.forEach(function (exitArea) {
            var rx = Math.round((exitArea[exitArea.length - 1].x + exitArea[0].x) / 2);
            var ry = Math.round((exitArea[exitArea.length - 1].y + exitArea[0].y) / 2);
            for (let i = 0; i < exitArea.length; i++) {
                if (exitArea[i].x === rx && exitArea[i].y === ry) {
                    room.createConstructionSite(exitArea[i].x, exitArea[i].y, STRUCTURE_RAMPART);
                } else {
                    room.createConstructionSite(exitArea[i].x, exitArea[i].y, STRUCTURE_WALL);
                }
            }
        });
    },

    /** @param {Room} room **/
    checkTowers: function(room) {
        if (room.memory.phase >= 7) {
            this.initialiseTowers(room);
        }
    },

    /** @param {Room} room **/
    initialiseTowers: function(room) {     
        let goals = _.map(room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_RAMPART } }), function(structure) {  
            return { pos: source.pos, range: 0 };
        });

        if (goals.length) {
            let pathResult = PathFinder.search(room.memory.home.pos, goals[0], {
                plainCost: 1,
                swampCost: 1,               
                roomCallback: function(roomName) {
                    return new PathFinder.CostMatrix;
                }
            });
            
            let path = pathResult.path;
            let index = Math.floor(path.length / 2);

            for (let i = 0; i < path.length; i++) {
                room.createConstructionSite(path[index].x, path[index].y, STRUCTURE_TOWER);
            }
        }
    },

    renewCreeps: function(room) {
        var spawn = Game.getObjectById(room.memory.home.id);
        var creeps = spawn.pos.findInRange(FIND_MY_CREEPS, 1);
        creeps.forEach(function (creep) {
            if (creep.ticksToLive < 1000) {
                spawn.renewCreep(creep);
            }
        });
    },

    getRoomPhase: function(room) {
        // First built up creeps and get them harvesting.
        if (room.controller.level <= 1 || room.memory.creepCount < 3) return 1;

        // Second step is to get the first set of extensions down so we can build bigger creeps.
        room.memory.extensionCount = _.size(room.find(FIND_STRUCTURES, { filter: (structure) => { return structure.structureType == STRUCTURE_EXTENSION; } }));
        if (room.controller.level <= 2 || room.memory.extensionCount < 5) return 2;

        // Third step is to get the next set of extensions down so we can build even bigger creeps.
        if (room.controller.level <= 3 || room.memory.extensionCount < 10) return 3;

        // At phase 4 and above we build containers and roads.

        if (room.memory.containerCount <= 0) return 4; // Separating the phases here allow us to change the creep roles depending number of containers.
        if (room.memory.containerCount <= 1) return 5; // Separating the phases here allow us to change the creep roles depending number of containers.

        // Phase 6 is we build walls and ramparts
        let rampartCount = _.size(room.find(FIND_STRUCTURES, { filter: (structure) => { return structure.structureType == STRUCTURE_RAMPART; } }));
        let constructionSiteCount = _.size(room.find(FIND_MY_CONSTRUCTION_SITES));
        if (rampartCount == 0 || constructionSiteCount > 0) return 6;

        // Phase 7 is build a tower
        let towerCount = _.size(room.find(FIND_STRUCTURES, { filter: (structure) => { return structure.structureType == STRUCTURE_TOWER; } }));
        let constructionSiteCount = _.size(room.find(FIND_MY_CONSTRUCTION_SITES));
        if (towerCount == 0 || constructionSiteCount > 0) return 7;

        return 8; // And on the 8th day, we rested.
    }
};

module.exports = managerRoom;
