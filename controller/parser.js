// parse param and build query
// for each param field
known_keys =    [   
                    'allProperties',
                    'sortAsc',
                    'sortDesc',
                    'fields',
                    'limit',
                    'offset',
                    'active',
                    'updateSince'
                ]
                    
//var site = {};
//    site.allProperites = req.params.allProperties; // true or false 
//    site.sortAsc = req.params.sortAsc; // sort asc by property
//    site.sortDesc = req.params.sortDesc; // sort dsc by propery
//    site.fields = req.params.fields; // comma seperate list of fields with : lookup support
//

var parseParams = function(params, query) {

    var exclusions = {};
    var filters = {};
    // filters
    // ....
   
    // exclusions
    if (params.allProperties) 
        genPropQuery(exclusions, params.allProperties)


    query = query.find(filters, exclusions)
    //add ons
    if (params.sortAsc) 
        query = genAscQuery(query, params.sortAsc)

    if (params.sortDesc) 
        query = genDescQuery(query, params.sortDesc)

    paramKeys = Object.keys(params);

    paramKeys.forEach(function(pkey) {
        if (known_keys.indexOf(pkey) < 0) {
            console.log(">>> Unknown: " + pkey)
        }
    });
    //}

    console.log(">>> Filters " + JSON.stringify(filters));
    console.log(">>> Excludes " + JSON.stringify(exclusions));
    return query 

}


var genPropQuery = function(exclusions, prop) {
    if (prop)
        exclusions["properties"] = 0;
}

var genAscQuery = function(query, asc) {
   return query.sort({asc: 1})
}

var genDescQuery = function(query, desc) {
   return query.sort({desc: -1})
}

exports.parseParams = parseParams;
