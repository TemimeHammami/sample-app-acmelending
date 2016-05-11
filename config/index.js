import ZoomdataSDK from 'zoomdata-client';

// Switch to false for development mode
var production = false;

var redirect = {
	dev_uri: "http://localhost:8090/zd-data-app-01",
	prod_uri: "http://demos.zoomdata.com/zd-data-app-01"
}

var devAppConfig = {
	secure: true,   
	host: 'pubsdk.zoomdata.com',                
	port: 8443,                 
	path: '/zoomdata'
}

var prodAppConfig = {
	secure: true,   
	host: 'developer.zoomdata.com',                
	port: 443,                 
	path: '/zoomdata'
}

var devCredentialsConfig = {
  	key: "56ec8877e4b0c1680babc247"
}

var prodCredentialsConfig = {
  	key: "5731f2afe4b0ef63190d163c"
}

function obtainRedirect() {
	return production ? redirect.prod_uri : redirect.dev_uri;
}

function initClient() {
	var applicationConfig = production ? prodAppConfig : devAppConfig;
	var credentialsConfig = production ? prodCredentialsConfig : devCredentialsConfig;
    return ZoomdataSDK.createClient({
        credentials: credentialsConfig,
        application: applicationConfig
    });
}

export function checkFailReason(reason) {
	console.log('Failed: ' + reason);
	var redirect = false;
	if ((reason + '').includes('Internal XMLHttpRequest Error')) {
	  redirect = true;
	} else if (reason.type === 'error') {
	  redirect = true;
	} else if (reason.responseText !== undefined) {
	  var responseText = reason.responseText;
	  if (responseText.includes('authentication') || 
	      responseText.includes('login')) {
	    redirect = true;
	  }
	}
	console.log('redirect is ' + redirect);
	if (redirect) {
	  window.location.href= obtainRedirect();  
	}
}

export const createClient = initClient;
