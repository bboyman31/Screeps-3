var militaryManager = {
    run: function() {
        let flag = undefined;
        for (var name in Game.flags) {
            let flagTemp = Game.flags[name];
            if (flagTemp.color === COLOR_RED) {
                flag = flagTemp;
                break;
            }
        }

        if (flag) {
            let captain = undefined;
            let soldiers = [];

            for (let name in Game.creeps) {
                if (Game.creeps[name].memory.type === 'soldier') {
                    soldiers[soldiers.length] = Game.creeps[name];
                }
            }

            for (let name in Game.rooms) {
                var room = Game.rooms[name];
                if (soldiers.length < 5 && room.controller.my && room.memory.phase >= 8) {
                    let home = Game.getObjectById(room.memory.homeId);
                    let soldierBody = [TOUGH, TOUGH, TOUGH, TOUGH, ATTACK, ATTACK, MOVE, MOVE, MOVE, MOVE];
                    if (home.canCreateCreep(soldierBody) === OK) {
                        let creepName = home.createCreep(soldierBody, 'Creep-' + (++home.memory.creepNum), { type: 'soldier', role: 'private', num: home.memory.creepNum });
                    }
                }
            }

            if (soldiers.length) {
                for (let i = 0; i < soldiers.length; i++) {
                    if (soldiers[i].memory.role === 'captain') {
                        captain = soldiers[i];
                        break;
                    }
                }
                if (!captain) {
                    captain = soldiers[0];
                    captain.memory.role = 'captain';
                }
            }

            if (soldiers < 5) {
                soldiers.forEach(function (soldier) {
                    if (soldier.id !== captain.id) {
                        soldier.moveTo(captain);
                    }
                });
            } else {
                let hostiles = captain.pos.findInRange(FIND_HOSTILE_CREEPS, 5);
                if (hostiles.length) {
                    soldiers.forEach(function (soldier) {
                        if (soldier.attack(hostiles[0]) === ERR_NOT_IN_RANGE) {
                            soldier.moveTo(hostiles[0]);
                        }
                    });
                } else {
                    soldiers.forEach(function (soldier) {
                        if (soldier.id === captain.id) {
                            let wait = false;
                            for (let i = 0; i < soldiers.length; i++) {
                                if (!captain.pos.inRangeTo(soldiers[i], 5)) {
                                    //wait = true;
                                    break;
                                }
                            }
                            if (!wait) captain.moveTo(flag);
                        } else {
                            soldier.moveTo(captain);
                        }
                    });
                }
            }
        }
    }
};

module.exports = militaryManager;
