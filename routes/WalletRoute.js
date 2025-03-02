const express = require("express");
const WalletController = require("../controller/WalletController");
const { authenticateToken } = require("../security/Auth");

const router = express.Router();

router.post(
  "/initiate",
  authenticateToken,
  WalletController.initiateTransaction
);

router.post("/verify", WalletController.verifyTransaction);

router.get("/balance", authenticateToken, WalletController.getWalletBalance);

router.get("/history", authenticateToken, WalletController.getTransactions);

module.exports = router;
