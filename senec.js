const utils = require('@iobroker/adapter-core'); // Get common adapter utils - mandatory
const adapterName = require('./package.json').name.split('.').pop();
const senec   = require('./lib/senec');
const meta   = require('./lib/meta');
const adapter = utils.adapter('senec'); // - mandatory
const request = require('request')

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
	
	// Load VALUE paramsetDescriptions (needed to create state objects)
    adapter.getObjectView('senec', 'paramsetDescription', {
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
        // Load common.role assignments
        adapter.getForeignObject('senec.meta.roles', (err, res) => {
            if (err) adapter.log.error(`senec.meta.roles: ${err}`);
            if (res) metaRoles = res.native;

            // Start Adapter
            if (adapter.config) initRpcServer();
        });
    });
	
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

let rpc;
let rpcClient;

let rpcServer;

const metaValues = {};
let metaRoles = {};
const dpTypes = {};

let lastEvent = 0;
let eventInterval;
let connInterval;
let connTimeout;
let daemonURL = '';
let daemonProto = '';
let homematicPath;

function initRpcServer() {
    adapter.config.homematicPort = parseInt(adapter.config.homematicPort, 10);
    adapter.config.port = parseInt(adapter.config.port, 10);
    adapter.config.useHttps = adapter.config.useHttps || false;

    // adapterPort was introduced in v1.0.1. If not set yet then try 2000
    const adapterPort = parseInt(adapter.config.port || adapter.config.homematicPort, 10) || 2000;
    const callbackAddress = adapter.config.callbackAddress || adapter.config.adapterAddress;
    adapter.getPort(adapterPort, port => {
        daemonURL = daemonProto + callbackAddress + ':' + port;

        rpcServer = rpc.createServer({
            host: adapter.config.adapterAddress,
            port: port
        });

        adapter.log.info(adapter.config.type + 'rpc server is trying to listen on ' + adapter.config.adapterAddress + ':' + port);
        adapter.log.info(adapter.config.type + 'rpc client is trying to connect to ' + adapter.config.homematicAddress + ':' + adapter.config.homematicPort + homematicPath + ' with ' + JSON.stringify([daemonURL, adapter.namespace]));

        connect(true);

        rpcServer.on('NotFound', (method, params) => adapter.log.warn(adapter.config.type + 'rpc <- undefined method ' + method + ' ' + JSON.stringify(params).slice(0, 80)));

        rpcServer.on('system.multicall', (method, params, callback) => {
            updateConnection();
            const response = [];
            for (const param of params[0]) {
                if (methods[param.methodName]) {
                    adapter.log.debug(`${adapter.config.type} multicall <${param.methodName}>: ${param.params}`);
                    response.push(methods[param.methodName](null, param.params));
                } else {
                    response.push('');
                }
            }
            callback(null, response);
        });

        rpcServer.on('system.listMethods', (err, params, callback) => {
            if (err) {
                adapter.log.warn(' Error on system.listMethods: ' + err);
            }
            adapter.log.info(adapter.config.type + 'rpc <- system.listMethods ' + JSON.stringify(params));
            callback(null, ['event', 'deleteDevices', 'listDevices', 'newDevices', 'system.listMethods', 'system.multicall', 'setReadyConfig']);
        });

        rpcServer.on('event', (err, params, callback) => {
            if (err) {
                adapter.log.warn(' Error on system.listMethods: ' + err);
            }
            updateConnection();
            try {
                callback(null, methods.event(err, params));
            } catch (err) {
                adapter.log.error('Cannot response on event:' + err);
            }
        });

        rpcServer.on('newDevices', (err, params, callback) => {
            if (err) {
                adapter.log.warn(' Error on system.listMethods: ' + err);
            }

            const newDevices = params[1];

            adapter.log.info(adapter.config.type + 'rpc <- newDevices ' + newDevices.length);

            // for a HmIP-adapter we have to filter out the devices that
            // are already present if forceReinit is not set
            if (adapter.config.forceReInit === false && adapter.config.daemon === 'HMIP') {
                adapter.getObjectView('senec', 'listDevices', {
                    startkey: 'senec.' + adapter.instance + '.',
                    endkey: 'senec.' + adapter.instance + '.\u9999'
                }, (err, doc) => {
                    if (doc && doc.rows) {
                        for (const row of doc.rows) {
                            if (row.id === adapter.namespace + '.updated') continue;

                            // lets get the device description
                            const val = row.value;

                            if (typeof val.ADDRESS === 'undefined') continue;

                            // lets find the current device in the newDevices array
                            // and if it doesn't exist we can delete it
                            let index = -1;
                            for (let j = 0; j < newDevices.length; j++) {
                                if (newDevices[j].ADDRESS === val.ADDRESS && newDevices[j].VERSION === val.VERSION) {
                                    index = j;
                                    break;
                                }
                            }

                            // if index is -1 than the newDevices doesn't have the
                            // device with address val.ADDRESS anymore, thus we can delete it
                            if (index === -1) {
                                if (val.ADDRESS && !adapter.config.dontDelete) {
                                    if (val.ADDRESS.indexOf(':') !== -1) {
                                        const address = val.ADDRESS.replace(':', '.').replace(FORBIDDEN_CHARS, '_');
                                        const parts = address.split('.');
                                        adapter.deleteChannel(parts[parts.length - 2], parts[parts.length - 1]);
                                        adapter.log.info('obsolete channel ' + address + ' ' + JSON.stringify(address) + ' deleted');
                                    } else {
                                        adapter.deleteDevice(val.ADDRESS);
                                        adapter.log.info('obsolete device ' + val.ADDRESS + ' deleted');
                                    }
                                }
                            } else {
                                // we can remove the item at index because it is already registered
                                // to ioBroker
                                newDevices.splice(index, 1);
                            }
                        }
                    }

                    adapter.log.info('new HmIP devices/channels after filter: ' + newDevices.length);
                    createDevices(newDevices, callback);
                });
            } else {
                createDevices(newDevices, callback);
            }
        });

        rpcServer.on('listDevices', (err, params, callback) => {
            if (err) {
                adapter.log.warn('Error on system.listMethods: ' + err);
            }
            adapter.log.info(adapter.config.type + 'rpc <- listDevices ' + JSON.stringify(params));
            adapter.getObjectView('senec', 'listDevices', {
                startkey: 'senec.' + adapter.instance + '.',
                endkey: 'senec.' + adapter.instance + '.\u9999'
            }, (err, doc) => {
                const response = [];

                // we only fill the response if this isn't a force reinit and
                // if the adapter instance is not bothering with HmIP (which seems to work slightly different in terms of XMLRPC)
                if (!adapter.config.forceReInit && adapter.config.daemon !== 'HMIP' && doc && doc.rows) {
                    for (let i = 0; i < doc.rows.length; i++) {
                        if (doc.rows[i].id === adapter.namespace + '.updated') continue;
                        const val = doc.rows[i].value;

                        if (val.ADDRESS) response.push({ADDRESS: val.ADDRESS, VERSION: val.VERSION});
                    }
                }
                adapter.log.info(adapter.config.type + 'rpc -> ' + response.length + ' devices');

                try {
                    for (let r = response.length - 1; r >= 0; r--) {
                        if (!response[r].ADDRESS) {
                            adapter.log.warn(adapter.config.type + 'rpc -> found empty entry at position ' + r + ' !');
                            response.splice(r, 1);
                        }
                    }

                    callback(null, response);
                } catch (err) {
                    adapter.log.error('Cannot response on listDevices:' + err);
                    require('fs').writeFileSync(__dirname + '/problem.json', JSON.stringify(response));
                }
            });
        });

        rpcServer.on('deleteDevices', (err, params, callback) => {
            if (err) {
                adapter.log.warn(' Error on system.listMethods: ' + err);
            }
            adapter.log.info(adapter.config.type + 'rpc <- deleteDevices ' + params[1].length);
            for (let i = 0; i < params[1].length; i++) {
                if (params[1][i].indexOf(':') !== -1) {
                    params[1][i] = params[1][i].replace(':', '.').replace(FORBIDDEN_CHARS, '_');
                    adapter.log.info('channel ' + params[1][i] + ' ' + JSON.stringify(params[1][i]) + ' deleted');
                    const parts = params[1][i].split('.');
                    adapter.deleteChannel(parts[parts.length - 2], parts[parts.length - 1]);
                } else {
                    adapter.log.info('device ' + params[1][i] + ' deleted');
                    adapter.deleteDevice(params[1][i]);
                }
            }
            try {
                callback(null, '');
            } catch (err) {
                adapter.log.error('Cannot response on deleteDevices:' + err);
            }
        });

        rpcServer.on('setReadyConfig', (err, params, callback) => {
            if (err) {
                adapter.log.warn(' Error on setReadyConfig: ' + err);
            }
            adapter.log.info(adapter.config.type + 'rpc <- setReadyConfig ' + JSON.stringify(params));
            try {
                callback(null, '');
            } catch (err) {
                adapter.log.error('Cannot response on setReadyConfig:' + err);
            }
        });

    });
} // endInitRPCServer

