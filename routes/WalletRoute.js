// routes/wallet.js
const express = require("express");
const WalletController = require("../controller/WalletController");
const { authenticateToken } = require("../security/Auth");

const router = express.Router();

// Initiate transaction
router.post("/initiate", WalletController.initiateTransaction);

// Verify transaction
router.post("/verify", WalletController.verifyTransaction);

// Get wallet balance
router.get("/:studentId/balance", WalletController.getWalletBalance);

router.get(
  "/history",
  authenticateToken,
  WalletController.getTransactions
);

module.exports = router;
