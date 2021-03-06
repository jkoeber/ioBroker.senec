"use strict";

const utils = require(__dirname + '/lib/utils'); // Get common adapter utils
const senec   = require('./lib/senec');
const request = require('request');
var lang = 'de';

const adapter = utils.adapter('senec'); // - mandatory

var senecIp;

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

function readSettings() {
    senecIp = adapter.config.senecIp;
    if (senecIp === undefined || senecIp === "") {
        adapter.log.error('Enter senecIp!'); // Translate!
        return
    }  
    
    readFromServer(senecIp);
}
function createInfoObjects() {
    adapter.delObject('STAT_DAY_E_HOUSE');
    adapter.delObject('STAT_DAY_E_PV');
    adapter.delObject('STAT_DAY_BAT_CHARGE');
    adapter.delObject('STAT_DAY_BAT_DISCHARGE');
    adapter.delObject('STAT_DAY_E_GRID_IMPORT');
    adapter.delObject('STAT_DAY_E_GRID_EXPORT');
    adapter.delObject('GUI_BAT_DATA_POWER');
    adapter.delObject('GUI_INVERTER_POWER');
    adapter.delObject('GUI_HOUSE_POW');
    adapter.delObject('GUI_GRID_POW');
    adapter.delObject('STAT_MAINT_REQUIRED');
    adapter.delObject('GUI_BAT_DATA_FUEL_CHARGE');
    adapter.delObject('GUI_CHARGING_INFO');
    adapter.delObject('GUI_BOOSTING_INFO');

    adapter.setObjectNotExists('info', {
        type: 'channel',
        common: {
            name: "Information"
        },
        native: {}
    });
    adapter.setObjectNotExists('STAT_DAY_E_HOUSE', {
        type: 'state',
        common: {
			"name": "Hausverbrauch Tag",
			"type": "number",
			"read":  true,
			"write": true
        },
        native: {}
    });
    adapter.setObjectNotExists('STAT_DAY_E_PV', {
        type: 'state',
        common: {
			"name": "Photovoltaik Erzeugung Tag",
			"type": "number",
			"read":  true,
			"write": true
        },
        native: {}
    });
    adapter.setObjectNotExists('STAT_DAY_BAT_CHARGE', {
        type: 'state',
        common: {
			"name": "Tageswert Batterie Ladung",
			"type": "number",
			"read":  true,
			"write": true
        },
        native: {}
    });
    adapter.setObjectNotExists('STAT_DAY_BAT_DISCHARGE', {
        type: 'state',
        common: {
			"name": "Tageswert Batterie Entladung",
			"type": "number",
			"read":  true,
			"write": true
        },
        native: {}
    }),
    adapter.setObjectNotExists('STAT_DAY_E_GRID_IMPORT', {
        type: 'state',
        common: {
			"name": "Tageswert Netzentnahme",
			"type": "number",
			"read":  true,
			"write": true
        },
        native: {}
    }),
    adapter.setObjectNotExists('STAT_DAY_E_GRID_EXPORT', {
        type: 'state',
        common: {
			"name": "Tageswert Netzeinspeisung",
			"type": "number",
			"read":  true,
			"write": true
        },
        native: {}
    }),
    adapter.setObjectNotExists('GUI_BAT_DATA_POWER', {
        type: 'state',
        common: {
			"name": "Batterie Data Leistung",
			"type": "number",
			"read":  true,
			"write": true
        },
        native: {}
    }),
    adapter.setObjectNotExists('GUI_INVERTER_POWER', {
        type: 'state',
        common: {
			"name": "Inverter Leistung",
			"type": "number",
			"read":  true,
			"write": true
        },
        native: {}
    }),
    adapter.setObjectNotExists('GUI_HOUSE_POW', {
        type: 'state',
        common: {
			"name": "Haus Leistung",
			"type": "number",
			"read":  true,
			"write": true
        },
        native: {}
    }),
    adapter.setObjectNotExists('GUI_GRID_POW', {
        type: 'state',
        common: {
			"name": "Neztleistung",
			"type": "number",
			"read":  true,
			"write": true
        },
        native: {}
    }),
    adapter.setObjectNotExists('STAT_MAINT_REQUIRED', {
        type: 'state',
        common: {
			"name": "Wartung notwendig",
			"type": "number",
			"read":  true,
			"write": true
        },
        native: {}
    }),
    adapter.setObjectNotExists('GUI_BAT_DATA_FUEL_CHARGE', {
        type: 'state',
        common: {
			"name": "Battery Data Fuel Charge",
			"type": "number",
			"read":  true,
			"write": true
        },
        native: {}
    }),
    adapter.setObjectNotExists('GUI_CHARGING_INFO', {
        type: 'state',
        common: {
			"name": "Ladungsinformation",
			"type": "number",
			"read":  true,
			"write": true
        },
        native: {}
    }),
    adapter.setObjectNotExists('GUI_BOOSTING_INFO', {
        type: 'state',
        common: {
			"name": "Boosting Information",
			"type": "number",
			"read":  true,
			"write": true
        },
        native: {}
    });
}

