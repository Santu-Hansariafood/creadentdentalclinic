import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { AlertTriangle, Calendar, CheckCircle2, Clock, RefreshCw, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Preloader from "../components/Preloader";
import { GET_APPOINTMENTS } from "../graphql/queries";
import { formatDate } from "../utils/dateUtils";

const AppointmentRequests = () => {
  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState("");
  const selectedAppointmentId = new URLSearchParams(location.search).get("appointment");
  const { data, loading, error } = useQuery(GET_APPOINTMENTS, {
    variables: {
      page: 1,
      limit: 100,
      status: "Scheduled",
      date: selectedDate || undefined,
    },
    fetchPolicy: "network-only",
  });

  const requests = (data?.getAppointments?.appointments || []).filter(
    (appointment) => appointment.patientResponse,
  );

  useEffect(() => {
    if (!selectedAppointmentId || loading) return;
    document.getElementById(`appointment-request-${selectedAppointmentId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [loading, selectedAppointmentId]);

  if (loading) return <Preloader />;

  return (
    <div>
      <PageHeader
        title="Appointment Requests"
        subtitle="Review patient confirmations and reschedule requests."
      />

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-sm font-medium text-gray-700">
          <span>Filter by appointment date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 font-normal text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        {selectedDate && (
          <button
            type="button"
            onClick={() => setSelectedDate("")}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <X size={16} />
            Clear date
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load appointment requests. Please try again.
        </div>
      )}

      {!error && requests.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <Calendar size={40} className="mx-auto mb-3 text-gray-400" />
          <h2 className="font-heading text-lg font-semibold text-gray-900">No appointment requests</h2>
          <p className="mt-1 text-sm text-gray-500">Patient confirmations and reschedule requests will appear here.</p>
        </div>
      )}

      <div className="space-y-4">
        {requests.map((appointment) => {
          const isConfirmed = appointment.patientResponse === "confirmed";
          const isSelected = selectedAppointmentId === appointment.id;

          return (
            <article
              key={appointment.id}
              id={`appointment-request-${appointment.id}`}
              className={`rounded-xl border bg-white p-5 shadow-sm transition-shadow ${
                isSelected ? "border-primary ring-2 ring-primary/20" : "border-gray-200"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {isConfirmed ? (
                      <CheckCircle2 size={20} className="text-emerald-600" />
                    ) : (
                      <AlertTriangle size={20} className="text-amber-600" />
                    )}
                    <h2 className="font-heading text-lg font-semibold text-gray-900">
                      {isConfirmed ? "Confirmed by patient" : "Reschedule requested by patient"}
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{appointment.patientName}</p>
                </div>
                <span
                  className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    isConfirmed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {isConfirmed ? <CheckCircle2 size={14} /> : <RefreshCw size={14} />}
                  {isConfirmed ? "Confirmed" : "Needs rescheduling"}
                </span>
              </div>

              <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 text-sm text-gray-600 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  {formatDate(appointment.date, "dd/MM/yyyy")}
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-primary" />
                  {appointment.time}
                </div>
                <div>
                  <span className="font-medium text-gray-800">Doctor:</span> {appointment.doctorName}
                </div>
              </div>

              {!isConfirmed && appointment.rescheduleReason && (
                <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <span className="font-semibold">Reason:</span> {appointment.rescheduleReason}
                </div>
              )}

              {appointment.patientResponseAt && (
                <p className="mt-3 text-xs text-gray-500">
                  {isConfirmed ? "Confirmed" : "Requested"} on {formatDate(appointment.patientResponseAt, "dd/MM/yyyy hh:mm a")}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default AppointmentRequests;
