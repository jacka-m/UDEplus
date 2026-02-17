import { ChevronRight } from "lucide-react";

interface SessionDetailsFormProps {
  sessionDetails: {
    startTime: string;
    endTime: string;
    startTimeInput: string;
    endTimeInput: string;
  };
  setSessionDetails: (details: any) => void;
  onNext: () => void;
}

export default function SessionDetailsForm({
  sessionDetails,
  setSessionDetails,
  onNext,
}: SessionDetailsFormProps) {
  const handleChange = (field: string, value: string) => {
    setSessionDetails({
      ...sessionDetails,
      [field]: value,
    });
  };

  const isValid =
    sessionDetails.startTime &&
    sessionDetails.endTime &&
    sessionDetails.startTimeInput &&
    sessionDetails.endTimeInput;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Session Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={sessionDetails.startTime}
            onChange={(e) => handleChange("startTime", e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 transition"
          />
        </div>

        {/* Start Time */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Start Time
          </label>
          <input
            type="time"
            value={sessionDetails.startTimeInput}
            onChange={(e) => handleChange("startTimeInput", e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 transition"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={sessionDetails.endTime}
            onChange={(e) => handleChange("endTime", e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 transition"
          />
        </div>

        {/* End Time */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            End Time
          </label>
          <input
            type="time"
            value={sessionDetails.endTimeInput}
            onChange={(e) => handleChange("endTimeInput", e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 transition"
          />
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <span className="font-semibold">💡 Tip:</span> Enter the date and time when
          your driving session started and ended. This helps us track when you were
          active on the platform.
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={onNext}
        disabled={!isValid}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
