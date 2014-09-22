// parse param and build query for each param field
knownKeys = [  
                'allProperties',
                'sortAsc',
                'sortDesc',
                'fields',
                'limit',
                'offset',
                'active',
                'updatedSince'
            ]
                    
// consumes params builds query, returns for view to exec
var parseParams = function(params, query) {

    var projections = {};
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

    // project out the _id field if any projections are set
    if (Object.keys(projections).length != 0 && projections['uuid'] != 1) {
        projections["_id"] = 0;
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
    console.log(" <<<< MY INPUTS ");
    console.log(">>> Filters " + JSON.stringify(filters));
    console.log(">>> Projections " + JSON.stringify(projections));
    console.log(">>> Sorts " + JSON.stringify(sorts));


    // Print what I actually sent
    console.log("\n <<<< MONGO INPUTS ");
    console.log("Query: Op >>", query.op, 
                "\nOptions >>", query.options, 
                "\nProjections  >>", query._fields,
                "\nFilters >>>", query._conditions);

    return query;
 
}

var badKeys = [
                '_id',
                'uuid',
                'url',
                'createdAt',
                'updatedAt'
               ];

var parseBody = function(body) {

    if (!body || Object.keys(body).length == 0) {
        return false;
    }
    // nullifiy body if it contains any of our bad keys
    if (badKeys.some(function(badKey) {
        return Boolean(body[badKey]);
    })) 
    {
        return false;
    }

    body.updatedAt = Date();
    return true;
}

// Parsing helper functions

// Limit the number of tuples to be returned
var genLimitQuery = function(params, query) {
    // XXX: Bad input defaults to off for now (eg. limit = "garbage") 
    if (params.limit == null ) {
        params.limit = 25; 
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
    // Some weird bug in mongo doesnt allow properties to be set to 0 
    // with other fields set to 1???
    if (prop == 'false' && projections == {}) {
        projections["properties"] = 0;
    } 

    // Setting to true is the default case, unless fields are set then ..,
    if (prop == 'true' && projections != {}) {
        projections["properties"] = 1;
    } 
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

   //XXX: Mongoose actually enforces the type conversion
   
   //var active = returnAsBool(active_str);
   //if (typeof active !== "boolean") {
   //    return;
   //}

   filters['active'] = active;
}

// For date based queries
var genDateQuery = function(filters, date_str) {
    var date = Date.parse(date_str);
    filters['updatedAt'] = {'$gte': date}
}

// For queries specifiying specific fields
var genAddOnsQuery = function(params, filters) {
    paramKeys = Object.keys(params);
    paramKeys.forEach(function(pkey) {
        if (knownKeys.indexOf(pkey) < 0) {
            console.log(">>> Unknown: " + pkey)
            // Determine if mult options passed, restify packages it as an array
            if (typeof params[pkey] === "string") {
                // Can only covert to bool if mongoose doesn't know about the field
                // TODO: other conversions here
                filters[pkey.replace(":", ".")] =  returnAsBool(params[pkey])
            } else {
                params[pkey].forEach(function(val, ind) {
                    // Can only covert to bool if mongoose doesn't know about the field
                    // TODO: other conversions here
                    params[pkey][ind] = returnAsBool(val);
                })

                filters[pkey.replace(":", ".")] = { '$in' : params[pkey] }
            }
        }
    });
}

var returnAsBool = function(value) {
    if (value === 'true') {
        return true;
    }

    if (value === 'false') {
        return false;
    }

    return value;
}

exports.parseParams = parseParams;
exports.parseBody = parseBody;
