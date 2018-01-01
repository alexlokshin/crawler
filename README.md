# crawler

[![Codefresh build status]( https://g.codefresh.io/api/badges/build?repoOwner=alexlokshin&repoName=crawler&branch=master&pipelineName=crawler&accountName=alexlokshin&type=cf-1)]( https://g.codefresh.io/repositories/alexlokshin/crawler/builds?filter=trigger:build;branch:master;service:5a18eeaa24a2970001839643~crawler)

Mikrotik requires the following to forward ports through the router.

```
add action=dst-nat chain=dstnat disabled=no dst-port=yyyy in-interface=ether1-gateway protocol=tcp to-addresses=192.168.xx.xx to-ports=xxxx
```
