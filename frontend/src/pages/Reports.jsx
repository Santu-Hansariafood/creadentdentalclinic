import { motion } from "framer-motion";
import { fadeIn } from "../utils/motion";
import { Suspense } from "react";
import Preloader from "../components/Preloader";
import PageHeader from "../components/PageHeader";

const Reports = () => {
  return (
    <Suspense fallback={<Preloader />}>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Reports"
          subtitle="View and manage clinical and financial reports."
        />
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-500">Reports module is coming soon.</p>
        </div>
      </div>
    </Suspense>
  );
};

export default Reports;
