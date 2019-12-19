# SENEC HOME
# Read Attributes from SENEC Website catching up the lala.cgi file
# This cgi- service delivers all necessarry informations for your senec power storage at home

# request url
http://{{your-power-battery-ip}}/lala.cgi

# request attributes
Accept: application/json
Content-Type: application/x-www-form-urlencoded; charset=UTF-8

# request body
{"STATISTIC":{"STAT_DAY_E_HOUSE":"","STAT_DAY_E_PV":"","STAT_DAY_BAT_CHARGE":"","STAT_DAY_BAT_DISCHARGE":"","STAT_DAY_E_GRID_IMPORT":"","STAT_DAY_E_GRID_EXPORT":"","STAT_YEAR_E_PU1_ARR":""},"ENERGY":{"STAT_STATE":"","STAT_STATE_DECODE":"","GUI_BAT_DATA_POWER":"","GUI_INVERTER_POWER":"","GUI_HOUSE_POW":"","GUI_GRID_POW":"","STAT_MAINT_REQUIRED":"","GUI_BAT_DATA_FUEL_CHARGE":"","GUI_CHARGING_INFO":"","GUI_BOOSTING_INFO":""},"WIZARD":{"CONFIG_LOADED":"","SETUP_NUMBER_WALLBOXES":"","SETUP_WALLBOX_SERIAL0":"","SETUP_WALLBOX_SERIAL1":"","SETUP_WALLBOX_SERIAL2":"","SETUP_WALLBOX_SERIAL3":""}}