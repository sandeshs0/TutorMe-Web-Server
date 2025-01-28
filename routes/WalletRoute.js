// routes/wallet.js
const express = require("express");
const WalletController = require("../controller/WalletController");

const router = express.Router();

// Initiate transaction
router.post("/initiate", WalletController.initiateTransaction);

// Verify transaction
router.post("/verify", WalletController.verifyTransaction);

// Get wallet balance
router.get("/:studentId/balance", WalletController.getWalletBalance);

module.exports = router;
