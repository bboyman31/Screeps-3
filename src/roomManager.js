var roomManager = {
    run: function() {
        for (var name in Game.rooms) {
            var room = Game.rooms[name];
            
            for (var name in Game.spawns) {
                room.memory.home = Game.spawns[name];
            }
            
            if (!room.memory.initExtensions) {
                this.checkExtensions(room);
                room.memory.initExtensions = true;
            }
            
            if (!room.memory.initRoads) {
                this.checkSourceRoads(room);
                room.memory.initRoads = true;
            }

            if (!room.memory.initWalls) {
                this.initialiseWalls(room);
            }
        }
    },
    
    /** @param {Room} room **/
    checkExtensions: function(room) {
        var extensions = _.size(room.find(FIND_STRUCTURES, { filter: (structure) => { return structure.structureType == STRUCTURE_EXTENSION; } }));
        if (extensions < 1) room.createConstructionSite(room.memory.home.pos.x - 2, room.memory.home.pos.y, STRUCTURE_EXTENSION);
        if (extensions < 2) room.createConstructionSite(room.memory.home.pos.x + 2, room.memory.home.pos.y, STRUCTURE_EXTENSION);
        if (extensions < 3) room.createConstructionSite(room.memory.home.pos.x, room.memory.home.pos.y - 2, STRUCTURE_EXTENSION);
        if (extensions < 4) room.createConstructionSite(room.memory.home.pos.x, room.memory.home.pos.y + 2, STRUCTURE_EXTENSION);
        if (extensions < 5) room.createConstructionSite(room.memory.home.pos.x - 1, room.memory.home.pos.y - 2, STRUCTURE_EXTENSION);
    },
    
    /** @param {Room} room **/
    checkHostileSites: function(room) {
        var hostileSites = room.find(FIND_HOSTILE_CONSTRUCTION_SITES);
        for (var i = 0; i < hostileSites.length; i++) {
            hostileSites[i].remove();
        }
    },
    
    /** @param {Room} room **/
    checkSourceRoads: function(room) {
        let goals = _.map(room.find(FIND_SOURCES), function(source) {  
            // We can't actually walk on sources-- set `range` to 1 so we path next to it.
            return { pos: source.pos, range: 1 };
        });
        goals = goals.concat([{ pos: room.controller.pos, range: 1 }]);

        goals.forEach(function(goal) {
            let pathResult = PathFinder.search(room.memory.home.pos, goal, {
                // We want to priortise terrain type because we're building
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
                //room.createConstructionSite(path[i].x + 1, path[i].y, STRUCTURE_ROAD);
                //room.createConstructionSite(path[i].x - 1, path[i].y, STRUCTURE_ROAD);
                //room.createConstructionSite(path[i].x, path[i].y + 1, STRUCTURE_ROAD);
                //room.createConstructionSite(path[i].x, path[i].y - 1, STRUCTURE_ROAD);
            }
        });
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
                    let startX = exitAreas[exitAreaIndex][0].x;
                    let startY = exitAreas[exitAreaIndex][0].y;
                    let endX = exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length - 1].x;
                    let endY = exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length - 1].y;
                    exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length] = { x: startX - 1, y: startY };
                    exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length] = { x: startX - 1, y: startY + 1 };
                    exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length] = { x: endX + 1, y: startY };
                    exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length] = { x: endX + 1, y: startY + 1 };
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
        let startX = exitAreas[exitAreaIndex][0].x;
        let startY = exitAreas[exitAreaIndex][0].y;
        let endX = exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length - 1].x;
        let endY = exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length - 1].y;
        exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length] = { x: startX - 1, y: startY };
        exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length] = { x: startX - 1, y: startY + 1 };
        exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length] = { x: endX + 1, y: startY };
        exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length] = { x: endX + 1, y: startY + 1 };
        exitAreaIndex++;

        lastX = undefined;
        lastY = undefined;
        for (let i = 0; i < leftExitPoses.length; i++) {
            if (lastX !== undefined) {
                // Check if part of the same exit
                let dy = lastY - leftExitPoses[i].y;
                dy = dy * dy;
                if (dy > 1) {
                    // Not part of the same exit
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

        room.memory.exitAreas = exitAreas;

        exitAreas.forEach(function (exitArea) {
            var rx = Math.floor((exitArea[exitArea.length - 1].x + exitArea[0].x) / 2);
            var ry = Math.floor((exitArea[exitArea.length - 1].y + exitArea[0].y) / 2);
            for (let i = 0; i < exitArea.length; i++) {
                if (exitArea[i].x === rx && exitArea[i].y === ry) {
                    room.createConstructionSite(exitArea[i].x, exitArea[i].y, STRUCTURE_RAMPART);
                } else {
                    room.createConstructionSite(exitArea[i].x, exitArea[i].y, STRUCTURE_WALL);
                }
            }
        });

        //room.memory.initWalls = true;
    }
};

module.exports = roomManager;
