"use strict";

const utils = require('@iobroker/adapter-core'); // Get common adapter utils - mandatory
const senec   = require('./lib/senec');
const request = require('request');
var lang = 'de';

const adapter = utils.adapter('senec'); // - mandatory

var senecIp;

adapter.on('ready', function () {
	adapter.getForeignObject('system.config', function (err, data) {
        if (data && data.common) {
            lang  = data.common.language;
        }

        adapter.log.debug('initializing objects');
        main();
    });
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

function readSettings() {
    senecIp = adapter.config.senecIp;
    if (senecIp === undefined || senecIp === "") {
        adapter.log.error('Enter senecIp!'); // Translate!
        return
    }  
    
    readFromServer(senecIp);
}

function readFromServer(senecIp) {
	adapter.log.info('send request: http://'+senecIp+'/lala.cgi');
	request.post('http://'+senecIp+'/lala.cgi', {
		json: {"STATISTIC":{"STAT_DAY_E_HOUSE":"","STAT_DAY_E_PV":"","STAT_DAY_BAT_CHARGE":"","STAT_DAY_BAT_DISCHARGE":"","STAT_DAY_E_GRID_IMPORT":"","STAT_DAY_E_GRID_EXPORT":"","STAT_YEAR_E_PU1_ARR":""},"ENERGY":{"STAT_STATE":"","STAT_STATE_DECODE":"","GUI_BAT_DATA_POWER":"","GUI_INVERTER_POWER":"","GUI_HOUSE_POW":"","GUI_GRID_POW":"","STAT_MAINT_REQUIRED":"","GUI_BAT_DATA_FUEL_CHARGE":"","GUI_CHARGING_INFO":"","GUI_BOOSTING_INFO":""},"WIZARD":{"CONFIG_LOADED":"","SETUP_NUMBER_WALLBOXES":"","SETUP_WALLBOX_SERIAL0":"","SETUP_WALLBOX_SERIAL1":"","SETUP_WALLBOX_SERIAL2":"","SETUP_WALLBOX_SERIAL3":""}}
	}, (error, res, body) => {
		if(error) {
			adapter.log.info('error on request: '+ error);
			return
		}
		
		// output response to log
		adapter.log.info('got feedback from senec service: ' + body);
		
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
	})
}
 
function main() {
    readSettings();
    adapter.log.info('objects written');
    
    // subscribe to all state changes
    adapter.subscribeStates('*');
}