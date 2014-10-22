module.exports = (function() { 
    var facility_obj = {};
    function _buildFacility(sites, hidden) {
        var facilities = [];
        sites.forEach(function(site) {
            var facility =   site.toJSON({
                                    hide: hidden, 
                                    transform: true
                                });
            facilities[facilities.length] = facility;
        }); 
   
        facility_obj["facilities"] = facilities; 
        return this;
    }

    function _addExtras(extras) {
        (Object.keys(extras)).forEach(function(extra) {
            facility_obj[extra] = extras[extra];
        });
        return this;
    }

    return {
        addExtras: _addExtras,
        buildFacility: _buildFacility,
        toObject: function() { return facility_obj; }
    };
})();

