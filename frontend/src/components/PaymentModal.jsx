import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, Lock, CheckCircle } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import toast from 'react-hot-toast'

const stripePromise = loadStripe('pk_test_YOUR_PUBLISHABLE_KEY')

const PaymentForm = ({ invoice, onSuccess, onClose }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [succeeded, setSucceeded] = useState(false)
  const [saveCard, setSaveCard] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)

    const cardElement = elements.getElement(CardElement)

    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (error) {
        toast.error(error.message)
        setProcessing(false)
        return
      }

      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(invoice.balance * 100),
          paymentMethodId: paymentMethod.id,
          invoiceId: invoice.id,
          saveCard
        })
      })

      const { clientSecret, error: backendError } = await response.json()

      if (backendError) {
        toast.error(backendError)
        setProcessing(false)
        return
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret)

      if (confirmError) {
        toast.error(confirmError.message)
        setProcessing(false)
        return
      }

      if (paymentIntent.status === 'succeeded') {
        setSucceeded(true)
        setTimeout(() => {
          onSuccess(paymentIntent)
        }, 2000)
      }
    } catch (err) {
      console.error('Payment error:', err)
      toast.error('Payment failed. Please try again.')
      setProcessing(false)
    }
  }

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: '#1f2937',
        fontFamily: '"Inter", sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#9ca3af'
        }
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444'
      }
    }
  }

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
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <CheckCircle size={64} className="mx-auto text-success mb-4" />
        </motion.div>
        <h3 className="font-heading text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h3>
        <p className="text-gray-600 mb-4">
          Your payment of ${invoice.balance.toFixed(2)} has been processed.
        </p>
        <p className="text-sm text-gray-500">
          Receipt has been sent to your email.
        </p>
      </motion.div>
    )
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
            <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Amount Due:</span>
            <span className="text-2xl font-bold text-gray-900">${invoice.balance.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="p-4 border-2 border-gray-300 rounded-lg focus-within:border-primary transition-colors">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Lock size={16} className="text-gray-400" />
          <span className="text-xs text-gray-500">
            Your payment information is encrypted and secure
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="saveCard"
          checked={saveCard}
          onChange={(e) => setSaveCard(e.target.checked)}
          className="rounded border-gray-300"
        />
        <label htmlFor="saveCard" className="text-sm text-gray-700">
          Save this card for future payments
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || processing}
          className="btn-primary flex-1"
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Processing...
            </span>
          ) : (
            `Pay $${invoice.balance.toFixed(2)}`
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
        <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6" />
        <div className="flex gap-2">
          <CreditCard size={24} className="text-gray-400" />
          <span className="text-xs text-gray-500">Secured by Stripe</span>
        </div>
      </div>
    </form>
  )
}

const PaymentModal = ({ invoice, onClose, onSuccess }) => {
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
            <h2 className="font-heading text-2xl font-bold text-gray-900">
              Complete Payment
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          <div className="p-6">
            <Elements stripe={stripePromise}>
              <PaymentForm
                invoice={invoice}
                onSuccess={onSuccess}
                onClose={onClose}
              />
            </Elements>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PaymentModal