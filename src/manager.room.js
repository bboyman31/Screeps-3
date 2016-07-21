var helperWall = require('helper.wall');
var helperRoad = require('helper.road');

var managerRoom = {
    run: function() {
        for (var name in Game.rooms) {
            var room = Game.rooms[name];
            
            if (!room.memory.home) {
                for (var name in Game.spawns) {
                    room.memory.home = Game.spawns[name];
                    break;
                }
            }

            this.checkSources(room);
            
            if (!room.memory.initExtensionsTick || Game.time >= room.memory.initExtensionsTick) {
                this.initExtensions(room);
                room.memory.initExtensionsTick = Game.time + 150;
            }
            
            if (!room.memory.initRoadsTick || Game.time >= room.memory.initRoadsTick) {
                this.initRoads(room);
                room.memory.initRoadsTick = Game.time + 50;
            }

            if (!room.memory.initWallsTick || Game.time >= room.memory.initWallsTick) {
                this.initialiseWalls(room);
                room.memory.initWallsTick = Game.time + 100;
            }
        }
    },

    checkSources: function(room) {
        if (!room.memory.sources) {
            this.initSources(room);
        }
        room.memory.sources.forEach(function (source) {
            if (!source.containerId && !source.containerBuilding) {
                let path = Game.getObjectById(source.id).pos.findPathTo(room.memory.home);
            }
        });
    }

    initSources: function(room) {
        var sources = room.find(FIND_SOURCES);
        room.memory.sources = new Array(sources.length);
        for (var i = 0; i < sources.length; i++) {
            room.memory.sources[i] = { id: sources[i].id, workerCount: 0, containerId: null, containerBuilding: false };
        }
    },
    
    /** @param {Room} room **/
    initExtensions: function(room) {
        var extensions = _.size(room.find(FIND_STRUCTURES, { filter: (structure) => { return structure.structureType == STRUCTURE_EXTENSION; } }));
        if (extensions < 1) room.createConstructionSite(room.memory.home.pos.x - 2, room.memory.home.pos.y, STRUCTURE_EXTENSION);
        if (extensions < 2) room.createConstructionSite(room.memory.home.pos.x + 2, room.memory.home.pos.y, STRUCTURE_EXTENSION);
        if (extensions < 3) room.createConstructionSite(room.memory.home.pos.x, room.memory.home.pos.y - 2, STRUCTURE_EXTENSION);
        if (extensions < 4) room.createConstructionSite(room.memory.home.pos.x, room.memory.home.pos.y + 2, STRUCTURE_EXTENSION);
        if (extensions < 5) room.createConstructionSite(room.memory.home.pos.x - 1, room.memory.home.pos.y - 2, STRUCTURE_EXTENSION);
        if (extensions < 6) room.createConstructionSite(room.memory.home.pos.x + 1, room.memory.home.pos.y - 2, STRUCTURE_EXTENSION);
        if (extensions < 7) room.createConstructionSite(room.memory.home.pos.x - 1, room.memory.home.pos.y + 2, STRUCTURE_EXTENSION);
        if (extensions < 8) room.createConstructionSite(room.memory.home.pos.x + 1, room.memory.home.pos.y + 2, STRUCTURE_EXTENSION);        
        if (extensions < 9) room.createConstructionSite(room.memory.home.pos.x + 2, room.memory.home.pos.y - 1, STRUCTURE_EXTENSION);
        if (extensions < 10) room.createConstructionSite(room.memory.home.pos.x + 2, room.memory.home.pos.y + 1, STRUCTURE_EXTENSION); 
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

    initialiseWalls: function(room) {
        var bottomExitPoses = room.find(FIND_EXIT_BOTTOM);
        var leftExitPoses = room.find(FIND_EXIT_LEFT);
        _.sortBy(bottomExitPoses, function(exit) { return exit.x; });
        _.sortBy(leftExitPoses, function(exit) { return exit.y; });

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
    }
};

module.exports = managerRoom;
