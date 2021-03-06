const DEBUG = true;

const INVALIDATE_TIMEOUT_SEC = 50;
const REQUEST_INTERVAL = 2000;

const REMINDER_DELETE_CLIPBOARD = 10000;
const REMINDER_TITLE = "Don't forget!";
const REMINDER_BODY = "Remember to clear your clipboard, your credentials are still there!";

const LOCAL_STORAGE_PRIVATE_NAME = 'private_key';
const LOCAL_STORAGE_PUBLIC_NAME = 'public_key';
const DEFAULT_KEY_SIZE = 4096;

var _sid;
var _token;
var _crypt;
var invalidateSid = false;
var requestFinished = true;
var pollingInterval;
var _query_string = parseWindowURL();  
var _keySize = DEFAULT_KEY_SIZE

const _setQrLoadingTip = (wait_time) => {
	//wait 10s 
	if(wait_time < 1000 * 10) {
		$("#sidLabel").html("<span>Generating your key pair...<span><br/><span>This process may take a while</span>")
	} else {
		$("#sidLabel").html("<span>Generating your key pair...<span><br/><span>Tired of waiting? <a href=\"?key_size=1024\">Switch</a> to less secure (1024 bit) key pair</span>")
	}
}

function init() {

	//Hide hosting if SelfHosted
	if(!window.location.hostname.toLowerCase().endsWith("keelink.cloud")) {
		$("#hostedby").hide();
	}

	//Enable scrolling effect on anchor clicking
	var _root = $('html, body');
	$('a.navbar-link').click(function(event){
		event.preventDefault();
		_root.animate({
			scrollTop: $( $(this).attr('href') ).offset().top
		}, 500);
		return false;
	});

	if(_query_string && _query_string.show) {
		$('a.navbar-link[href$="' + _query_string.show + '"').trigger('click');
		//window.location.hash = "#" + _query_string.show;
	}

	if (_query_string && _query_string.key_size) {
		try {
			_keySize = parseInt(_query_string.key_size)
		} catch(e) {
			console.warn("failed to parse key size:", _query_string.key_size, "error:", e)
		}
	}
	
	if(_query_string && (_query_string.onlyinfo === true || _query_string.onlyinfo === 'true')) {
		$("#qrplaceholder").hide();
	}
	else {
		$("#qrcode_loading").show()

		if(!hasSavedKeyPair()) {
			log('no previous saved keypair available in web storage')
			//setting an interval avoid UI freeze
			const intervalRate = 100
			var waitTime = 0
			var interval = setInterval(() => {
				waitTime += intervalRate
				_setQrLoadingTip(waitTime)
			}, intervalRate)
			//generate key pair
			generateKeyPair().then(() => {
				clearInterval(interval)
				requestInit()
			})
		} else {
			log('previous keypair found, using it')
			//load key from local storage
			loadKeyPair()
			requestInit()
		}
	}
}

function requestInit() {
	$("#sidLabel").text("Receiving...");
	
	log(PEMtoBase64(_crypt.getPublicKey()));
	log(toSafeBase64(PEMtoBase64(_crypt.getPublicKey())))
	
	$.post("init.php",{PUBLIC_KEY : toSafeBase64(PEMtoBase64(_crypt.getPublicKey()))},"json")
	.done(function(data) {
		if(data.status === true) {
			_sid = data['message'].split("###")[0];
			_token = data['message'].split("###")[1];
			
			if(!checkBrowserSupport()) {
				alertError("Your browser is up to date, please use newer browser");
			} else {
				$("#sidLabel").text(_sid);
				initQrCode();
				initAsyncAjaxRequest();
			}
		} else {
			alertError("Cannot initialize KeeLink",data.message);
		}
	})
	.fail(function() {
		alertError("Error","Cannot initilize this service");
	});
}

function generateKeyPair() {
	return new Promise((resolve) => {
		_crypt = new JSEncrypt({default_key_size: _keySize});
		_crypt.getKey(() => {
			//save generated key pair on the browser internal storage
			if (supportLocalStorage()) {
				log('web storage available, save generated key')

				localStorage.setItem(LOCAL_STORAGE_PUBLIC_NAME, _crypt.getPublicKey())
				localStorage.setItem(LOCAL_STORAGE_PRIVATE_NAME, _crypt.getPrivateKey())
			} else {
				warn('web storage NOT available')
			}

			log(_crypt.getPublicKey());
			resolve()
		});
		
		
	});
}

