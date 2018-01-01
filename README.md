# crawler

[![Codefresh build status]( https://g.codefresh.io/api/badges/build?repoOwner=alexlokshin&repoName=crawler&branch=master&pipelineName=crawler&accountName=alexlokshin&type=cf-1)]( https://g.codefresh.io/repositories/alexlokshin/crawler/builds?filter=trigger:build;branch:master;service:5a18eeaa24a2970001839643~crawler)

[![Build Status](https://travis-ci.org/alexlokshin/crawler.svg?branch=master)](https://travis-ci.org/alexlokshin/crawler)

Mikrotik requires the following to forward ports through the router.

```
add action=dst-nat chain=dstnat disabled=no dst-port=yyyy in-interface=ether1-gateway protocol=tcp to-addresses=192.168.xx.xx to-ports=xxxx
```

In addition, to be able to access your public IP from within the LAN, a Hairpin NAT needs to be configured (https://wiki.mikrotik.com/wiki/Hairpin_NAT). For example:

```
add chain=dstnat dst-address=PUBLIC_IP protocol=tcp dst-port=PUBLIC_PORT action=dst-nat to-address=WEB_SERVER_IP to-port=PRIVATE_PORT
add chain=srcnat src-address=192.168.88.0/24 dst-address=WEB_SERVER_IP protocol=tcp dst-port=PRIVATE_PORT out-interface=bridge-local action=masquerade
```
