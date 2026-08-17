import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useMutation } from "@apollo/client";
import { RECORD_INVOICE_PAYMENT } from "../graphql/mutations";

const paymentMethodOptions = [
  "Cash",
  "UPI",
  "Card",
  "Bank Transfer",
  "Insurance",
];

const PaymentForm = ({ invoice, onSuccess, onClose, isDemo = false }) => {
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [amount, setAmount] = useState(invoice.balance?.toFixed(2) || "0.00");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [recordInvoicePayment] = useMutation(RECORD_INVOICE_PAYMENT);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setProcessing(true);
    const numericAmount = parseFloat(amount);
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
          Payment of Rs {parseFloat(amount || 0).toFixed(2)} has been recorded.
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
          Payment Details
        </h3>
        <div className="p-4 bg-gray-50 rounded-lg mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Invoice:</span>
            <span className="font-medium text-gray-900">
              {invoice.invoiceNumber}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Amount Due:</span>
            <span className="text-2xl font-bold text-gray-900">
              Rs {invoice.balance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Amount
        </label>
        <input
          type="number"
          min="0.01"
          max={invoice.balance}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input-field"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="input-field"
        >
          {paymentMethodOptions.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-2">
          Use this to record a full or partial payment immediately.
        </p>
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
          ) : (
            `Pay Rs ${parseFloat(amount || 0).toFixed(2)}`
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
          <span className="text-xs text-gray-500">Recorded in billing</span>
        </div>
      </div>
    </form>
  );
};

const PaymentModal = ({ invoice, onClose, onSuccess, isDemo = false }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
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
