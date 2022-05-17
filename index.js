'use strict'

const { MTProtoProxy } = require('mtprotoproxy');
const http = require('http');
const net = require('net');


let totalBytesRead = 0;
let totalBytesWritten = 0;
let totalConnections = 0
let ongoingConnections = 0
let stats = [];
let allowedClients = {};


let httpServer = http.createServer(function (req, res) {
    let p = req.url.toLowerCase();
    let ip = req.socket.remoteAddress;
    if (p === '/log') {
        res.write(`<html><h1>Dear ${req.socket.remoteAddress}, Welcome; Here is the report:</h1>
			<head>
			<style>
			table, th, td {
			  border: 1px solid black;
			  border-collapse: collapse;
			}
			th, td {
			  padding: 5px;
			  text-align: left;    
			}
			</style>
			</head>`)
        res.end(`
			<h2>Statistics</h2>
			<div>totalBytesRead: ${totalBytesRead}</div>
			<div>totalBytesWritten: ${totalBytesWritten}</div>
			<div>totalConnections: ${totalConnections}</div>
			<div>ongoingConnections: ${ongoingConnections}</div>
			<h2>Log:</h2>
			<table style="width:100%">
			  <tr>
			    <th>Disconnected</th>
			    <th>Connection time</th>
			    <th>No</th>
			    <th>IP</th>
			    <th>PORT</th>
			    <th>Sent</th>
			    <th>Received</th>
			    <th>Error</th>
			    <th>Disconnetion time</th>
			  </tr>
			<tr>${stats.map(
            function (stat) {
                return '<td>' + Object.keys(stat).map(function (item) {
                    if ((item === 'ctime') || (item === 'dtime'))
                        return new Date(stat[item]).toLocaleString();
                    if (item === 'error') {
                        if (!stat[item])
                            return 'No error'
                        return stat[item].stack;
                    }
                    return stat[item];
                }).join('</td><td>')
            }).join('</tr><tr>') + '</td>'
            }</tr></table></html>`);
        return
    }
    if (p === '/clients') {
        res.write('<html><h1>Dear ' + req.socket.remoteAddress + ', Welcome; Here are the clients:</h1>')
        res.end(`<h2>Statistics</h2><div>totalBytesRead: ${totalBytesRead}</div><div>totalBytesWritten: ${totalBytesWritten}</div><div>totalConnections: ${totalConnections}</div><div>ongoingConnections: ${ongoingConnections}</div><h2>Current clients:</h2><div>${Object.keys(stats).filter(function (index) { return !stats[index].ended }).map(index => stats[index].address).join('</div><div>')}</div></html>`);
        return
    }
    if (p === '/login') {
        allowedClients[ip] = +new Date();
        res.end(`<html><h1>Dear user ${ip}</h1><div>You logged in...</div></html>`);
        return
    }
    if (p === '/logout') {
        delete allowedClients[ip];
        res.end(`<html><h1>Dear user ${ip}</h1><div>You logged out...</div></html>`);
        return
    }
    res.end(`<html><h1>This website is under construction...</h1><div>Comeback later please.</div></html>`);
    return

});

let telegram = new MTProtoProxy(
    {
        secrets: ['dd00000000000000000000000000000000'],
        httpServer,
        async enter(options) {

            console.log('New client:', options);
            ongoingConnections++;
            stats[options.id] = Object.assign({ ended: false, ctime: +new Date() }, options);
            if ((allowedClients[options.address]) && ((+new Date() - allowedClients[options.address]) < 3 * 3600 * 1000)) {
                allowedClients[options.address] = +new Date();
                return Promise.resolve()
            }
            else {
                delete allowedClients[options.address]
                return Promise.reject(new Error('Forbidden user'));  //or simply throw error
            }
        },
        ready() {
            let proxy = net.createServer(telegram.proxy);
            proxy.on('error', function (err) { console.log(err) })
            proxy.listen(3000, '0.0.0.0');
        },
        leave(options) {
            console.log('Client left:', options);
            allowedClients[options.address] = +new Date();
            totalBytesRead += options.bytesRead;
            totalBytesWritten += options.bytesWritten;
            Object.assign(stats[options.id], options);
            stats[options.id].ended = true;
            stats[options.id].dtime = +new Date();
            totalConnections++;
            ongoingConnections--;
        }
    }
);