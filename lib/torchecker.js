/* 
Copyright (c) 2012 Pablo Duboue

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var dns = require('dns');
var http = require('http');

var stored_external_ip;
var stored_port;
var timeoutId;
var do_not_refresh = false;

var list_of_all_exit_nodes = [];
var relevant_exit_nodes = {};

var debug = false;

function refresh(){
    // fetch list of all exit nodes
    var full_list = "";
    http.get("https://check.torproject.org/exit-addresses", function(res){
	res.on('data', function(chunk){
	    full_list += chunk;
	});
	res.on('end', function(){
	    // parse the list
	    list_of_all_exit_nodes = 
		full_list.split('\n').filter(function(line){
		    return /^ExitAddress /.test(line);
		}).map(function(line){
		    return line.replace(/^ExitAddress /,"").split(" ")[0];
		});

	    if(debug){
		console.log("Got " + list_of_all_exit_nodes.length + " exit nodes");
	    }
	    
	    // go through them doing DNS requests
	    list_of_all_exit_nodes.slice(0, debug ? 10 : 
					 list_of_all_exit_nodes.length).
		map(function(exit_node){
		    is_using_tor(exit_node, stored_external_ip, stored_external_port);
		});
	});   
    });

    if(!do_not_refresh)
	timeoutId = setTimeout(refresh, 1000 * 60 * 60 * 24);
}

function is_using_tor(client_ip, target, port) {
    // see isUsingTor @ https://svn.torproject.org/svn/check/trunk/cgi-bin/TorBulkExitList.py

    var exit_node = client_ip.toString().split('.').reverse().join('.');
    target = target.toString().split('.').reverse().join('.');
    
    var exitlist_dns = "ip-port.exitlist.torproject.org";

    var dns_question = [ exit_node, port, target, exitlist_dns ].join('.');
    var request = dns.resolve4(dns_question, function(err, addresses){
	if(!err){
	    if(addresses.filter(function(address){
		return address === '127.0.0.2';
	    })[0] ==='127.0.0.2'){
		relevant_exit_nodes[client_ip] = true;
	    }else{
		delete relevant_exit_nodes[client_ip];
	    }
	}else{
	    if(debug){
		console.log("client_ip="+client_ip+
			    " question="+ dns_question+
			    " err="+err);
	    }
	}
    });
}

function start(external_ip, port){
    do_not_refresh = false;
    stored_external_ip = external_ip;
    stored_external_port =  port === undefined ? 80 : Number(port);

    refresh();
}

function stop(){
    do_not_refresh = true;
    clearTimeout(timeoutId);
}

function check(connection){
    var ipv4str;
    if(typeof connection === "string"){
	ipv4str = connection;
    }else{ // it is a connection
	if(connection.address === undefined){
	    if(connection.remoteAddress === undefined)
		return false; // don't know what to do with this
	    ipv4str=connection.remoteAddress;
	}else{
	    if(connection.address().family != 'IPv4')
		return false; // other protocols not supported
	    ipv4str=connection.address().address
	}
    }
    return relevant_exit_nodes[ipv4str] !== undefined;
}

function list(){
    var result=[];
    for(exit_node in relevant_exit_nodes)
	result.push(exit_node);
    return result;
}


exports.start = start;
exports.stop = stop;
exports.check = check;
exports.list = list;

if(debug){
    exports.list_all = function(){
	return list_of_all_exit_nodes;
    }
}
