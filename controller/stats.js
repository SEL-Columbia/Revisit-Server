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
    UserModel.count({}, function(err, count) {
        if (err) {
            req.log.error(err);
            return next(new restify.ResourceNotFoundError(JSON.stringify(err)));
        }
        statsObj.users = count;

        SiteModel.aggregate([{
            $group: {
                _id: null,
                lastUpdate: {
                	$max: '$updatedAt'
                },
                sites: {
                    $sum: 1
                },
                visits: {
                    $sum: '$properties.visits'
                }
            }
        }], function(err, results) {
            if (err) {
                req.log.error(err);
                return next(new restify.ResourceNotFoundError(JSON.stringify(err)));
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

exports.stats = stats;
