const loyaltyService = require("../services/loyaltyService");

exports.getLoyalty = async (req, res) => {

    try {

        const phone = req.params.phone;

        const loyalty = await loyaltyService.getLoyalty(phone);

        res.json(loyalty);

    } catch (err) {

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

};

exports.creditPoints = async (req, res) => {

    try {

        const result = await loyaltyService.creditPoints(req.body);

        res.json(result);

    } catch (err) {

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

};

exports.debitPoints = async (req, res) => {

    try {

        const result = await loyaltyService.debitPoints(req.body);

        res.json(result);

    } catch (err) {

        res.status(500).json({

            success: false,

            error: err.message

        });

    }

};