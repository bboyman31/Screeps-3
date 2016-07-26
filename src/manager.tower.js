var towerManager = {
    run: function(room, towers) {
        let hostileCreeps = room.find(FIND_HOSTILE_CREEPS);

        towers.forEach(function (tower) {
            if (hostileCreeps.length) {
                tower.attack(hostileCreeps[0]);
            }
        });
    }
};

module.exports = towerManager;