function readFromServer(senecIp) {
	adapter.log.info('send request: http://'+senecIp+'/lala.cgi');
	request.post({
		url: 'http://'+senecIp+'/lala.cgi',
		form: '{"STATISTIC":{"STAT_DAY_E_HOUSE":"","STAT_DAY_E_PV":"","STAT_DAY_BAT_CHARGE":"","STAT_DAY_BAT_DISCHARGE":"","STAT_DAY_E_GRID_IMPORT":"","STAT_DAY_E_GRID_EXPORT":"","STAT_YEAR_E_PU1_ARR":""}, '+
			  ' "ENERGY":{"STAT_STATE":"","STAT_STATE_DECODE":"","GUI_BAT_DATA_POWER":"","GUI_INVERTER_POWER":"","GUI_HOUSE_POW":"","GUI_GRID_POW":"","STAT_MAINT_REQUIRED":"","GUI_BAT_DATA_FUEL_CHARGE":"","GUI_CHARGING_INFO":"","GUI_BOOSTING_INFO":""}, '+
			  ' "WIZARD":{"CONFIG_LOADED":"","SETUP_NUMBER_WALLBOXES":"","SETUP_WALLBOX_SERIAL0":"","SETUP_WALLBOX_SERIAL1":"","SETUP_WALLBOX_SERIAL2":"","SETUP_WALLBOX_SERIAL3":""}}'
	}, (error, res, body) => {
		if(error) {
			adapter.log.info('error on request: '+ error);
			return
		}
		
		// resource
		var jsonObject = JSON.parse(body);
		// adapter.log.info('statistic response: ' + jsonObject.STATISTIC.STAT_DAY_E_HOUSE);
		
		// output response to log
		adapter.log.info('got feedback from senec service: ' + body);
		
		// subscribe on all variables of this adapter instance with pattern "adapterName.X.*"
		adapter.setState('STAT_DAY_E_HOUSE', senec.getVarValue(jsonObject.STATISTIC.STAT_DAY_E_HOUSE), true);
		adapter.setState('STAT_DAY_E_PV', senec.getVarValue(jsonObject.STATISTIC.STAT_DAY_E_PV), true);
		adapter.setState('STAT_DAY_BAT_CHARGE', senec.getVarValue(jsonObject.STATISTIC.STAT_DAY_BAT_CHARGE), true);
		adapter.setState('STAT_DAY_BAT_DISCHARGE', senec.getVarValue(jsonObject.STATISTIC.STAT_DAY_BAT_DISCHARGE), true);
		adapter.setState('STAT_DAY_E_GRID_IMPORT', senec.getVarValue(jsonObject.STATISTIC.STAT_DAY_E_GRID_IMPORT), true);
		adapter.setState('STAT_DAY_E_GRID_EXPORT', senec.getVarValue(jsonObject.STATISTIC.STAT_DAY_E_GRID_EXPORT), true);
		adapter.setState('GUI_BAT_DATA_POWER', senec.getVarValue(jsonObject.ENERGY.GUI_BAT_DATA_POWER), true);
		adapter.setState('GUI_INVERTER_POWER', senec.getVarValue(jsonObject.ENERGY.GUI_INVERTER_POWER), true);
		adapter.setState('GUI_HOUSE_POW', senec.getVarValue(jsonObject.ENERGY.GUI_HOUSE_POW), true);
		adapter.setState('STAT_MAINT_REQUIRED', senec.getVarValue(jsonObject.ENERGY.STAT_MAINT_REQUIRED), true);
		adapter.setState('GUI_BAT_DATA_FUEL_CHARGE', senec.getVarValue(jsonObject.ENERGY.GUI_BAT_DATA_FUEL_CHARGE), true);
		adapter.setState('GUI_CHARGING_INFO', senec.getVarValue(jsonObject.ENERGY.GUI_CHARGING_INFO), true);
		adapter.setState('GUI_BOOSTING_INFO', senec.getVarValue(jsonObject.ENERGY.GUI_BOOSTING_INFO), true);
		adapter.setState('GUI_GRID_POW', senec.getVarValue(jsonObject.ENERGY.GUI_GRID_POW), true);
	})
}
function checkStatus() {
	adapter.setState("info.lastsync", {val: new Date().toISOString(), ack: true});
	
	// read settings
	readSettings();
}
 
function main() {
	adapter.getForeignObject('system.adapter.' + adapter.namespace, function (err, obj) {
	     if (!err && obj && (obj.common.mode !== 'daemon')) {
	          obj.common.mode = 'daemon';
	          if (obj.common.schedule) delete(obj.common.schedule);
	          adapter.setForeignObject(obj._id, obj);
	     }
	});
	
	// create objects
	createInfoObjects();
	
	// subscribe to all state changes
	adapter.subscribeStates('*');
	
	// check status and read values
	checkStatus();
	
	// status
	adapter.setState('info.connection', {val: true, ack: true});
	
	// set interval
	setInterval(checkStatus, 10 * 1000);
}