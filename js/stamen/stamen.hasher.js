/**
    Wrapper for Hasher <http://github.com/millermedeiros/hasher>

    Requirements:
    Hasher.js
    Signals.js
    D3 (only for dispatch)
**/


(function(exports) {
    'use strict';
    var STA = exports.STA || (exports.STA = {});

    STA.hasher = (function(){
        var __ = {},
            currentHash = null,
            dispatch = d3.dispatch('initialHash', 'change'),
            initialHashSet = false;


        var onHashChange = function(newHash, oldHash) {
            if (newHash === oldHash) return;
            currentHash = __.parseHash(newHash);
            dispatch.change(currentHash);
        };

        var onInitialHash = function(hash) {
            currentHash = __.parseHash(hash);
            initialHashSet = true;
            dispatch.initialHash();
        };

        var flatten = function(o) {
            var parts = [];
            for (var k in o) {
                if (o.hasOwnProperty(k) && o[k]) {
                    if (k === 'c') { // not encoding map coordinates
                        parts.push(encodeURIComponent(k) + "=" + o[k]);
                    } else {
                        parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(o[k]));
                    }

                }
            }
            return parts.join("&");
        };

        __.start = function() {
            hasher.changed.add(onHashChange); //add hash change listener
            hasher.initialized.add(onInitialHash); //add initialized listener (to grab initial value in case it is already set)
            hasher.init(); //initialize hasher (start listening for history changes)
        };

        __.set = function(obj, special) {
            if (!initialHashSet) return;
            special = special || '';

            var str = flatten(obj)

            switch(special) {
                case 'silent':
                    hasher.changed.active = false; //disable changed signal
                    hasher.setHash(str); //set hash without dispatching changed signal
                    hasher.changed.active = true; //re-enable signal
                break;
                case 'noHistory':
                    hasher.replaceHash(str);
                break;
                case 'noHistory-silent':
                    hasher.changed.active = false; //disable changed signal
                    hasher.replaceHash(str);
                    hasher.changed.active = true; //re-enable signal
                    currentHash = __.parseHash(str);
                break;
                default:
                    hasher.setHash(str);
                break;
            }
        };

        __.setMapState = function(center, zoom) {
            var hash = __.get();
            var coords = zoom + ':' + center.lat.toFixed(5) + ':' + center.lng.toFixed(5);
            hash.c = coords;

            __.set(hash, 'noHistory-silent');
        };

        __.getMapState = function(hashObj) {
            hashObj =  hashObj || __.get();
            if (!hashObj || !hashObj.c) return null;
            var parts = hashObj.c.split(':'),
                coords = new L.LatLng(parts[1],parts[2]),
                zoom = +parts[0];

            return {center:coords, zoom: zoom};
        };

        __.parseHash = function(hashStr) {
            var vars = {};
            var hashParts = hashStr.split('?');
            var hashes = hashParts[0].split('&');

            for(var i = 0; i < hashes.length; i++) {
               var hash = hashes[i].split('=');

               if(hash.length > 1) {
                   vars[hash[0]] = hash[1];
               } else {
                  vars[hash[0]] = null;
               }
            }

            return vars;
        };

        __.get = function() {
            return currentHash;
        };

        d3.rebind(__, dispatch, "on");
        return __;
    })();

})(window);