import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#007FAF", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const DashboardCharts = ({ reports }) => {
  const monthlyRevenue = reports?.monthlyRevenue ?? [];
  const appointmentsByType = reports?.appointmentsByType ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="card">
        <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
          Monthly Revenue Trend
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" fill="#007FAF" name="Revenue ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2 className="font-heading text-xl font-semibold text-gray-900 mb-4">
          Appointments by Type
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={appointmentsByType}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ type, count }) => `${type}: ${count}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {appointmentsByType.map((entry, index) => (
                <Cell key={`cell-${entry.type}-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardCharts;
