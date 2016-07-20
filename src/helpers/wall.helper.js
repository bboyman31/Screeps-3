var wallHelper = {
    /** @param {Creep} creep **/
    addWallEnds: function(wallArray, wallSide) {
        var startX = exitAreas[exitAreaIndex][0].x;
        var startY = exitAreas[exitAreaIndex][0].y;
        var endX = exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length - 1].x;
        var endY = exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length - 1].y;

    	switch (wallSide) {
    		case BOTTOM :
                exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length] = { x: startX - 1, y: startY };
                exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length] = { x: startX - 2, y: startY };
                exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length] = { x: startX - 2, y: startY + 1 };
                exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length] = { x: endX + 1, y: startY };
                exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length] = { x: endX + 2, y: startY };
                exitAreas[exitAreaIndex][exitAreas[exitAreaIndex].length] = { x: endX + 2, y: startY + 1 };
    			break;
    	}
    }
};

module.exports = wallHelper;