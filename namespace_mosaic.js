//NEM標準時
var NEM_EPOCH = Date.UTC(2015, 2, 29, 0, 6, 25, 0);
var _hexEncodeArray = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

function hex2ua_reversed(hexx) {
	var hex = hexx.toString();//force conversion
	var ua = new Uint8Array(hex.length / 2);
	for (var i = 0; i < hex.length; i += 2) {
		ua[ua.length - 1 - (i / 2)] = parseInt(hex.substr(i, 2), 16);
	}
	return ua;
}

function ua2hex(ua) {
	var s = '';
	for (var i = 0; i < ua.length; i++) {
		var code = ua[i];
		s += _hexEncodeArray[code >>> 4];
		s += _hexEncodeArray[code & 0x0F];
	}
	return s;
}
	
function hex2ua (hexx) {
	var hex = hexx.toString();//force conversion
	var ua = new Uint8Array(hex.length / 2);
	for (var i = 0; i < hex.length; i += 2) {
		ua[i / 2] = parseInt(hex.substr(i, 2), 16);
	}
	return ua;
}
function utf8ToHex(str) {
    var hex;
    try {
        hex = unescape(encodeURIComponent(str)).split('').map(function(v){
            return v.charCodeAt(0).toString(16)
        }).join('');
    } catch(e){
        hex = str;
        console.log('invalid text input: ' + str);
    }
    return hex;
};

function _serializeSafeString(str) {
    var r = new ArrayBuffer(132);
    var d = new Uint32Array(r);
    var b = new Uint8Array(r);

    var e = 4;
    if (str === null) {
        d[0] = 0xffffffff;

    } else {
        d[0] = str.length;
        for (var j = 0; j < str.length; ++j) {
            b[e++] = str.charCodeAt(j);
        }
    }
    return new Uint8Array(r, 0, e);
}


function _serializeLong(value) {
    var r = new ArrayBuffer(8);
    var d = new Uint32Array(r);
    d[0] = value;
    d[1] = Math.floor((value / 0x100000000));
    return new Uint8Array(r, 0, 8);
}

function _serializeMosaicDefinition(entity) {
    var r = new ArrayBuffer(40 + 264 + 516 + 1024 + 1024);
    var d = new Uint32Array(r);
    var b = new Uint8Array(r);

    var temp = hex2ua(entity['creator']);
    d[0] = temp.length;
    var e = 4;
    for (var j = 0; j<temp.length; ++j) { b[e++] = temp[j]; }

    var serializedMosaicId = _serializeMosaicId(entity.id);
    for (var j=0; j<serializedMosaicId.length; ++j) {
        b[e++] = serializedMosaicId[j];
    }

    var utf8ToUa = hex2ua(utf8ToHex(entity['description']));
    var temp = _serializeUaString(utf8ToUa);
    for (var j=0; j<temp.length; ++j) {
        b[e++] = temp[j];
    }

    var temp = _serializeProperties(entity['properties']);
    for (var j=0; j<temp.length; ++j) {
        b[e++] = temp[j];
    }

    var levy = _serializeLevy(entity['levy']);
    for (var j=0; j<levy.length; ++j) {
        b[e++] = levy[j];
    }
    return new Uint8Array(r, 0, e);
}

function _serializeUaString(str) {
    var r = new ArrayBuffer(516);
    var d = new Uint32Array(r);
    var b = new Uint8Array(r);

    var e = 4;
    if (str === null) {
        d[0] = 0xffffffff;

    } else {
        d[0] = str.length;
        for (var j = 0; j < str.length; ++j) {
            b[e++] = str[j];
        }
    }
    return new Uint8Array(r, 0, e);
};

function _serializeProperties(entity) {
    var r = new ArrayBuffer(1024);
    var d = new Uint32Array(r);
    var b = new Uint8Array(r);

    var i = 0;
    var e = 0;

    d[i++] = entity.length;
    e += 4;

    var temporary = entity;

    var temporary = [];
    for (var j=0; j<entity.length; ++j) {
        temporary.push(entity[j]);
    }

    var helper = {'divisibility':1, 'initialSupply':2, 'supplyMutable':3, 'transferable':4};
    temporary.sort(function(a, b) {return helper[a.name] < helper[b.name] ? -1 : helper[a.name] > helper[b.name];});

    for (var j=0; j<temporary.length; ++j) {
        var entity = temporary[j];
        var serializedProperty = _serializeProperty(entity);
        for (var k=0; k<serializedProperty.length; ++k) {
            b[e++] = serializedProperty[k];
        }
    }
    return new Uint8Array(r, 0, e);
}

