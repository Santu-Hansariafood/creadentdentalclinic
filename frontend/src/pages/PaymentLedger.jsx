import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Activity,
  Calendar,
  DollarSign,
  FileText,
  CreditCard,
  Hash,
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
    variables: { page, limit },
  });

  if (loading) return <Preloader />;
  if (error)
    return (
      <div className="p-6 text-center text-red-500">Error: {error.message}</div>
    );

  const { paymentLedgers = [], totalPages = 1 } = data?.getPaymentLedgers || {};

  const filteredLedgers = paymentLedgers.filter((ledger) =>
    ledger.treatmentName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Suspense fallback={<Preloader />}>
      <div className="p-6 max-w-7xl mx-auto">
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
              placeholder="Search by Treatment Name..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <motion.div
          {...fadeIn("up", 0.2)}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
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
                          {ledger.treatmentName}
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
                        <DollarSign size={14} />
                        {ledger.paymentAmount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-red-600 font-semibold">
                        <DollarSign size={14} />
                        {ledger.dueAmount.toLocaleString()}
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
                      {ledger.remarks || "-"}
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
                        <DollarSign size={14} />
                        {filteredLedgers
                          .reduce((sum, item) => sum + item.paymentAmount, 0)
                          .toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-red-600">
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} />
                        {filteredLedgers
                          .reduce((sum, item) => sum + item.dueAmount, 0)
                          .toLocaleString()}
                      </div>
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              )}
            </table>
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
