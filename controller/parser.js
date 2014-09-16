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
                    
// consumes params builds query, returns for view to exec
var parseParams = function(params, query) {

    var projections = {};
    var filters = {};
    var sorts = {};

    // filters
    // TODO:.... active,updatedSince,random addons
    
    // add ons
    paramKeys = Object.keys(params);
    paramKeys.forEach(function(pkey) {
        if (known_keys.indexOf(pkey) < 0) {
            console.log(">>> Unknown: " + pkey)
            // TODO: filter by add ons?
        }
    });


    // projections
    if (params.fields) {
        field_names = params.fields.split(",");
        field_names.forEach(function(field) {
            field = field.replace(":", ".");
            console.log(">>> Field: " + field);
            projections[field] = 1;

        })
    }

    if (params.allProperties) {
        genPropQuery(projections, params.allProperties)
    }


    // find op is set in stone by this point
    query = query.find(filters, projections)

    // sort (cannot be seperated)
    if (params.sortAsc) { 
        genAscQuery(sorts, params.sortAsc)
    }

    if (params.sortDesc) {
        genDescQuery(sorts, params.sortDesc)
    }


    query = query.sort(sorts)

    console.log(">>> Filters " + JSON.stringify(filters));
    console.log(">>> Projections " + JSON.stringify(projections));
    console.log(">>> Sorts " + JSON.stringify(sorts));

    query = genLimitQuery(params, query);

    console.log(">>> Query: Op >>", query.op, "Options >>",
                query.options, "Fields  >>", query._fields)

    return query
 
}


// query augmentation functions, might not actually need to be funcs but
var genLimitQuery = function(params, query) {
    if (params.limit == null) {
        params.limit = 5; // should be 25
    } else if (site.limit == "off") {
        params.limit = 0;
    } 

    if (params.offset == null) {
        params.offset = 0;
    } 

    return query.skip(params.offset).limit(params.limit)  
}

var genPropQuery = function(projections, prop) {
    // this looks silly but js is dangerous 
    if (prop == 'false') {
        projections["properties"] = 0;
    } else if (prop == 'true') {
        projections["properties"] = 1;
    }
}

var genAscQuery = function(sorts, asc) {
   sorts[asc]=1;
}

var genDescQuery = function(sorts, desc) {
   sorts[desc]=-1;
}

exports.parseParams = parseParams;
