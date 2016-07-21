var roomManager = require('manager.room');
var roleManager = require('manager.role');

module.exports.loop = function () {
    roomManager.run();
    roleManager.run();
};
