const EntryDatabase = require("../models/DataBaseEntryGui");

const entryDb = new EntryDatabase();

exports.getAgvs = (req, res) => {
    entryDb.getAgvPositions(5, (agvs) => {
        res.json(agvs);
    });
};