function supportLocalStorage() {
	return typeof(Storage) !== "undefined";
} 

function hasSavedKeyPair() {
	if(supportLocalStorage()) {
		var privateKey = localStorage.getItem(LOCAL_STORAGE_PRIVATE_NAME)
		var publicKey = localStorage.getItem(LOCAL_STORAGE_PUBLIC_NAME)
		if(privateKey !== undefined && privateKey !== null && publicKey !== undefined && publicKey !== null) {
			return true
		}
	}

	return false
}

function loadKeyPair() {
	_crypt = new JSEncrypt()
	_crypt.setPublicKey(localStorage.getItem(LOCAL_STORAGE_PUBLIC_NAME))
	_crypt.setPrivateKey(localStorage.getItem(LOCAL_STORAGE_PRIVATE_NAME))
}

function parseWindowURL() {
	var query_string = {};
	var query = window.location.href.split("?")[1];
	if(query) {
		var vars = query.split("&");
		for (var i=0;i<vars.length;i++) {
			var pair = vars[i].split("=");
				// If first entry with this name
			if (typeof query_string[pair[0]] === "undefined") {
			query_string[pair[0]] = decodeURIComponent(pair[1]);
				// If second entry with this name
			} else if (typeof query_string[pair[0]] === "string") {
			var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
			query_string[pair[0]] = arr;
				// If third or later entry with this name
			} else {
			query_string[pair[0]].push(decodeURIComponent(pair[1]));
			}
		} 
		return query_string;
	}

}

function initAsyncAjaxRequest() {
	pollingInterval = setInterval(passwordLooker, REQUEST_INTERVAL);
	setTimeout(function () {
		invalidateSid = true;
	},1000 * INVALIDATE_TIMEOUT_SEC);
}

function passwordLooker() {
	if(!invalidateSid) {
		if(requestFinished) {
			requestFinished = false;
			$.get("getcredforsid.php",{'sid':_sid, 'token': _token},onSuccess,"json").always(function() {requestFinished = true;});
		}
	} else {
		invalidateSession(); 
		alertWarnReload("No credentials received...","No credential was received in the last minute, reload page to start a new session");
	}
}

function initClipboardButtons(username,password,copyPassword) {
	
	if(username !== undefined && username !== null) {
		$("#copyUserBtn").show();
		$("#copyUserBtn").attr("data-clipboard-text",username);
		
		//Copy username to clipboard button
		var clipCopyUser = new ClipboardJS('#copyUserBtn');
		clipCopyUser.on('success', function() {
			copiedSuccess('#copyUserBtn', false);
			remindDelete();
		});
		clipCopyUser.on('error', function() {
			copiedError('#copyUserBtn', false);
		});
	}

	$("#copyPassBtn").show();
	$("#clearBtn").show();
	$("#reloadBtn").show();
	
	$("#copyPassBtn").attr("data-clipboard-text",password);
	
	//Copy password to clipboard button
	var clipCopyPsw = new ClipboardJS('#copyPassBtn');
	clipCopyPsw.on('success', function() {
		copiedSuccess('#copyPassBtn', false);
		remindDelete();
	});
	clipCopyPsw.on('error', function() {
		copiedError('#copyPassBtn', false);
	});
	
	//Copy password if needed
	if(copyPassword) {
		$("#copyPassBtn").click();
	}

	//Clear clipboard button
	var clipClear = new ClipboardJS('#clearBtn');
	clipClear.on('success', function() {
		copiedSuccess('#clearBtn', true);
	});
	clipClear.on('error', function() {
		copiedError('#clearBtn', true);
	});
}

function copiedSuccess(btn, isClear) {
	var originalText = $(btn).text();
	$(btn).html(isClear ? "Cleared!" : "Copied!");
	setTimeout(function(){ $(btn).html(originalText); }, 1000);
}

function copiedError(btn, isClear) {
	var originalText = $(btn).text();
	$(btn).html(isClear ? "Error clearing!" : "Error copying!");
	setTimeout(function(){ $(btn).html(originalText); }, 1000);
}

