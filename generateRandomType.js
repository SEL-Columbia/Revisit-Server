use sel;

healthTypes = ["hospital", "clinic", "urgent care", "pediatrics"];
schoolTypes = ["high school", "secondary school", "university", "junior high school", "college", "early childhood"];
powerTypes = ["power plant", "off-grid supply", "grid node"];

db.facilities.update(
    {"properties.type": "health"}, 
    { '$set': {
        "properties.type": healthTypes[Math.floor(Math.random()*4)]
    }},
    {multi: true});

db.facilities.update(
    {"properties.type": "education"}, 
    { '$set': {
        "properties.type": schoolTypes[Math.floor(Math.random()*6)]
    }},
    {multi: true});

db.facilities.update(
    {"properties.type": "power"}, 
    { '$set': {
        "properties.type": powerTypes[Math.floor(Math.random()*3)]
    }},
    {multi: true});

//db.facilities.find({"properties.type": "health"});