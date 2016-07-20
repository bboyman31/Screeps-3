var helperWall = {
    addWallEnds: function(wallArray, wallSide) {
        var startX = wallArray[0].x;
        var startY = wallArray[0].y;
        var endX = wallArray[wallArray.length - 1].x;
        var endY = wallArray[wallArray.length - 1].y;

    	switch (wallSide) {
    		case BOTTOM :
                wallArray[wallArray.length] = { x: startX - 1, y: startY };
                wallArray[wallArray.length] = { x: startX - 2, y: startY };
                wallArray[wallArray.length] = { x: startX - 2, y: startY + 1 };
                wallArray[wallArray.length] = { x: endX + 1, y: endY };
                wallArray[wallArray.length] = { x: endX + 2, y: endY };
                wallArray[wallArray.length] = { x: endX + 2, y: endY + 1 };
    			break;
			case TOP :
                wallArray[wallArray.length] = { x: startX - 1, y: startY };
                wallArray[wallArray.length] = { x: startX - 2, y: startY };
                wallArray[wallArray.length] = { x: startX - 2, y: startY - 1 };
                wallArray[wallArray.length] = { x: endX + 1, y: endY };
                wallArray[wallArray.length] = { x: endX + 2, y: endY };
                wallArray[wallArray.length] = { x: endX + 2, y: endY - 1 };
                break;
            case LEFT :
                wallArray[wallArray.length] = { x: startX, y: startY - 1 };
                wallArray[wallArray.length] = { x: startX, y: startY - 2 };
                wallArray[wallArray.length] = { x: startX - 1, y: startY - 2 };
                wallArray[wallArray.length] = { x: endX, y: endY + 1 };
                wallArray[wallArray.length] = { x: endX, y: endY + 2 };
                wallArray[wallArray.length] = { x: endX - 1, y: endY + 2 };
                break;
            case RIGHT :
                wallArray[wallArray.length] = { x: startX, y: startY - 1 };
                wallArray[wallArray.length] = { x: startX, y: startY - 2 };
                wallArray[wallArray.length] = { x: startX + 1, y: startY - 2 };
                wallArray[wallArray.length] = { x: endX, y: endY + 1 };
                wallArray[wallArray.length] = { x: endX, y: endY + 2 };
                wallArray[wallArray.length] = { x: endX + 1, y: endY + 2 };
                break;
    	}
    }
};

module.exports = helperWall;