function initQrCode() {
	$("#qrcode_loading").hide()
	$("#qrcode").show()

	var qrcode = new QRCode(document.getElementById("qrcode"), {
		text: "ksid://" + _sid,
		width: 200,
		height: 200,
		colorDark : "#000000",
		colorLight : "#ffffff",
		correctLevel : QRCode.CorrectLevel.H
	});
	
	setTimeout(function(){ $("#qrcode").css("opacity",1); }, 500);
}

function alertSuccess(title,msg) {
	swal({
	title: title,
	text: msg,
	icon: "success"
	});
}

function alertInfo(title,msg) {
	swal({
	title: title,
	text: msg,
	icon: "info"
	});
}

function alertWarn(title,msg) {
	swal({
	title: title,
	text: msg,
	icon: "warning"
	});
}

function alertWarnReload(title,msg) {
	swal({
	title: title,
	text: msg,
	icon: "warning",
	button: "Reload",
	}).then((value)=>{
		if(value)
			refreshPage();
	});
}

function alertError(title,msg) {
	swal({
	title: title,
	text: msg,
	icon: "error"
	});
}

function checkBrowserSupport() {
	return "XMLHttpRequest" in window;
}

function checkNotificationSupport() {
	return "Notification" in window;
}

function remindDelete() {
	setTimeout(function() {
		if (Notification.permission === "granted") {
			var notification = new Notification(REMINDER_TITLE,{"body":REMINDER_BODY});
		}
		else if (Notification.permission !== 'denied') {
			Notification.requestPermission(function (permission) {
			if (permission === "granted") {
				var notification = new Notification(REMINDER_TITLE,{"body":REMINDER_BODY});
			}
			});
		}
	},REMINDER_DELETE_CLIPBOARD);
}

function onSuccess(data,textStatus,jqXhr) {
	if(data != undefined && data.status === true) {
		let decryptedUsername, decryptedPsw;

		if(data.username === undefined || data.username === null) {
			log("Username was not received")
		} else {
			log("Encoded username: " + data.username);
			data.username = fromSafeBase64(data.username);
			log("Decoded username: " + data.username);
			decryptedUsername = _crypt.decrypt(data.username);
			log("Decrypted username: " + decryptedUsername);
		}
		
		log("Encoded password: " + data.password);
		data.password = fromSafeBase64(data.password);
		log("Decoded password: " + data.password);
		decryptedPsw = _crypt.decrypt(data.password);
		log("Decrypted password: " + decryptedPsw);
		
		if(decryptedPsw) { //Username is not required for next steps
			swal({
				title: "Credentials received!",
				text: "Would you copy your password on clipboard? (Also remember to clear your clipboard after usage!)",
				icon: "success",
				button: "Copy",
			}).then((value)=>{
				initClipboardButtons(decryptedUsername, decryptedPsw, value);
				invalidateSession();
			});
		} else {
			alertError("Error", "There was an error, can't decrypt your credentials. Try again...");
			invalidateSession();
		}
	}
}

function onFail(data,textStatus,jqXhr) {
	errorMsg = (data != undefined && data.status === false) ? "Error: " + data.message : "Are you connected to Internet?"
	alertError("Comunication Failure",errorMsg)
}

function invalidateSession() {
	invalidateSid = true;
	clearInterval(pollingInterval);
	$.post("removeentry.php",{'sid':_sid},function(){},"json");
	_sid = null;
	_token = null;
	$("#sidLabel").css("text-decoration", "line-through");

	$("#qrcode").hide()
	$("#qrcode_reload").show()
}

function refreshPage(){
    window.location.reload();
} 

function PEMtoBase64(pem) {
	return pem.replace(new RegExp("\\n","g"), "").replace("-----BEGIN PUBLIC KEY-----", "").replace("-----END PUBLIC KEY-----", "");
}

function toSafeBase64(notSafe) {
	return notSafe.replace(new RegExp("\\n","g"), "").replace(new RegExp("\\+","g"),"-").replace(new RegExp("\/","g"), "_");
}

function fromSafeBase64(safe) {
	return safe.replace(new RegExp("\\n","g"), "").replace(new RegExp("-","g"),"+").replace(new RegExp("_","g"), "/");
}

function log(str) {
	if(DEBUG)
		console.log(str);
}

function warn(str) {
	if(DEBUG)
		console.log(str);
}