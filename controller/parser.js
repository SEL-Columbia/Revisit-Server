// local includes
var log = require('./../log/logger.js').log;

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
var parseParams = function(params, query, hidden) {

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
        hidden.uuid = 0;
        hidden.href = 0;
        field_names = params.fields.split(",");
        field_names.forEach(function(field) {
            field = field.replace(":", ".");
            log.debug(">>> Field: " + field);
            if (field == "uuid") {
                delete hidden.uuid
            } else if (field == "href") {
                delete hidden.href
            } else {
                projections[field] = 1;
            }
        });
    }

    if (params.allProperties) {
        genPropQuery(projections, params.allProperties)
    }


    // find op is set in stone by this point
    // Note: Cannot exclude and include at the same time in mongo
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

    // log.info("Parsed Params", { "filters" : filters, 
    //                             "projections": projections, 
    //                             "sorts" : sorts });


    // Print what I think I sent

    log.debug(" <<<< MY INPUTS ");
    log.debug(">>> Filters " + JSON.stringify(filters));
    log.debug(">>> Projections " + JSON.stringify(projections));
    log.debug(">>> Sorts " + JSON.stringify(sorts));
    log.debug(">>> Hidden " + JSON.stringify(hidden));

        // Print what I actually sent
    // log.debug("\n <<<< MONGO INPUTS ");
    // log.debug("Query: Op >>", query.op, 
    //             "\nOptions >>", query.options, 
    //             "\nProjections  >>", query._fields,
    //             "\nFilters >>>", query._conditions);

    return query;
 
}

var badKeys = [
                '_id',
                'uuid',
                'url',
                'createdAt',
                'id',
                'href',
                '__v',
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
            //log.debug(">>> Unknown: " + pkey)
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
exports.parseBody = parseBody;
