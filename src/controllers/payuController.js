const payuService = require("../services/payuService");

/**
 * PayU Controller
 * Endpoints for Generating Hashes & Verifying Callbacks
 */

/**
 * POST /api/payment/payu-hash
 * Generates PayU payment hash & payment parameters for Client App / Storefront
 */
exports.generateHash = async (req, res) => {
  try {
    const { amount, txnid, productinfo, firstname, email, phone } = req.body;

    if (!amount || !txnid || !productinfo || !firstname || !email) {
      return res.status(400).json({
        success: false,
        error: "Missing required payment fields: amount, txnid, productinfo, firstname, email",
      });
    }

    const paymentData = payuService.generatePaymentHash({
      amount: String(amount),
      txnid: String(txnid),
      productinfo: String(productinfo),
      firstname: String(firstname),
      email: String(email),
      phone: String(phone || ""),
    });

    return res.json({
      success: true,
      data: paymentData,
    });
  } catch (err) {
    console.error("[payu-hash] Error generating hash:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to generate PayU hash",
      details: err.message,
    });
  }
};

/**
 * POST /api/payment/payu-response
 * Receives PayU payment gateway callback & verifies response signature
 */
exports.verifyResponse = async (req, res) => {
  try {
    const body = req.body;
    console.log(`[payu-response] Callback received for TXN: ${body.txnid}, Status: ${body.status}`);

    const result = payuService.verifyPaymentHash(body);

    if (!result.isValid) {
      console.warn(`[payu-response] Invalid Hash Verification for TXN: ${body.txnid}`);
      return res.status(400).json({
        success: false,
        error: "Payment hash verification failed",
        txnid: body.txnid,
      });
    }

    const isSuccess = (body.status || "").toLowerCase() === "success";

    return res.json({
      success: isSuccess,
      message: isSuccess ? "Payment verified successfully" : "Payment failed at PayU gateway",
      data: {
        txnid: body.txnid,
        amount: body.amount,
        status: body.status,
        mihpayid: body.mihpayid,
        mode: body.mode,
        unmappedstatus: body.unmappedstatus,
      },
    });
  } catch (err) {
    console.error("[payu-response] Error verifying payment:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to verify PayU payment response",
    });
  }
};
