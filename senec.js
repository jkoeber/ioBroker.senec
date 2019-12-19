var utils = require('@iobroker/adapter-core'); // Get common adapter utils - mandatory
var adapterName = require('./package.json').name.split('.').pop();
var senec   = require('./lib/senec');
var adapter = utils.adapter('senec'); // - mandatory

function main() {
	homematicPath = adapter.config.daemon === 'virtual-devices' ? '/groups/' : '/';
	
	adapter.config.reconnectInterval = parseInt(adapter.config.reconnectInterval, 10) || 30;
    if (adapter.config.reconnectInterval < 10) {
        adapter.log.error('Reconnect interval is less than 10 seconds. Set reconnect interval to 10 seconds.');
        adapter.config.reconnectInterval = 10;
    }
	
	adapter.config.checkInitInterval = parseInt(adapter.config.checkInitInterval, 10);
    if (adapter.config.checkInitInterval < 10) {
        adapter.log.error('Check init interval is less than 10 seconds. Set init interval to 10 seconds.');
        adapter.config.checkInitInterval = 10;
    }

    adapter.setState('info.connection', false, true);
}

adapter.on('ready', function () {
	adapter.subscribeStates('*');
    main();
	
	
	 // subscribe on all variables of this adapter instance with pattern "adapterName.X.*"
	adapter.setState('STAT_DAY_E_HOUSE', senec.getVarValue('fl_4179F679'), true);
	adapter.setState('STAT_DAY_E_PV', 2, true);
	adapter.setState('STAT_DAY_BAT_CHARGE', 3, true);
	adapter.setState('STAT_DAY_BAT_DISCHARGE', 4, true);
	adapter.setState('STAT_DAY_E_GRID_IMPORT', 5, true);
	adapter.setState('STAT_DAY_E_GRID_EXPORT', 6, true);
	adapter.setState('GUI_BAT_DATA_POWER', 7, true);
	adapter.setState('GUI_INVERTER_POWER', 8, true);
	adapter.setState('GUI_HOUSE_POW', 9, true);
	adapter.setState('STAT_MAINT_REQUIRED', 10, true);
	adapter.setState('GUI_BAT_DATA_FUEL_CHARGE', 11, true);
	adapter.setState('GUI_CHARGING_INFO', 12, true);
	adapter.setState('GUI_BOOSTING_INFO', 13, true);
	adapter.setState('GUI_GRID_POW', 14, true);
});

adapter.on('objectChange', function (id, obj) {
    adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
});

adapter.on('stateChange', function (id, state) {
    adapter.log.info('stateChange ' + id + ' ' + JSON.stringify(state));

    // you can use the ack flag to detect if state is command(false) or status(true)
    if (!state.ack) {
        adapter.log.info('ack is not set!');
    }
});


 