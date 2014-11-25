var SiteModel = require('../domain/model/site'),
    UserModel = require('../domain/model/user'),
    responses = require('../view/responses');

/**
 * Sends a JSON response object containing basic stats about the API: 
 *
 * {
 *		users: 2,
 *		sites: 265314,
 *		visits: 265330,
 *		lastUpdate: "2014-11-06T14:46:13.000Z"
 * }
 *
 */
function stats(req, res, next) {
    var statsObj = {};
    var showDeleted = typeof req.params.showDeleted === 'string';
    UserModel.count({}, function(err, count) {
        if (err) {
            req.log.error(err);
            return next(new restify.ResourceNotFoundError(JSON.stringify(err)));
        }

        statsObj.users = count;

        var query = getStatsQuery(showDeleted);
        
        query.exec(function(err, results) {
            if (err) {
                req.log.error(err);
                return next(new restify.ResourceNotFoundError(JSON.stringify(err)));
            }

            // if no results found, set all to 0 / null and return.
            if (results.length < 1) {
            	statsObj.sites = 0;
            	statsObj.visits = 0;
            	statsObj.lastUpdate = null;
	            responses.jsonReply(res, statsObj, 200);
            	return next();
            }

        	statsObj.sites = results[0].sites;
        	statsObj.visits = results[0].visits;

            SiteModel.find().limit(1).sort({'updatedAt': -1}).exec(function(err, results) {
            	if (err) {
	                req.log.error(err);
	                return next(new restify.ResourceNotFoundError(JSON.stringify(err)));
	            }

	            statsObj.lastUpdate = results[0].updatedAt;
	            responses.jsonReply(res, statsObj, 200);

	            return next();
            });

        });

    });

}

function getStatsQuery(showDeleted) {;

    if (showDeleted) {
        return SiteModel.aggregate([{
            $group: {
                _id: null,
                sites: {
                    $sum: 1
                },
                visits: {
                    $sum: '$properties.visits'
                }
            }
        }]);
    }   

    return SiteModel.aggregate([{
        $match: {
           $or : [
               {_deleted: {$exists: false}}, 
               {_deleted: false}
           ] 
        } },
        { $group: {
           _id: null,
           sites: {
               $sum: 1
           },
           visits: {
               $sum: '$properties.visits'
           }
        }
    }]);
}

exports.stats = stats;
