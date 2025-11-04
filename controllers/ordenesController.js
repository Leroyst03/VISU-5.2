const DataBaseOrdenes = require("../models/DataBaseOrdenes");

const ordenesDb = new DataBaseOrdenes();

exports.getOrdenes = (req, res) => {
    ordenesDb.getOrdenes((rows) => res.json(rows));
};
