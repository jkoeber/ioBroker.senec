function _getVarValue(data)
    {
        var tmp = data.split('_');
        var value = tmp[1];
        switch (tmp[0])
        {
            case 'fl':
                tmp[1] = "0x" + tmp[1];
                value = _hex2float(tmp[1]);
                value = Math.round(value * 100) / 100;
                break;
            case 'u8':
                //alert("u8");
                value = _hex2dec(value);
                if (value < 10)
                {
                    value = "0" + value;
                }
                break;
            case 'u1':
                //alert("u1");
                value = _hex2dec(value);
                if (value < 10)
                {
                    value = "0" + value;
                }
                break;
            case 'u3':
                value = _hex2dec(value);
                break;
            case 'u6':
                value = _hex2dec(value);
                break;
            case 'i1':
                value = parseInt(value, 16);

                if(!isNaN(value)) {
                    if (value < 10) {
                        value = "0" + value;
                    }
                    if ((value & 0x8000) > 0) {
                        value = value - 0x10000;
                    }
                }
                else  {
                    value = NaN;
                }
                break;
            case 'i3':
                value = parseInt(value, 16);
                if(!isNaN(value))
                {
                    if (value < 10) {
                        value = "0" + value;
                    }

                    if ((Math.abs(value & 0x80000000)) > 0) {
                        value = value - 0x100000000;
                    }
                }
                else  {
                    value = NaN;
                }

                break;
            case 'i8':
                value = parseInt(value, 16);
                if (value < 10) {
                    value = "0" + value;
                }
                if ((value & 0x80) > 0) {
                    value = value - 0x100;
                }
                break;
            case 'ch':
                //alert("ch");
                break;
            case 'st':
                //alert("st");
                break;
            case 'er':
                console.log("error: " + data);
                break;
            default:
                console.log("error: unknown variable type: " + data);
                break;
        }

        return value;
    }
	function _hex2float(num) {
        var sign = (num & 0x80000000) ? -1 : 1;
        var exponent = ((num >> 23) & 0xff) - 127;
        var mantissa = ((num & 0x7fffff) + 0x800000).toString(2); // binary
        var float = 0;
        // Convert to float
        for (var i=0; i<mantissa.length; i+=1)
        {
            float += parseInt(mantissa[i])? Math.pow(2,exponent):0;
            exponent--;
        }
        return sign * float;
    }

    function _hex2dec(num)
    {
        return parseInt(num, 16);
    }

    this.float2hex = function(input)
    {
        var floatString = ("" + input).replace (/NaN/gi, "6.805646932770577e+38").replace (/inf/gi, "3.402823669209385e+38");
        if (isNaN (floatString)) return null;

        var abs_float = Math.abs (parseFloat (floatString));
        var exponent = Math.floor (Math.log (abs_float) / Math.log (2));
        var mantissa = abs_float / Math.pow (2, exponent);

        if (exponent <= -127) {
            mantissa /= Math.pow (2, -127 - exponent + 1);
            exponent += (-127 - exponent);
        }

        var s = (floatString == abs_float) ? 0 : 1;
        var e = exponent;
        var f = (exponent == -127) ? mantissa * 8388608: 0x7FFFFF & (mantissa * 8388608);

        var sint32 = ((s << 31) | ((e + 127) << 23) | f);
        var hexString = ((sint32 < 0) ? 0xFFFFFFFF + sint32 + 1 : sint32).toString (16).toUpperCase ();

        return "00000000".substring (hexString.length) + hexString;
    };

    this.dec2hex = function(i)
    {
        var result = "0000";
        i = i * 1;
        result = i.toString(16);

        return result.toUpperCase();
    };
    this.dec2hexZp = function(i) //konvertiert dec to hex mit "zero padding"
    {
        var result = "0000";
        i = i * 1;
        result = i.toString(16);
        result = result.toUpperCase();
        if (result.length < 8)
        {
            var c = 0;
            for (c = 0; c < 9 - result.length; c++)
            {
                result = "0" + result;
            }
        }
        return result;
    };

    this.num2do = function(num) {
        var d = num % 256;
        for (var i = 3; i > 0; i--) {
            num = Math.floor(num / 256);
            d = d + '.' + num % 256;
        }
        return d;
    };

    this.dot2hex = function(ip) {
        // alert(ip);
        ip.toString();
        var d = ip.split('.');
        return   (((((((+d[3]) * 256) + (+d[2])) * 256) + (+d[1])) * 256) + (+d[0])).toString(16).toUpperCase();
    };
    this.dot2dec = function(ip) {
        // alert(ip);
        ip.toString();
        var d = ip.split('.');

        if (d.length != 4) {
            return 0;
        }

        return   (((((((+d[3]) * 256) + (+d[2])) * 256) + (+d[1])) * 256) + (+d[0]));//.toString(16).toUpperCase();
    };


    this.castVarValue = function(varType, data) {
        //TODO: implement exception handling for var-casting !!!
        // application should abort execution if a important config-value is malformed

        var value = data * 1;
        var hexVal = "";
        // console.log("cast to var type " + varType);
        // console.log(data); //DEBUG

        switch (varType)
        {
            case 'fl':
                //alert("float");
                value = 'fl_' + float2hex(value).toUpperCase();
                break;
            case 'u8':
                //alert("u8");
                if (value < 16) {
                    value = "0" + value.toString(16);
                }
                else
                {
                    value = value.toString(16);
                }
                value = "u8_" + value.toString(16).toUpperCase();
                break;
            case 'u1':

                if (value >= 0 && value <= 15) {
                    value = "000" + value.toString(16).toUpperCase();
                }

                else if (value >= 16 && value <= 255) {
                    value = "00" + value.toString(16).toUpperCase();
                }
                else if (value >= 256 && value <= 4095) {
                    value = "0" + value.toString(16).toUpperCase();
                }
                else if (value >= 4096 && value <= 65535) {
                    value = value.toString(16).toUpperCase();
                }
                value = "u1_" + value.toUpperCase();

                break;
            case 'u3':
                if (value >= 0 && value <= 15) {
                    value = "0000000" + value.toString(16).toUpperCase();
                }

                else if (value >= 16 && value <= 255) {
                    value = "000000" + value.toString(16).toUpperCase();
                }
                else if (value >= 256 && value <= 4095) {
                    value = "00000" + value.toString(16).toUpperCase();
                }
                else if (value >= 4096 && value <= 65535) {
                    value = "0000" + value.toString(16).toUpperCase();
                }

                else if (value >= 65536 && value <= 1048575) {
                    value = "000" + value.toString(16).toUpperCase();
                }
                else if (value >= 1048576 && value <= 16777215) {
                    value = "00" + value.toString(16).toUpperCase();
                }
                else if (value >= 16777216 && value <= 268435455) {
                    value = "0" + value.toString(16).toUpperCase();
                }
                else if (value >= 268435455 && value <= 4294967295) {
                    value = value.toString(16).toUpperCase();
                }
                value = "u3_" + value;
                console.log(value);

                break;
            case 'i1':
                //check if value is really an int-number
                value = parseInt(value);
                if(!isNaN(value)) {
                    hexVal = ((value < 0)? (0xFFFF + value + 1) : value).toString(16).toUpperCase();

                    //fill with leading zeros
                    var hexLen = 4 - hexVal.length;
                    hexVal = (new Array(hexLen + 1).join("0")) + hexVal;

                    value = "i1_" + hexVal;
                }
                else value = NaN;

                break;
            case 'i3':
                //check if value is really an int-number
                value = parseInt(value);
                if(!isNaN(value)) {
                    hexVal = ((value < 0)? (0xFFFFFFFF + value + 1) : value).toString(16).toUpperCase();

                    //fill with leading zeros
                    var hexLength = 8 - hexVal.length;
                    hexVal = (new Array(hexLength + 1).join("0")) + hexVal;

                    value = "i3_" + hexVal;
                }
                else value = NaN;
                break;
            case 'ch':
                //alert("ch");
                break;
            case 'st':
                value = 'st_'.concat(data);
                break;
            case 'er':
                console.log("er" + value);
                break;
            default:
                console.log("ERR: unknown var type..." + varType);
        }
        return value;
    }
	
export.getVarValue=_getVarValue;