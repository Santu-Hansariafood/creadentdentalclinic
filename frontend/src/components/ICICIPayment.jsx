import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Banknote,
  Smartphone,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import { useMutation } from "@apollo/client";
import {
  ICICI_INITIATE_SALE,
  ICICI_GENERATE_OTP,
  ICICI_VERIFY_OTP,
  ICICI_AUTHORIZE,
  ICICI_GET_TRANSACTION_STATUS,
} from "../graphql/mutations";
import { generateInvoicePDF } from "../utils/pdfGenerator";

const STATUS_LABELS = {
  SUC: { label: "Success", color: "text-success", bg: "bg-success/10" },
  REJ: { label: "Rejected", color: "text-red-600", bg: "bg-red-50" },
  ERR: { label: "Error", color: "text-red-600", bg: "bg-red-50" },
  REQ: { label: "Requested", color: "text-blue-600", bg: "bg-blue-50" },
  PENDING: { label: "Pending", color: "text-warning", bg: "bg-warning/10" },
  INITIATED: { label: "Initiated", color: "text-blue-600", bg: "bg-blue-50" },
};

const ICICIPayment = ({
  invoice,
  patient,
  onClose,
  onSuccess,
  isDemo = false,
  defaultPayType = "0",
  autoInitiate = false,
}) => {
  const [step, setStep] = useState("init");
  const amount = Number(invoice.balance || 0).toFixed(2);
  const [payType] = useState(defaultPayType || "0");
  const [transactionId, setTransactionId] = useState(null);
  const [merchantTxnNo, setMerchantTxnNo] = useState("");
  const [tranCtx, setTranCtx] = useState("");
  const [redirectURI, setRedirectURI] = useState("");
  const [showOTPCapturePage, setShowOTPCapturePage] = useState("N");
  const [pgTxnNo, setPgTxnNo] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [txnStatus, setTxnStatus] = useState("INITIATED");
  const [txnResponseMsg, setTxnResponseMsg] = useState("");
  const [statusPollCount, setStatusPollCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [initiateSale] = useMutation(ICICI_INITIATE_SALE);
  const [generateOTP] = useMutation(ICICI_GENERATE_OTP);
  const [verifyOTP] = useMutation(ICICI_VERIFY_OTP);
  const [authorizeTxn] = useMutation(ICICI_AUTHORIZE);
  const [getStatus] = useMutation(ICICI_GET_TRANSACTION_STATUS);

  const numericAmount = Number(invoice.balance || 0);

  const handleInitiateSale = async () => {
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Invalid invoice balance");
      return;
    }

    setProcessing(true);
    setErrorMsg("");
    try {
      const { data } = await initiateSale({
        variables: {
          invoiceId: invoice.id,
          patientId: patient?.id || invoice.patientId,
          amount: numericAmount,
          customerEmailID: patient?.email || invoice.patientEmail || undefined,
          customerMobileNo: patient?.phone || invoice.patientPhone || undefined,
          payType,
        },
      });

      const result = data?.iciciInitiateSale;
      if (!result) throw new Error("No response from server");

      setTransactionId(result.transactionId);
      setMerchantTxnNo(result.merchantTxnNo || "");
      setTranCtx(result.tranCtx || "");
      setRedirectURI(result.redirectURI || "");
      setShowOTPCapturePage(result.showOTPCapturePage || "N");
      setPgTxnNo(result.pgTxnNo || "");
      setTxnStatus(result.txnStatus || "INITIATED");
      setTxnResponseMsg(result.txnResponseMsg || "");

      console.log("[Payment] Initiate Sale Response:", {
        transactionId: result.transactionId,
        redirectURI: result.redirectURI,
        apiSuccess: result.apiSuccess,
        apiError: result.apiError,
        txnStatus: result.txnStatus,
      });

      if (!result.apiSuccess) {
        const errorMsg = result.apiError
          ? typeof result.apiError === "string"
            ? result.apiError
            : JSON.stringify(result.apiError)
          : "Failed to initiate payment";
        setErrorMsg(errorMsg);
        toast.error(errorMsg);
        setProcessing(false);
        return;
      }

      if (result.txnStatus === "REJ" || result.txnStatus === "ERR") {
        const errorMsg =
          result.txnResponseMsg ||
          result.apiError ||
          "ICICI rejected the payment";
        setErrorMsg(errorMsg);
        toast.error(errorMsg);
        setProcessing(false);
        return;
      }

      const otpFlowAvailable =
        payType === "1" || result.showOTPCapturePage === "Y";

      if (!result.redirectURI && !otpFlowAvailable) {
        const errorMsg =
          "ICICI API did not return redirect URL. " +
          (result.apiError
            ? `Server error: ${typeof result.apiError === "string" ? result.apiError : "Check console"}`
            : "Please try again");
        setErrorMsg(errorMsg);
        toast.error(errorMsg);
        setProcessing(false);
        console.error("[Payment] No redirectURI in response:", result);
        return;
      }

      const shouldAutoRedirect =
        payType === "0" &&
        result.redirectURI &&
        (result.showOTPCapturePage === "N" || !result.showOTPCapturePage);

      if (shouldAutoRedirect) {
        setProcessing(false);
        setTimeout(
          () => handleRedirectFlow(result.redirectURI, result.tranCtx),
          300,
        );
      } else {
        setStep("choose");
        setProcessing(false);
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to initiate payment");
      toast.error(err.message || "Failed to initiate payment");
      setProcessing(false);
    }
  };

  const handleRedirectFlow = (redirectUrl = redirectURI, context = tranCtx) => {
    if (!redirectUrl) {
      toast.error("Redirect URL not available");
      return;
    }

    const finalRedirectUrl = (() => {
      if (!context) return redirectUrl;
      const separator = redirectUrl.includes("?") ? "&" : "?";
      const hasTranCtx = /(?:^|[?&])tranCtx=/.test(redirectUrl);
      return hasTranCtx
        ? redirectUrl
        : `${redirectUrl}${separator}tranCtx=${encodeURIComponent(context)}`;
    })();

    console.log("[Payment] Redirecting browser to ICICI authRedirect:", {
      url: finalRedirectUrl,
      tranCtx: context ? "***" : "not provided",
    });

    setStep("redirect-wait");
    window.location.href = finalRedirectUrl;
  };

  const handleGenerateOTP = async () => {
    setOtpVerifying(true);
    setErrorMsg("");
    try {
      const { data } = await generateOTP({
        variables: { transactionId, tranCtx },
      });

      if (data?.iciciGenerateOTP?.success) {
        setOtpSent(true);
        setStep("otp-entry");
        toast.success("OTP has been sent to your registered mobile number");
      } else {
        throw new Error(
          data?.iciciGenerateOTP?.error || "Failed to generate OTP",
        );
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to generate OTP");
      toast.error(err.message || "Failed to generate OTP");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpValue || otpValue.length < 4) {
      toast.error("Please enter a valid OTP");
      return;
    }

    setOtpVerifying(true);
    setErrorMsg("");
    try {
      const { data } = await verifyOTP({
        variables: { transactionId, tranCtx, otpValue },
      });

      if (data?.iciciVerifyOTP?.success) {
        setStep("authorize");
        toast.success("OTP verified. Authorizing payment...");
        handleAuthorize();
      } else {
        throw new Error(
          data?.iciciVerifyOTP?.error || "OTP verification failed",
        );
      }
    } catch (err) {
      setErrorMsg(err.message || "OTP verification failed");
      toast.error(err.message || "OTP verification failed");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleAuthorize = async () => {
    setProcessing(true);
    setErrorMsg("");
    try {
      const { data } = await authorizeTxn({
        variables: { transactionId, tranCtx },
      });

      if (data?.iciciAuthorize?.success) {
        const raw = data.iciciAuthorize.data
          ? JSON.parse(data.iciciAuthorize.data)
          : {};
        const newStatus = raw.txnStatus || txnStatus;
        setTxnStatus(newStatus);
        setTxnResponseMsg(raw.txnResponseMsg || "");

        if (newStatus === "SUC") {
          handlePaymentSuccess();
        } else {
          setStep("status");
          setTxnStatus(newStatus);
        }
      } else {
        throw new Error(data?.iciciAuthorize?.error || "Authorization failed");
      }
    } catch (err) {
      setErrorMsg(err.message || "Authorization failed");
      toast.error(err.message || "Authorization failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckStatus = async () => {
    setProcessing(true);
    setErrorMsg("");
    try {
      const { data } = await getStatus({ variables: { transactionId } });
      const result = data?.iciciGetTransactionStatus;
      if (result?.success) {
        const newStatus = result.transaction?.txnStatus || txnStatus;
        setTxnStatus(newStatus);
        setStatusPollCount((c) => c + 1);

        // ⚠️  CRITICAL: DO NOT mark as success during redirect flow
        // Wait for ICICI callback to actually be received and processed
        // Only log status updates during polling
        if (newStatus === "REJ" || newStatus === "ERR") {
          setStep("status");
          toast.error(
            "Payment " + (STATUS_LABELS[newStatus]?.label || "failed"),
          );
        } else if (newStatus !== "REQ" && newStatus !== "INITIATED") {
          console.log(
            "[Payment] Status update:",
            newStatus,
            "(awaiting ICICI callback confirmation)",
          );
        }
      } else {
        throw new Error(result?.error || "Status check failed");
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to check status");
      toast.error(err.message || "Failed to check status");
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    setStep("success");
    toast.success("Payment completed successfully!");
  };

  const paymentInfo = {
    amount: numericAmount,
    paymentMethod: "ICICI Bank",
    paymentDate: new Date().toISOString(),
    transactionId,
    merchantTxnNo,
    pgTxnNo,
    txnStatus: "SUC",
  };

  const paidInvoice = {
    ...invoice,
    amountPaid: Number(invoice.amountPaid || 0) + numericAmount,
    balance: 0,
    status: "Paid",
    paymentMethod: "ICICI Bank",
    paymentDate: paymentInfo.paymentDate,
    transactionId,
    merchantTxnNo,
    pgTxnNo,
  };

  useEffect(() => {
    if (autoInitiate && step === "init" && !processing && !errorMsg) {
      handleInitiateSale();
    }
  }, [autoInitiate, step, processing, errorMsg]);

  useEffect(() => {
    if (step !== "redirect-wait" || !transactionId || isDemo) return;

    const maxPolls = 120;
    const poll = setInterval(() => {
      if (statusPollCount >= maxPolls) {
        clearInterval(poll);
        setErrorMsg(
          "Payment verification timeout. Please check your email for confirmation.",
        );
        toast.error("Payment verification timeout");
        return;
      }
      handleCheckStatus();
    }, 5000);
    return () => clearInterval(poll);
  }, [step, transactionId, statusPollCount, isDemo]);

  const statusInfo = STATUS_LABELS[txnStatus] || {
    label: txnStatus,
    color: "text-gray-600",
    bg: "bg-gray-100",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mx-auto w-full max-w-3xl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="rounded-2xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="border-b border-gray-200 bg-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-gray-900">
                Pay via ICICI Bank
              </h2>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Banknote size={12} />
                Secure Payment Gateway
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {step === "init" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Invoice</span>
                  <span className="font-medium text-gray-900">
                    {invoice.invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Patient</span>
                  <span className="font-medium text-gray-900">
                    {invoice.patientName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount Due</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ₹{(invoice.balance || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount
                </label>
                <input
                  type="text"
                  value={`₹${numericAmount.toFixed(2)}`}
                  readOnly
                  aria-readonly="true"
                  className="input-field bg-gray-100 cursor-not-allowed font-semibold"
                  required
                />
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={20}
                    className="text-primary flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      Secure ICICI Bank checkout
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Payment will be completed securely inside this page using
                      the OTP sent to your registered mobile number.
                    </p>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle
                    size={18}
                    className="text-red-600 flex-shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-red-700">{errorMsg}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleInitiateSale}
                disabled={processing || !numericAmount}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Initiating Payment...
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    Initiate Payment ₹{numericAmount.toFixed(2)}
                  </>
                )}
              </button>
            </motion.div>
          )}

          {step === "choose" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div
                className={`p-4 rounded-lg ${statusInfo.bg} border border-opacity-20`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${statusInfo.color}`}>
                    Status: {statusInfo.label}
                  </span>
                  {transactionId && (
                    <span
                      className="text-xs text-gray-500 truncate max-w-[200px]"
                      title={transactionId}
                    >
                      Txn: {transactionId.slice(-10)}
                    </span>
                  )}
                </div>
                {txnResponseMsg && (
                  <p className="text-xs text-gray-600 mt-1">{txnResponseMsg}</p>
                )}
              </div>

              <div className="space-y-3">
                {!isDemo ? (
                  <button
                    type="button"
                    onClick={handleGenerateOTP}
                    disabled={otpVerifying}
                    className="w-full p-5 rounded-xl border-2 border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Smartphone size={20} className="text-primary" />
                          Pay via OTP
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Receive an OTP on the registered mobile number, then complete payment here
                        </p>
                      </div>
                      <ArrowRight size={20} className="text-primary" />
                    </div>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleCheckStatus}
                  disabled={processing}
                  className="w-full p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw
                      size={18}
                      className={
                        processing
                          ? "animate-spin text-primary"
                          : "text-gray-500"
                      }
                    />
                    <span className="font-medium text-gray-700">
                      Check Payment Status
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {STATUS_LABELS[txnStatus]?.label || txnStatus}
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {step === "redirect-wait" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8 space-y-6"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">
                  {isDemo
                    ? "Simulating Redirect..."
                    : "Redirecting to ICICI Bank..."}
                </h3>
                <p className="text-gray-600 text-sm">
                  {isDemo
                    ? "This is a demo redirect simulation. Awaiting simulated callback..."
                    : "Do not close this window. You will be redirected back after payment."}
                </p>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Transaction Ref: {transactionId?.slice(-12)}</p>
                <p>Amount: ₹{numericAmount.toFixed(2)}</p>
              </div>
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={processing}
                className="btn-outline text-sm"
              >
                {processing ? "Checking..." : "I've Completed Payment"}
              </button>
            </motion.div>
          )}

          {step === "otp-entry" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Smartphone size={32} className="text-primary" />
                </div>
                <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">
                  Enter OTP
                </h3>
                <p className="text-gray-600 text-sm">
                  {isDemo
                    ? "Demo: Enter 123456 as OTP"
                    : "Please enter the OTP sent to your registered mobile number"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  One-Time Password
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="Enter OTP"
                  value={otpValue}
                  onChange={(e) =>
                    setOtpValue(e.target.value.replace(/\D/g, ""))
                  }
                  className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleGenerateOTP}
                  disabled={otpVerifying}
                  className="text-primary hover:underline disabled:opacity-50"
                >
                  Resend OTP
                </button>
                <span className="text-gray-500">
                  Txn: {transactionId?.slice(-8)}
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle
                    size={18}
                    className="text-red-600 flex-shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-red-700">{errorMsg}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleVerifyOTP}
                disabled={otpVerifying || !otpValue}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {otpVerifying ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Verifying OTP...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    Verify & Pay ₹{numericAmount.toFixed(2)}
                  </>
                )}
              </button>
            </motion.div>
          )}

          {step === "authorize" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8 space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-yellow-100 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-warning" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">
                  Authorizing Payment
                </h3>
                <p className="text-gray-600 text-sm">
                  Please wait while we confirm your payment with ICICI Bank...
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-gray-500 px-3 py-1 bg-gray-50 rounded-full">
                <RefreshCw size={12} className="animate-spin" />
                Amount: ₹{numericAmount.toFixed(2)}
              </div>
            </motion.div>
          )}

          {step === "status" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div
                className={`p-5 rounded-xl ${statusInfo.bg} border border-opacity-20`}
              >
                <div className="flex items-start gap-3">
                  {txnStatus === "SUC" ? (
                    <CheckCircle
                      size={28}
                      className="text-success flex-shrink-0"
                    />
                  ) : (
                    <AlertCircle
                      size={28}
                      className={`${statusInfo.color} flex-shrink-0`}
                    />
                  )}
                  <div className="flex-1">
                    <h3
                      className={`font-heading text-lg font-bold ${statusInfo.color}`}
                    >
                      Payment {statusInfo.label}
                    </h3>
                    {txnResponseMsg && (
                      <p className="text-sm text-gray-700 mt-1">
                        {txnResponseMsg}
                      </p>
                    )}
                    <div className="mt-3 text-xs text-gray-600 space-y-1">
                      <p>Amount: ₹{numericAmount.toFixed(2)}</p>
                      {transactionId && <p>Txn ID: {transactionId}</p>}
                      {pgTxnNo && <p>PG Txn: {pgTxnNo}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {txnStatus !== "SUC" && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCheckStatus}
                    disabled={processing}
                    className="btn-outline flex-1 flex items-center justify-center gap-2"
                  >
                    <RefreshCw
                      size={18}
                      className={processing ? "animate-spin" : ""}
                    />
                    Check Again
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("init")}
                    className="btn-primary flex-1"
                  >
                    Retry Payment
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <CheckCircle size={72} className="mx-auto text-success mb-4" />
              </motion.div>
              <h3 className="font-heading text-2xl font-bold text-gray-900 mb-2">
                Payment Successful!
              </h3>
              <p className="text-gray-600">
                Payment of{" "}
                <span className="font-bold text-gray-900">
                  ₹{numericAmount.toFixed(2)}
                </span>{" "}
                has been processed via ICICI Bank.
              </p>
              <div className="max-w-sm mx-auto p-4 bg-gray-50 rounded-lg text-left text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Invoice</span>
                  <span className="font-medium">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Method</span>
                  <span className="font-medium">ICICI Bank</span>
                </div>
                {transactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Txn Ref</span>
                    <span className="font-mono text-xs">
                      {transactionId.slice(-16)}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Your receipt is ready to download.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto pt-2">
                <button
                  type="button"
                  onClick={() => {
                    generateInvoicePDF(paidInvoice);
                    toast.success("Receipt downloaded successfully");
                  }}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Download Receipt
                </button>
                <button
                  type="button"
                  onClick={() => onSuccess?.(paymentInfo)}
                  className="btn-outline flex-1"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex items-center justify-center gap-2 text-xs text-gray-500 bg-gray-50">
          <ShieldCheck size={14} className="text-green-600" />
          Payments secured with ICICI Bank Payment Gateway
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ICICIPayment;
