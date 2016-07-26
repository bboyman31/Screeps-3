var pioneerManager = {
    run: function(room, pioneers) {

    	let flag = undefined;
		for (var name in Game.flags) {
			flag = Game.flags[name];
			break;
		}

		if (flag) {
    		if (pioneers.length) {
		        pioneers.forEach(function (pioneer) {
		        	// Placeholder
		        });
    		} else {
    			if (room.memory.phase >= 8) {

    			}
    		}
    	}

    }
};

module.exports = pioneerManager;
