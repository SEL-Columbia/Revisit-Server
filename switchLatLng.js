/**

Used to swap position of lat and lng in coordinates array.

For geoSpatial indexing in Mongo, the proper coordinate order is longitude, latitude.
 
Usage:
$ mongo < switchLatLng.js

*/

use sel;

db.facilities.find().forEach(
    function (doc) {
    	print(doc.name);
        // Add (lon, lat) pairs .. order is important
        doc.coordinates = [doc.coordinates[1], doc.coordinates[0]];

        // Save the updated document
        db.facilities.save(doc);
    }
)