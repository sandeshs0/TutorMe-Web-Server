const khaltiConfig = {
    publicKey: process.env.KHALTI_PUBLIC_KEY,
    productIdentity: "student_wallet_load",
    productName: "Wallet Load",
    eventHandler: {
      onSuccess(payload) {
        
        console.log("Payment Success:", payload);
      },
      onError(error) {
        console.error("Payment Error:", error);
      },
      onClose() {
        console.log("Payment widget closed.");
      },
    },
  };
  
  export default khaltiConfig;
  