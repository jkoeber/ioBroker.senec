const utils = require('@iobroker/adapter-core'); // Get common adapter utils - mandatory
const adapterName = require('./package.json').name.split('.').pop();
const senec   = require('./lib/senec');
const meta   = require('./lib/meta');
const adapter = utils.adapter('senec'); // - mandatory
const request = require('request')

let rpc;
let rpcClient;

let rpcServer;

const metaValues = {};
let metaRoles = {};
const dpTypes = {};

function main() {
	
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
	
    // list devices
    adapter.objects.getObjectView('senec', 'listDevices', 
	     {startkey: 'senec.' + adapter.instance + '.', endkey: 'senec.' + adapter.instance + '.\u9999'}, 
	     function (err, doc) {
		if (doc && doc.rows) {	
			for (var i = 0; i < doc.rows.length; i++) {
				 var id  = doc.rows[i].id;
				 var obj = doc.rows[i].value;
				 console.log('Found ' + id + ': ' + JSON.stringify(obj));
			}
	                if (!doc.rows.length) console.log('No objects found.');
		} else {
			console.log('No objects found: ' + err);
		}
	});
    
	/* Load VALUE paramsetDescriptions (needed to create state objects)
    adapter.getObjectView('system', 'paramsetDescription', {
        startkey: 'senec.meta.VALUES',
        endkey: 'senec.meta.VALUES.\u9999'
    }, (err, doc) => {
        if (err) adapter.log.error(`getObjectView senec: ${err}`);
        if (doc && doc.rows) {
            for (const row of doc.rows) {
                const channel = row.id.slice(19);
                metaValues[channel] = row.value.native;
            }
        }
    });
	*/
    
	adapter.getObjectView('system', 'state', {
        startkey: adapter.namespace,
        endkey: adapter.namespace + '\u9999'
    }, (err, res) => {
        if (!err && res.rows) {
            for (const row of res.rows) {
                if (row.id === adapter.namespace + '.updated') continue;
                if (!row.value.native) {
                    adapter.log.warn(`State ${row.id} does not have native.`);
                    dpTypes[row.id] = {UNIT: '', TYPE: ''};
                } else {
                    dpTypes[row.id] = {
                        UNIT: row.value.native.UNIT,
                        TYPE: row.value.native.TYPE,
                        MIN: row.value.native.MIN,
                        MAX: row.value.native.MAX
                    };

                    if (typeof dpTypes[row.id].MIN === 'number') {
                        dpTypes[row.id].MIN = parseFloat(dpTypes[row.id].MIN);
                        dpTypes[row.id].MAX = parseFloat(dpTypes[row.id].MAX);
                        if (dpTypes[row.id].UNIT === '100%') {
                            dpTypes[row.id].UNIT = '%';
                        }
                        if (dpTypes[row.id].MAX === 99) {
                            dpTypes[row.id].MAX = 100;
                        } else if (dpTypes[row.id].MAX === 1.005 || dpTypes[row.id].MAX === 1.01) {
                            dpTypes[row.id].MAX = 1;
                        } // endElseIf
                    } // endIf
                }
            }
        }
    });
}

function readFromServer() {	
	request.post('http://192.168.178.31/lala.cgi', {
		json: {"STATISTIC":{"STAT_DAY_E_HOUSE":"","STAT_DAY_E_PV":"","STAT_DAY_BAT_CHARGE":"","STAT_DAY_BAT_DISCHARGE":"","STAT_DAY_E_GRID_IMPORT":"","STAT_DAY_E_GRID_EXPORT":"","STAT_YEAR_E_PU1_ARR":""},"ENERGY":{"STAT_STATE":"","STAT_STATE_DECODE":"","GUI_BAT_DATA_POWER":"","GUI_INVERTER_POWER":"","GUI_HOUSE_POW":"","GUI_GRID_POW":"","STAT_MAINT_REQUIRED":"","GUI_BAT_DATA_FUEL_CHARGE":"","GUI_CHARGING_INFO":"","GUI_BOOSTING_INFO":""},"WIZARD":{"CONFIG_LOADED":"","SETUP_NUMBER_WALLBOXES":"","SETUP_WALLBOX_SERIAL0":"","SETUP_WALLBOX_SERIAL1":"","SETUP_WALLBOX_SERIAL2":"","SETUP_WALLBOX_SERIAL3":""}}
	}, (error, res, body) => {
		if(error) {
			adapter.log.info('error on request: '+ error);
			return
		}
		
		return body
	})
}

adapter.on('ready', function () {
	adapter.subscribeStates('*');
    main();
	
	// read all elements from service
	const response = readFromServer();
	adapter.log.info('response on request: '+ response);
	
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

const queueValueParamsets = [];
 