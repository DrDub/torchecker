torchecker
==========

node package that checks whether a connection is coming from a Tor exit node.

To function, torchecker uses an external IP you provide and then
fetches a list of exit node IPs from

http://exitlist.torproject.org/exit-addresses

and then queries the DNS server ip-port.exitlist.torproject.org.

It refreshes the list of IPs daily.

(This is basically a re-implementation in node.js of the service at

https://check.torproject.org/cgi-bin/TorBulkExitList.py

from

https://svn.torproject.org/svn/check/trunk/cgi-bin/TorBulkExitList.py)


Why
---

You can expect users connecting through an anonymity network to your
site or Internet service are more concerned about their privacy. In
the same vein as the Do Not Track Web tracking opt out policies,
torchecker allows developers to respect the enhanced privacy
expectations of people using the Tor network.

Usage
-----

```javascript
var torchecker = require('torchecker');

// will remember the EXTERNAL_IP and fetch again once a day
// optional port number as second parameter, otherwise assumes port 80
torchecker.start(EXTERNAL_IP); 
torchecker.stop(); // stop checking once a day, still can be used
console.log(torchecker.check(request.connection)); // returns true if coming through Tor
console.log(torchecker.check("38.229.70.31");
console.log(torchecker.list()); // if you're curious
```

Learn more
----------

* https://trac.torproject.org/projects/tor/wiki/doc/TorDNSExitList
* https://svn.torproject.org/svn/check/trunk/cgi-bin/TorBulkExitList.py

