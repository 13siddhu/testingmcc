const crypto = require("crypto");

/**
 * PayU Payment Gateway Helper Service
 * Handles SHA-512 Hash Generation & Response Verification
 */

class PayuService {
  /**
   * Generates a SHA-512 Hash for PayU Payment Request
   * Sequence: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
   */
  generatePaymentHash(params) {
    const key = process.env.PAYU_KEY || "gtK2Y";
    const salt = process.env.PAYU_SALT || "eCwTWeB";

    const {
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      udf1 = "",
      udf2 = "",
      udf3 = "",
      udf4 = "",
      udf5 = "",
    } = params;

    const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;

    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    const isProduction = process.env.PAYU_MODE === "production";
    const payuUrl = isProduction
      ? "https://secure.payu.in/_payment"
      : "https://test.payu.in/_payment";

    const publicUrl = process.env.PUBLIC_URL || "https://testingmcc.vercel.app";
    const surl = process.env.PAYU_SURL || `${publicUrl}/api/payment/payu-response`;
    const furl = process.env.PAYU_FURL || `${publicUrl}/api/payment/payu-response`;

    return {
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone: params.phone || "",
      hash,
      surl,
      furl,
      payuUrl,
      hashStringDebug: process.env.NODE_ENV === "development" ? hashString : undefined,
    };
  }

  /**
   * Verifies SHA-512 Hash from PayU Response Callback
   * Reverse Sequence: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
   */
  verifyPaymentHash(body) {
    const key = process.env.PAYU_KEY || "gtK2Y";
    const salt = process.env.PAYU_SALT || "eCwTWeB";

    const {
      status,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      udf1 = "",
      udf2 = "",
      udf3 = "",
      udf4 = "",
      udf5 = "",
      hash: incomingHash,
    } = body;

    const hashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;

    const computedHash = crypto.createHash("sha512").update(hashString).digest("hex");

    const isValid = computedHash.toLowerCase() === (incomingHash || "").toLowerCase();

    return {
      isValid,
      status,
      txnid,
      amount,
      computedHash,
      incomingHash,
    };
  }
}

module.exports = new PayuService();
