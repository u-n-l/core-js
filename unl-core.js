/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/* UnlCore SDK libraries  (c) Emre Turan 2019 / MIT Licence  */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
"use strict";

const UnlCore = require("./src/core")
//Expose submodule for Polyhash algorithm 
UnlCore.Polyhash = require("./src/polyhash");

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
if (typeof module != "undefined" && module.exports) module.exports = UnlCore; // CommonJS, node.js