const methods = {
    event: function (err, params) {
        adapter.log.debug(adapter.config.type + 'rpc <- event ' + JSON.stringify(params));
        let val;
        // CUxD ignores all prefixes!!
        if (params[0] === 'CUxD' || params[0].indexOf(adapter.name) === -1) {
            params[0] = adapter.namespace;
        }
        const channel = params[1].replace(':', '.').replace(FORBIDDEN_CHARS, '_');
        const name = params[0] + '.' + channel + '.' + params[2];

        if (dpTypes[name]) {
            if (dpTypes[name].MIN !== undefined && dpTypes[name].UNIT === '%') {
                val = ((parseFloat(params[3]) - dpTypes[name].MIN) / (dpTypes[name].MAX - dpTypes[name].MIN)) * 100;
                val = Math.round(val * 100) / 100;
            } else if (dpTypes[name].UNIT === '100%' || (dpTypes[name].UNIT === '%' && dpTypes[name].MAX === 1)) {
                val = params[3] * 100;
            } else {
                val = params[3];
            }
        } else {
            val = params[3];
        }
        adapter.log.debug(name + ' ==> UNIT: "' + (dpTypes[name] ? dpTypes[name].UNIT : 'none') + '" (min: ' + (dpTypes[name] ? dpTypes[name].MIN : 'none') + ', max: ' + (dpTypes[name] ? dpTypes[name].MAX : 'none') + ') From "' + params[3] + '" => "' + val + '"');

        adapter.setState(channel + '.' + params[2], {val: val, ack: true});
        return '';
    }

};

const queueValueParamsets = [];
 