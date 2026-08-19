const express = require("express");

const router = express.Router();

const menuController = require("../controllers/menuController");

router.get("/", menuController.getMenu);

// GET /api/menu/outlets — Returns list of active Rista POS outlets
router.get("/outlets", menuController.getOutlets);

// Debug endpoint — shows raw Rista catalog item fields to identify image field name
router.get("/debug-images", menuController.debugImages);

// Debug endpoint — shows raw Group parent + children to identify size field
router.get("/debug-variants", menuController.debugVariants);

// Debug endpoint — shows Group parent → children structure to diagnose variant linking
router.get("/debug-variants", menuController.debugVariants);

module.exports = router;
