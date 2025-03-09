const { solar } = require("googleapis/build/src/apis/solar");
const Transaction = require("../model/Transaction");
const Student = require("../model/student");
const axios = require("axios");
const { sendNotification } = require("../utils/notifications");
const KHALTI_SECRET = process.env.KHALTI_SECRET_KEY;
const KHALTI_PUBLIC = process.env.KHALTI_PUBLIC_KEY;

const WalletController = {
  async initiateTransaction(req, res) {
    console.log("Initiating transaction");
    const { amount, paymentGateway } = req.body;
    const userId = req.user.id;

    const student = await Student.findOne({ userId });
    studentId = student._id;
    try {
      if (!studentId || !amount) {
        return res.status(400).json({
          success: false,
          message: "Student ID and amount are required.",
        });
      }
      const purchase_order_id = `order_${Date.now()}`;
      const purchase_order_name = "Wallet Load";
      // Create a new transaction
      const transaction = new Transaction({
        studentId,
        amount,
        paymentGateway,
        transactionId: purchase_order_id, // Generate a unique transaction ID
        status: "pending",
      });
      console.log(transaction);
      await transaction.save();
      console.log(KHALTI_PUBLIC);
      console.log(KHALTI_SECRET);
      //   Request to Khalti
      //   const khaltiResponse = await axios.post(
      //     "https://dev.khalti.com/api/v2/epayment/initiate/",
      //     {
      //       return_url: "http://localhost:5173/account-center", // Replace with your return URL
      //       website_url: "http://localhost:5173",
      //       amount: amount * 100, // Convert amount to paisa
      //       purchase_order_id,
      //       purchase_order_name,
      //     },
      //     {
      //       headers: {
      //         Authorization: `key ${KHALTI_PUBLIC}`, // Replace with your PUBLIC KEY
      //       },
      //     }
      //   );
      console.log(typeof amount);
      const khaltiResponse = await axios.post(
        "https://dev.khalti.com/api/v2/epayment/initiate/",
        {
          return_url: "http://localhost:5173/payment-callback",
          website_url: "http://localhost:5173",
          amount: amount * 100,

          purchase_order_id,
          purchase_order_name,
        },
        {
          headers: {
            Authorization: `Key ${KHALTI_SECRET}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("khalti says:(init)", khaltiResponse);
      console.log("khalti says (init):", khaltiResponse.body);

      const { pidx, payment_url } = khaltiResponse.data;
      console.log("khalti says(init):", khaltiResponse.data);
      res.status(201).json({
        success: true,
        pidx,
        payment_url,
        // message: "Transaction initiated successfully",
        transactionId: purchase_order_id,
      });
    } catch (err) {
      console.error("Error initiating transaction:", err.message);
      res.status(500).json({
        success: false,
        message: "Failed to initiate transaction",
        error: err.response?.data || err.message,
      });
    }
  },

  async verifyTransaction(req, res) {
    console.log("Verifying transaction");
    const { pidx, transaction_id } = req.body;

    try {
      console.log(
        "Tyring to hit the khalti/lookup with token:",
        pidx,
        typeof pidx,
        transaction_id
      );
      // Verify the transaction with Khalti
      const khaltiResponse = await axios.post(
        "https://dev.khalti.com/api/v2/epayment/lookup/",
        {
          pidx: pidx,
        },
        {
          headers: {
            Authorization: `Key ${KHALTI_PUBLIC}`,
          },
        }
      );
      const { status, total_amount } = khaltiResponse.data;
      console.log("khalti says (verify):", khaltiResponse.data);
      if (status === "Completed" || status === "Pending") {
        // Update the transaction status to success
        const transaction = await Transaction.findOne({
          transactionId: transaction_id,
        });
        if (!transaction || transaction.status !== "pending") {
          return res.status(404).json({
            success: false,
            message: "Transaction not found or already processed",
          });
        }

        transaction.status = "success";
        await transaction.save();

        await Student.findByIdAndUpdate(transaction.studentId, {
          $inc: { walletBalance: total_amount / 100 },
        });
        studentOb = await Student.findById(transaction.studentId).select(
          "userId walletBalance"
        );
        sendNotification(
          studentOb.userId,
          `Your tutorMe Wallet has been credited by Rs.${
            total_amount / 100
          }. New Balance: ${studentOb.walletBalance}`,
          "payment"
        );
        return res.status(200).json({
          success: true,
          message: "Transaction verified successfully, wallet updated",
        });
      } else {
        await Transaction.findOneAndUpdate(
          { transactionId: transaction_id },
          { status: "failed" }
        );

        return res.status(400).json({
          success: false,
          message: `Transaction Verification failed, ${status}`,
        });
      }
    } catch (err) {
      console.error("Error verifying transaction:", err.message);

      res.status(500).json({
        success: false,
        message: "Transaction verification failed",
      });
    }
  },
  async getWalletBalance(req, res) {
    // const { studentId } = req.params;

    try {
      const userId = req.user.id;

      const student = await Student.findOne({ userId });

      // const student = await Student.findById(studentId);

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

  async getTransactions(req, res) {
    const userId = req.user.id;

    try {
      const student = await Student.findOne({ userId });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found.",
        });
      }

      const transactions = await Transaction.find({
        studentId: student._id,
        status: "success",
      })
        .select("paymentDate paymentGateway amount")
        .sort({ paymentDate: -1 });

      if (!transactions.length) {
        return res.status(404).json({
          success: false,
          message: "No successful transactions found.",
        });
      }

      res.status(200).json({
        success: true,
        walletBalance: student.walletBalance,
        transactions,
      });
    } catch (err) {
      console.error("Error fetching transaction history:", err.message);
      res.status(500).json({
        success: false,
        message: "Failed to fetch transaction history",
      });
    }
  },
};

module.exports = WalletController;
