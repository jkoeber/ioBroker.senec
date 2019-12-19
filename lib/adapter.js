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

adapter.getObject('STAT_DAY_E_HOUSE', function (err, obj) {

});
adapter.setState('STAT_DAY_E_HOUSE', 123123, true); // indicate new status of own state 