function _serializeProperty(entity) {
    var r = new ArrayBuffer(1024);
    var d = new Uint32Array(r);
    var b = new Uint8Array(r);
    var serializedName = _serializeSafeString(entity['name']);
    var serializedValue = _serializeSafeString(entity['value']);
    d[0] = serializedName.length + serializedValue.length;
    var e = 4;
    for (var j = 0; j<serializedName.length; ++j) { b[e++] = serializedName[j]; }
    for (var j = 0; j<serializedValue.length; ++j) { b[e++] = serializedValue[j]; }
    return new Uint8Array(r, 0, e);
};

function _serializeLevy(entity) {
    var r = new ArrayBuffer(1024);
    var d = new Uint32Array(r);

    if (entity === null)
    {
        d[0] = 0;
        return new Uint8Array(r, 0, 4);
    }

    var b = new Uint8Array(r);
    d[1] = entity['type'];

    var e = 8;
    var temp = _serializeSafeString(entity['recipient']);
    for (var j = 0; j<temp.length; ++j) { b[e++] = temp[j]; }

    var serializedMosaicId = _serializeMosaicId(entity['mosaicId']);
    for (var j=0; j<serializedMosaicId.length; ++j) {
        b[e++] = serializedMosaicId[j];
    }

    var serializedFee = _serializeLong(entity['fee']);
    for (var j=0; j<serializedFee.length; ++j) {
        b[e++] = serializedFee[j];
    }

    d[0] = 4 + temp.length + serializedMosaicId.length + 8;

    return new Uint8Array(r, 0, e);
}

function _serializeMosaicId(mosaicId) {
    var r = new ArrayBuffer(264);
    var serializedNamespaceId = _serializeSafeString(mosaicId.namespaceId);
    var serializedName = _serializeSafeString(mosaicId.name);

    var b = new Uint8Array(r);
    var d = new Uint32Array(r);
    d[0] = serializedNamespaceId.length + serializedName.length;
    var e = 4;
    for (var j=0; j<serializedNamespaceId.length; ++j) {
        b[e++] = serializedNamespaceId[j];
    }
    for (var j=0; j<serializedName.length; ++j) {
        b[e++] = serializedName[j];
    }
    return new Uint8Array(r, 0, e);
}


function serializeTransaction (typeid,entity) {

	var r = new ArrayBuffer(512 + 2764);
	var d = new Uint32Array(r);
	var b = new Uint8Array(r);
	d[0] = entity['type'];
	d[1] = entity['version'];
	d[2] = entity['timeStamp'];

	var temp = hex2ua(entity['signer']);
	d[3] = temp.length;
	var e = 16;
	for (var j = 0; j<temp.length; ++j) { b[e++] = temp[j]; }

	// Transaction
	var i = e / 4;
	d[i++] = entity['fee'];
	d[i++] = Math.floor((entity['fee'] / 0x100000000));
	d[i++] = entity['deadline'];
	e += 12;


    // Provision Namespace transaction
    if (typeid === 0x2001) {
		console.log("Provision Namespace transaction");

        d[i++] = entity['rentalFeeSink'].length;
        e += 4;
        // TODO: check that entity['rentalFeeSink'].length is always 40 bytes

        for (var j = 0; j < entity['rentalFeeSink'].length; ++j) {
            b[e++] = entity['rentalFeeSink'].charCodeAt(j);
        }
        i = e / 4;

        d[i++] = entity['rentalFee'];
        d[i++] = Math.floor((entity['rentalFee'] / 0x100000000));
        e += 8;

        var temp = _serializeSafeString(entity['newPart']);
        for (var j = 0; j<temp.length; ++j) { b[e++] = temp[j]; }


        var temp = _serializeSafeString(entity['parent']);
        for (var j = 0; j<temp.length; ++j) { b[e++] = temp[j]; }

    // Mosaic Definition Creation transaction
    } else if (typeid === 0x4001) {
		console.log("Mosaic Definition Creation transaction");

        var temp = _serializeMosaicDefinition(entity['mosaicDefinition']);
        d[i++] = temp.length;
        e += 4;
        for (var j = 0; j<temp.length; ++j) { b[e++] = temp[j]; }

        temp = _serializeSafeString(entity['creationFeeSink']);
        for (var j = 0; j<temp.length; ++j) { b[e++] = temp[j]; }

        temp = _serializeLong(entity['creationFee']);
        for (var j = 0; j<temp.length; ++j) { b[e++] = temp[j]; }

	}else{
		console.log("Others");
		
	}

	return new Uint8Array(r, 0, e);
}

