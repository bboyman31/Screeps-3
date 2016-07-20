var roomManager = require('roomManager');
var roleManager = require('roleManager');

module.exports.loop = function () {
    roomManager.run();
    roleManager.run();
};
