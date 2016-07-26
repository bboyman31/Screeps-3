var towerManager = {
    run: function(room, towers) {
        let hostileCreeps = room.find(FIND_HOSTILE_CREEPS);

        if (!hostileCreeps || hostileCreeps.length === 0) {
            var damagedCreeps = room.find(FIND_MY_CREEPS, {
                filter: (creep) => {
                    return (creep.hits < creep.hitsMax);
                }
            });
        }

        if (!damagedCreeps || damagedCreeps.length === 0) {
            var repairStructures = room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.hits < structure.hitsMax && structure.hits < 300000);
                }
            });
            repairStructures = _.sortBy(repairStructures, function(structure) { return structure.hits / Math.min(structure.hitsMax, 250000); });
        }

        towers.forEach(function (tower) {
            if (hostileCreeps.length) {
                tower.attack(hostileCreeps[0]);
            } else if (tower.energy > tower.energyCapacity / 2) {
                if (damagedCreeps.length) {
                    tower.heal(damagedCreeps[0]);
                } else if (repairStructures.length) {
                    tower.repair(repairStructures[0]);
                }
            }
        });
    }
};

module.exports = towerManager;
