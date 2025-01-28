const Transaction = require("../model/Transaction");
const Student = require("../model/student");
const axios = require("axios");
const KHALTI_SECRET = process.env.KHALTI_SECRET_KEY;

const WalletController = {
  // Initiate a transaction
  async initiateTransaction(req, res) {
    const { studentId, amount, paymentGateway } = req.body;

    try {
      // Create a new transaction
      const transaction = new Transaction({
        studentId,
        amount,
        paymentGateway,
        transactionId: `txn_${Date.now()}`, // Generate a unique transaction ID
      });

      await transaction.save();

      res.status(201).json({
        success: true,
        message: "Transaction initiated successfully",
        transactionId: transaction.transactionId,
      });
    } catch (err) {
      console.error("Error initiating transaction:", err.message);
      res.status(500).json({
        success: false,
        message: "Failed to initiate transaction",
      });
    }
  },

  // Verify a transaction
  async verifyTransaction(req, res) {
    const { transactionId, token } = req.body;

    try {
      // Fetch the transaction
      const transaction = await Transaction.findOne({ transactionId });

      if (!transaction || transaction.status !== "pending") {
        return res.status(404).json({
          success: false,
          message: "Transaction not found or already processed",
        });
      }

      // Verify the transaction with Khalti
      const response = await axios.post(
        "https://khalti.com/api/v2/payment/verify/",
        {
          token,
          amount: transaction.amount * 100, // Amount in paisa
        },
        {
          headers: {
            Authorization: `Key ${KHALTI_SECRET}`, 
        },
        }
      );

      if (response.data.state.name === "Completed") {
        // Update the transaction status to success
        transaction.status = "success";
        await transaction.save();

        // Increment the student's wallet balance
        await Student.findByIdAndUpdate(transaction.studentId, {
          $inc: { walletBalance: transaction.amount },
        });

        return res.status(200).json({
          success: true,
          message: "Transaction verified successfully, wallet updated",
        });
      } else {
        throw new Error("Transaction verification failed");
      }
    } catch (err) {
      console.error("Error verifying transaction:", err.message);

      // Update transaction status to failed
      await Transaction.findOneAndUpdate(
        { transactionId },
        { status: "failed" }
      );

      res.status(500).json({
        success: false,
        message: "Transaction verification failed",
      });
    }
  },

  // Fetch wallet balance
  async getWalletBalance(req, res) {
    const { studentId } = req.params;

    try {
      // Fetch the student's wallet balance
      const student = await Student.findById(studentId);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }

      res.status(200).json({
        success: true,
        walletBalance: student.walletBalance,
      });
    } catch (err) {
      console.error("Error fetching wallet balance:", err.message);
      res.status(500).json({
        success: false,
        message: "Failed to fetch wallet balance",
      });
    }
  },
};

module.exports = WalletController;
