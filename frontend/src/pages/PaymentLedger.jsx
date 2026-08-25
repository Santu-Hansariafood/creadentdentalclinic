import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Activity,
  Calendar,
  FileText,
  CreditCard,
  Hash,
  IndianRupee,
} from "lucide-react";
import { fadeIn } from "../utils/motion";
import { useQuery } from "@apollo/client";
import { GET_PAYMENT_LEDGERS } from "../graphql/queries";
import { formatDate } from "../utils/dateUtils";
import Pagination from "../components/Pagination";
import Preloader from "../components/Preloader";

const PaymentLedger = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { loading, error, data } = useQuery(GET_PAYMENT_LEDGERS, {
    variables: { page, limit, search: searchTerm },
  });

  if (loading) return <Preloader />;
  if (error)
    return (
      <div className="p-6 text-center text-red-500">Error: {error.message}</div>
    );

  const {
    paymentLedgers = [],
    totalPages = 1,
    totalPayment = 0,
    dateWiseTotals = [],
  } = data?.getPaymentLedgers || {};

  const filteredLedgers = paymentLedgers;

  return (
    <Suspense fallback={<Preloader />}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <motion.div {...fadeIn("down")} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2">
                Payment Ledger MIS
              </h1>
              <p className="text-gray-600">
                Track payments and dues by Treatment Name
              </p>
            </div>
            <button className="btn-primary flex items-center gap-2 self-start md:self-center">
              <Plus size={20} />
              Add Entry
            </button>
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search treatment, mode, or reference..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-green-100 bg-green-50 p-4">
            <p className="text-xs text-green-700">Total payment</p>
            <p className="text-xl font-bold text-green-800">
              ₹{totalPayment.toLocaleString()}
            </p>
          </div>
          {dateWiseTotals.slice(0, 3).map(({ date, amount }) => (
            <div
              key={date}
              className="rounded-xl border border-gray-100 bg-white p-4"
            >
              <p className="text-xs text-gray-500">{formatDate(date)}</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{amount.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Payment total</p>
            </div>
          ))}
        </div>

        <motion.div
          {...fadeIn("up", 0.2)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[980px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                    Sl No
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                    Treatment Name
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                    Payment Date
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                    Payment Mode
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                    Reference No
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                    Payment Amount
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                    Due Amount
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLedgers.map((ledger) => (
                  <tr
                    key={ledger.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {ledger.slNo}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Activity size={16} className="text-primary" />
                        <span className="font-medium text-gray-900">
                          {ledger.treatmentName || "General payment"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {formatDate(ledger.paymentDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-gray-400" />
                        {ledger.paymentMode || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-gray-400" />
                        {ledger.referenceNo || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-green-600 font-semibold">
                        <IndianRupee size={14} />
                        {(ledger.paymentAmount || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-red-600 font-semibold">
                        <IndianRupee size={14} />
                        {(ledger.dueAmount || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ledger.status === "Paid"
                            ? "bg-green-100 text-green-700"
                            : ledger.status === "Partial"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {ledger.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{ledger.remarks || "-"}</div>
                      {ledger.transactionId && (
                        <div className="mt-1 font-mono text-xs break-all">
                          Txn ID: {ledger.transactionId}
                        </div>
                      )}
                      {ledger.merchantTxnNo && (
                        <div className="font-mono text-xs break-all">
                          Merchant: {ledger.merchantTxnNo}
                        </div>
                      )}
                      {ledger.pgTxnNo && (
                        <div className="font-mono text-xs break-all">
                          PG: {ledger.pgTxnNo}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredLedgers.length === 0 && (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <FileText
                        size={48}
                        className="mx-auto mb-4 text-gray-200"
                      />
                      No ledger entries found.
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredLedgers.length > 0 && (
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 text-right text-gray-700"
                    >
                      Total:
                    </td>
                    <td className="px-6 py-4 text-green-600">
                      <div className="flex items-center gap-1">
                        <IndianRupee size={14} />
                        {filteredLedgers
                          .reduce(
                            (sum, item) => sum + (item.paymentAmount || 0),
                            0,
                          )
                          .toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-red-600">
                      <div className="flex items-center gap-1">
                        <IndianRupee size={14} />
                        {filteredLedgers
                          .reduce((sum, item) => sum + (item.dueAmount || 0), 0)
                          .toLocaleString()}
                      </div>
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div className="divide-y divide-gray-100 md:hidden">
            {filteredLedgers.map((ledger) => (
              <article key={ledger.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {ledger.treatmentName || "General payment"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {ledger.lorryNo || "-"} · {formatDate(ledger.paymentDate)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                      ledger.status === "Paid"
                        ? "bg-green-100 text-green-700"
                        : ledger.status === "Partial"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {ledger.status || "Pending"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Payment mode</p>
                    <p className="font-medium text-gray-800 truncate">
                      {ledger.paymentMode || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Reference</p>
                    <p className="font-mono text-xs text-gray-800 break-all">
                      {ledger.referenceNo || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Paid</p>
                    <p className="font-semibold text-green-600">
                      ₹{(ledger.paymentAmount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Due</p>
                    <p className="font-semibold text-red-600">
                      ₹{(ledger.dueAmount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                {(ledger.transactionId || ledger.remarks) && (
                  <p className="text-xs text-gray-500 break-all">
                    {ledger.transactionId
                      ? `Transaction ID: ${ledger.transactionId}`
                      : ledger.remarks}
                  </p>
                )}
                {(ledger.merchantTxnNo ||
                  ledger.pgTxnNo ||
                  ledger.authRefNo) && (
                  <div className="space-y-1 text-xs text-gray-500 break-all">
                    {ledger.merchantTxnNo && (
                      <p>Merchant: {ledger.merchantTxnNo}</p>
                    )}
                    {ledger.pgTxnNo && <p>PG: {ledger.pgTxnNo}</p>}
                    {ledger.authRefNo && <p>Auth ref: {ledger.authRefNo}</p>}
                  </div>
                )}
              </article>
            ))}
            {filteredLedgers.length === 0 && (
              <div className="px-4 py-12 text-center text-gray-500">
                No ledger entries found.
              </div>
            )}
          </div>
        </motion.div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </Suspense>
  );
};

export default PaymentLedger;
