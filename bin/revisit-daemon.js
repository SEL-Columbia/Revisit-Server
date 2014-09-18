#!/usr/bin/env node

/**

This file serves as the startup point for the server daemon process. In the future we may want to 
implement clusters.

(See https://www.digitalocean.com/community/tutorials/how-to-write-a-linux-daemon-with-node-js-on-a-vps)

*/

// Everything above this line will be executed twice
require('daemon')();

// Run the HTTP server
require('../server');