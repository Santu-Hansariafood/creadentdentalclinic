import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CreditCard,
  CheckCircle,
  Banknote,
  ShieldCheck,
  Wallet,
  ExternalLink,
  UserCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useMutation } from "@apollo/client";
import { RECORD_INVOICE_PAYMENT } from "../graphql/mutations";
import ICICIPayment from "./ICICIPayment";

const PaymentForm = ({
  invoice,
  patient,
  onSuccess,
  onClose,
  isDemo = false,
}) => {
  const { user } = useAuth();
  const isPatientSelfServe = user?.role === "patient";

  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const amount = (invoice.balance || 0).toFixed(2);
  const [paymentMethod, setPaymentMethod] = useState(
    isPatientSelfServe ? "ICICI Bank" : "ICICI Bank",
  );
  const [showICICIPayment, setShowICICIPayment] = useState(false);
  const [recordInvoicePayment] = useMutation(RECORD_INVOICE_PAYMENT);

  if (showICICIPayment && paymentMethod === "ICICI Bank") {
    return (
      <ICICIPayment
        invoice={invoice}
        patient={patient}
        onClose={() => setShowICICIPayment(false)}
        isDemo={isDemo}
        autoInitiate={true}
        defaultPayType="1"
        onSuccess={(paymentInfo) => {
          setShowICICIPayment(false);
          setSucceeded(true);
          setTimeout(() => {
            onSuccess(paymentInfo);
          }, 1200);
        }}
      />
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (paymentMethod === "ICICI Bank") {
      setShowICICIPayment(true);
      return;
    }

    if (paymentMethod === "Cash" && isPatientSelfServe) {
      toast.error("Cash payment must be recorded by clinic staff");
      return;
    }

    setProcessing(true);
    const numericAmount = Number(invoice.balance || 0);
    const paymentDate = new Date().toISOString();
    const paymentInfo = {
      amount: numericAmount,
      paymentMethod,
      paymentDate,
    };

    try {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSucceeded(true);
        setTimeout(() => {
          onSuccess(paymentInfo);
        }, 1200);
        return;
      }

      const { data } = await recordInvoicePayment({
        variables: {
          invoiceId: invoice.id,
          amount: numericAmount,
          paymentMethod,
          paymentDate,
        },
      });

      if (data?.recordInvoicePayment) {
        setSucceeded(true);
        setTimeout(() => {
          onSuccess(paymentInfo);
        }, 1200);
      }
    } catch (err) {
      toast.error(err.message || "Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <CheckCircle size={64} className="mx-auto text-success mb-4" />
        </motion.div>
        <h3 className="font-heading text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h3>
        <p className="text-gray-600 mb-4">
          Payment of ₹{parseFloat(amount || 0).toFixed(2)} has been recorded.
        </p>
        <p className="text-sm text-gray-500">
          The invoice status has been updated.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="font-heading text-xl font-semibold text-gray-900 mb-4">
          Complete Payment
        </h3>

        {isPatientSelfServe && (
          <div className="mb-4 p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-start gap-3">
            <UserCircle size={20} className="text-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-primary">
                You are paying your own invoice
              </p>
              <p className="text-gray-600 mt-1">
                Complete your payment securely through ICICI Bank Payment Gateway.
              </p>
            </div>
          </div>
        )}

        <div className="p-4 bg-gray-50 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Invoice:</span>
            <span className="font-medium text-gray-900">
              {invoice.invoiceNumber}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Patient:</span>
            <span className="font-medium text-gray-900">
              {invoice.patientName}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Amount Due:</span>
            <span className="text-2xl font-bold text-gray-900">
              ₹{(invoice.balance || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Amount
        </label>
        <input
  type="text"
  value={`₹${(invoice.balance || 0).toFixed(2)}`}
  readOnly
  aria-readonly="true"
  className="input-field bg-gray-100 cursor-not-allowed font-semibold"
  required
/>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Payment Method
        </label>

        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod("ICICI Bank")}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              paymentMethod === "ICICI Bank"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === "ICICI Bank"
                      ? "bg-primary/15"
                      : "bg-gray-100"
                  }`}
                >
                  <CreditCard
                    size={20}
                    className={
                      paymentMethod === "ICICI Bank"
                        ? "text-primary"
                        : "text-gray-500"
                    }
                  />
                </div>
                <div>
                  <div
                    className={`font-semibold ${
                      paymentMethod === "ICICI Bank"
                        ? "text-primary"
                        : "text-gray-800"
                    }`}
                  >
                    Pay Online — ICICI Bank
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Secure payment via UPI / Cards / Net Banking on ICICI&apos;s secure portal.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck
                  size={18}
                  className={
                    paymentMethod === "ICICI Bank"
                      ? "text-success"
                      : "text-gray-400"
                  }
                />
                <ExternalLink
                  size={16}
                  className={
                    paymentMethod === "ICICI Bank"
                      ? "text-primary"
                      : "text-gray-400"
                  }
                />
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("Cash")}
            disabled={isPatientSelfServe}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              paymentMethod === "Cash"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-gray-200 hover:border-gray-300"
            } ${
              isPatientSelfServe ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === "Cash" ? "bg-primary/15" : "bg-gray-100"
                  }`}
                >
                  <Wallet
                    size={20}
                    className={
                      paymentMethod === "Cash"
                        ? "text-primary"
                        : "text-gray-500"
                    }
                  />
                </div>
                <div>
                  <div
                    className={`font-semibold ${
                      paymentMethod === "Cash" ? "text-primary" : "text-gray-800"
                    }`}
                  >
                    Cash
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isPatientSelfServe
                      ? "For staff use only"
                      : "Record an in-clinic cash payment"}
                  </p>
                </div>
              </div>
              <Banknote
                size={18}
                className={
                  paymentMethod === "Cash" ? "text-primary" : "text-gray-400"
                }
              />
            </div>
          </button>
        </div>

        {paymentMethod === "ICICI Bank" && (
          <div className="mt-4 p-3 rounded-lg border border-success/30 bg-success/5 flex items-start gap-3">
            <ShieldCheck
              size={20}
              className="text-success flex-shrink-0 mt-0.5"
            />
            <div className="text-xs">
              <p className="font-semibold text-success">
                Secure ICICI Bank Payment Gateway
              </p>
              <p className="text-gray-600 mt-1">
                You will be redirected to ICICI Bank&apos;s secure portal to complete your payment.
              </p>
            </div>
          </div>
        )}

        {paymentMethod === "Cash" && !isPatientSelfServe && (
          <div className="mt-4 p-3 rounded-lg border border-warning/30 bg-warning/5 flex items-start gap-3">
            <Wallet size={20} className="text-warning flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-warning">
                Cash payment (in-clinic)
              </p>
              <p className="text-gray-600 mt-1">
                Record this payment only after the patient has paid in cash at the clinic counter.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={processing}
          className="btn-primary flex-1"
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Processing...
            </span>
          ) : paymentMethod === "ICICI Bank" ? (
            <span className="flex items-center justify-center gap-2">
              <CreditCard size={18} />
              Continue to ICICI Bank — Pay ₹
              {parseFloat(amount || 0).toFixed(2)}
            </span>
          ) : (
            `Record Cash ₹${parseFloat(amount || 0).toFixed(2)}`
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          className="btn-outline"
        >
          Cancel
        </button>
      </div>

      <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200">
        <div className="flex gap-2">
          <CreditCard size={24} className="text-gray-400" />
          <span className="text-xs text-gray-500">Recorded in billing ledger</span>
        </div>
      </div>
    </form>
  );
};

const PaymentModal = ({
  invoice,
  patient,
  onClose,
  onSuccess,
  isDemo = false,
}) => {
  return (
    <AnimatePresence>
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
          <div className="border-b border-gray-200 p-6 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold text-gray-900">
                Complete Payment
              </h2>
              {isDemo && (
                <p className="text-xs mt-1 text-primary font-medium">
                  Demo Mode — Payment will be recorded locally
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          <div className="p-6">
            <PaymentForm
              invoice={invoice}
              patient={patient}
              onSuccess={onSuccess}
              onClose={onClose}
              isDemo={isDemo}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentModal;
