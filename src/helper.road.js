var helperRoad = {
    createRingRoad: function(room, centre) {
        room.createConstructionSite(centre.x, centre.y - 1, STRUCTURE_ROAD);
        room.createConstructionSite(centre.x + 1, centre.y - 1, STRUCTURE_ROAD);
        room.createConstructionSite(centre.x + 1, centre.y, STRUCTURE_ROAD);
        room.createConstructionSite(centre.x + 1, centre.y + 1, STRUCTURE_ROAD);
        room.createConstructionSite(centre.x, centre.y + 1, STRUCTURE_ROAD);
        room.createConstructionSite(centre.x - 1, centre.y + 1, STRUCTURE_ROAD);
        room.createConstructionSite(centre.x - 1, centre.y, STRUCTURE_ROAD);
        room.createConstructionSite(centre.x - 1, centre.y - 1, STRUCTURE_ROAD);
    }
};

module.exports = helperRoad;