var CURRENT_NETWORK_ID = 96;
var CURRENT_NETWORK_VERSION = function(val) {

	if (CURRENT_NETWORK_ID === 104) {
		return 0x68000000 | val;
	} else if (CURRENT_NETWORK_ID === -104) {
		return 0x98000000 | val;
	}
	return 0x60000000 | val;
};

function fixPrivateKey(privatekey) {
	return ("0000000000000000000000000000000000000000000000000000000000000000" + privatekey.replace(/^00/, '')).slice(-64);
}


function provisionNamespaceRequest(){

	var due = 60;
	var timeStamp = Math.floor((Date.now() / 1000) - (NEM_EPOCH / 1000));

	var data ={
		'type': 0x2001,
		'version': CURRENT_NETWORK_VERSION(1),
		'signer': SENDER_PUBLIC_KEY,
		'timeStamp': timeStamp,
		'deadline': timeStamp + due * 60
	};

	var totalFee = 108 * 1000000;
	var rentalFee = 0;
	var custom = {};

	if(is_top_level_namespece_creating){

		//トップレベルのNamespace作成
		rentalFee = 50000 * 1000000;
		custom = {
			'rentalFeeSink': 'MAMESPACEWH4MKFMBCVFERDPOOP4FK7MTCZTG5E7',
			'rentalFee': rentalFee,
			'parent': PARENT_NAMESPACE,
			'newPart': NEW_NAMESPACE,
			'fee': totalFee

		};
	}else{

		//サブレベルのNamespace作成
		rentalFee = 5000 * 1000000;
		custom = {
			'rentalFeeSink': 'MAMESPACEWH4MKFMBCVFERDPOOP4FK7MTCZTG5E7',
			'rentalFee': rentalFee,
			'parent': PARENT_NAMESPACE,
			'newPart': NEW_NAMESPACE,
			'fee': totalFee

		};
	}

	var entity = $.extend(data, custom);
	var result = serializeTransaction(0x2001 ,entity);
	var kp = KeyPair.create(fixPrivateKey(SENDER_PRIVATE_KEY));  
	var signature = kp.sign(result);
	var obj = {'data':ua2hex(result), 'signature':signature.toString()};

	console.log(entity);
	console.log(result);
	console.log(obj);

	return $.ajax({
		url: URL_TRANSACTION_ANNOUNCE  ,
		type: 'POST',
		contentType:'application/json',
		data: JSON.stringify(obj)  ,
		error: function(XMLHttpRequest) {
			console.log( $.parseJSON(XMLHttpRequest.responseText));
		}
	});
}

function mosaicDefinitionRequest(){

	var due = 60;
	var timeStamp = Math.floor((Date.now() / 1000) - (NEM_EPOCH / 1000));

	var data ={
		'type': 0x4001,
		'version': CURRENT_NETWORK_VERSION(1),
		'signer': SENDER_PUBLIC_KEY,
		'timeStamp': timeStamp,
		'deadline': timeStamp + due * 60
	};

	var totalFee = 2 * 3 * 18 * 1000000;
	var creationFee = 50000 * 1000000;

//	var levyData = levy ? {
//		'type': levy.feeType,
//		'recipient': levy.address.toUpperCase().replace(/-/g, ''),
//		'mosaicId': levy.mosaic,
//		'fee': levy.fee,
//	} : null;

	var custom = {
		'creationFeeSink': 'MBMOSAICOD4F54EE5CDMR23CCBGOAM2XSKYHTOJD',
		'creationFee': creationFee,
		'mosaicDefinition':{
			'creator': SENDER_PUBLIC_KEY,
			'id': {
				'namespaceId': MOSAIC_DEF_IN,
				'name': NEW_MOSAIC,
			},
			'description': 'thisisjustatst',
			'properties': MOSAIC_PROPERTIES,
			'levy': null
		},
		'fee': totalFee
	};

	var entity = $.extend(data, custom);
	var result = serializeTransaction(0x4001 ,entity);
	var kp = KeyPair.create(fixPrivateKey(SENDER_PRIVATE_KEY));  
	var signature = kp.sign(result);
	var obj = {'data':ua2hex(result), 'signature':signature.toString()};

	console.log(entity);
	console.log(result);
	console.log(obj);

	return $.ajax({
		url: URL_TRANSACTION_ANNOUNCE  ,
		type: 'POST',
		contentType:'application/json',
		data: JSON.stringify(obj)  ,
		error: function(XMLHttpRequest) {
			console.log( $.parseJSON(XMLHttpRequest.responseText));
		}
	});
}
