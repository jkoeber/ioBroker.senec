var utils = require(__dirname + '/lib/utils'); // Get common adapter utils - mandatory
var adapterName = require('./package.json').name.split('.').pop();
var adapter = utils.adapter('senec'); // - mandatory

adapter.on('ready', function () {
    main();
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

adapter.log.debug("debug message"); // log message with debug level
adapter.log.info("info message");   // log message with info level (enabled by default for all adapters)
adapter.log.warn("warning");        // log message with info warn
adapter.log.error("error");         // log message with info error

adapter.subscribeStates('*'); // subscribe on all variables of this adapter instance with pattern "adapterName.X.*"

adapter.setState('STAT_DAY_E_HOUSE', 1, true);
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


 