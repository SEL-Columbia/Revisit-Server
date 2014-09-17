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

    var projections = {"_id":0};
    var filters = {};
    var sorts = {};

    // filters
    if (params.active) {
        genActiveQuery(filters, params.active)
    }
    
    if (params.updatedSince) {
        genDateQuery(filters, params.updatedSince)
    }

    // add ons
    genAddOnsQuery(params, filters);

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

    // Add in limits
    query = genLimitQuery(params, query);

    // Print what I think I sent
    console.log(">>> Filters " + JSON.stringify(filters));
    console.log(">>> Projections " + JSON.stringify(projections));
    console.log(">>> Sorts " + JSON.stringify(sorts));


    // Print what I actually sent
    console.log("\nQuery: Op >>", query.op, 
                "\nOptions >>", query.options, 
                "\nProjections  >>", query._fields,
                "\nFilters >>>", query._conditions)

    return query
 
}


// Limit the number of tuples to be returned
var genLimitQuery = function(params, query) {
    if (params.limit == null) {
        params.limit = 5; // should be 25
    } else if (params.limit == "off") {
        params.limit = 0;
    } 

    if (params.offset == null) {
        params.offset = 0;
    } 

    return query.skip(params.offset).limit(params.limit)  
}

// Include or not include properties
var genPropQuery = function(projections, prop) {
    if (prop == 'false') {
        projections["properties"] = 0;
    } 
    // Setting to true is the default case
}

// Sorting by a specific field
var genAscQuery = function(sorts, asc) {
   sorts[asc]=1;
}

var genDescQuery = function(sorts, desc) {
   sorts[desc]=-1;
}

// For active queries (require boolean values)
var genActiveQuery = function(filters, active) {
   if (active == 'true') {
       filters['active']=true;
   } else if (active == 'false') {
       filters['active']=false;
   }
}

// For date based queries
var genDateQuery = function(filters, date_str) {
    var date = Date.parse(date_str);
    console.log(date);
    console.log(">>> Date in: " + date_str)
    filters['updatedAt'] = date;
}

// For queries specifiying specific fields
var genAddOnsQuery = function(params, filters) {
    paramKeys = Object.keys(params);
    paramKeys.forEach(function(pkey) {
        if (known_keys.indexOf(pkey) < 0) {
            console.log(">>> Unknown: " + pkey)
            // Determine if mult options passed, restify packages it as an array
            if (typeof params[pkey] === "string") {
                filters[pkey.replace(":", ".")] =  params[pkey]
            } else {
                filters[pkey.replace(":", ".")] = { '$in' : params[pkey] }
            }
        }
    });


}

exports.parseParams = parseParams;
