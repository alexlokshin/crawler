# crawler

[![Codefresh build status]( https://g.codefresh.io/api/badges/build?repoOwner=alexlokshin&repoName=crawler&branch=master&pipelineName=crawler&accountName=alexlokshin&type=cf-1)]( https://g.codefresh.io/repositories/alexlokshin/crawler/builds?filter=trigger:build;branch:master;service:5a18eeaa24a2970001839643~crawler)

[![Build Status](https://travis-ci.org/alexlokshin/crawler.svg?branch=master)](https://travis-ci.org/alexlokshin/crawler)

## What is this?
This is a basic Florida craft brewery crawler API, that intends to grow.

## What kind of toolkit is used at the moment?
Free Travis CI for CI/CD, Kubernetes 1.9.0 (the non-cloud kind) for horizontal scale, Microtik router fronting the Kubernetes cluster, Cabot for endpoint monitoring, Weave Cloud for Kubernetes monitoring (however, once trial period expires, I will have to switch to Grafana/Prometheus/Alertmanager combo). Application is developed in Node.js, and I use `supertest` for unit tests.

## Side notes

Mikrotik requires the following to forward ports through the router.

```
add action=dst-nat chain=dstnat disabled=no dst-port=PUBLIC_PORT in-interface=ether1-gateway protocol=tcp to-addresses=WEB_SERVER_IP to-ports=PRIVATE_PORT
```

Mikrotik allows basic load balancing based on the source IP of the request, so the public facing `PUBLIC_PORT` can be routed across several internal `WEB_SERVER_IP`s. For example:
```
/ip firewall nat
add action=dst-nat chain=dstnat disabled=no dst-port=PUBLIC_PORT in-interface=ether1-gateway protocol=tcp to-addresses=WEB_SERVER_IP1 to-ports=PRIVATE_PORT per-connection-classifier=src-address:3/0
add action=dst-nat chain=dstnat disabled=no dst-port=PUBLIC_PORT in-interface=ether1-gateway protocol=tcp to-addresses=WEB_SERVER_IP2 to-ports=PRIVATE_PORT per-connection-classifier=src-address:3/1
add action=dst-nat chain=dstnat disabled=no dst-port=PUBLIC_PORT in-interface=ether1-gateway protocol=tcp to-addresses=WEB_SERVER_IP3 to-ports=PRIVATE_PORT per-connection-classifier=src-address:3/2
```

In addition, to be able to access your public IP from within the LAN, a Hairpin NAT needs to be configured (https://wiki.mikrotik.com/wiki/Hairpin_NAT). For example:

```
add chain=dstnat dst-address=PUBLIC_IP protocol=tcp dst-port=PUBLIC_PORT action=dst-nat to-address=WEB_SERVER_IP to-port=PRIVATE_PORT
add chain=srcnat src-address=192.168.88.0/24 dst-address=WEB_SERVER_IP protocol=tcp dst-port=PRIVATE_PORT out-interface=bridge-local action=masquerade
```

To allow Kubernetes related api calls on an RBAC-enabled cluster, make sure to 
```
kubectl apply -f k8s/rbac.yml
```
