const EntryDatabase = require("../models/DataBaseEntryGui");

const entryDb = new EntryDatabase();

exports.getAgvs = (req, res) => {
    entryDb.getAgvPositions(10, (agvs) => {
        res.json(agvs);
    });
};
