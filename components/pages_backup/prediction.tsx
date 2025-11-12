"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"

export default function Prediction() {
  const predictionData = [
    { month: "Jan", actual: 450, predicted: 455 },
    { month: "Feb", actual: 480, predicted: 475 },
    { month: "Mar", actual: 520, predicted: 525 },
    { month: "Apr", actual: 490, predicted: 485 },
    { month: "May", actual: 550, predicted: 555 },
    { month: "Jun", actual: 580, predicted: 575 },
    { month: "Jul", actual: null, predicted: 610 },
    { month: "Aug", actual: null, predicted: 640 },
  ]

  const accuracyData = [
    { name: "MAE", value: 8.5 },
    { name: "RMSE", value: 12.3 },
    { name: "R²", value: 0.94 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Prediction Model</h1>
        <p className="text-gray-400">Model prediksi untuk data desa menggunakan Machine Learning</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Model Accuracy</p>
          <p className="text-3xl font-bold text-green-400 mt-2">94%</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Training Data</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">2,456</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Test Data</p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">614</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm">Model Type</p>
          <p className="text-3xl font-bold text-purple-400 mt-2">LSTM</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Actual vs Predicted</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={predictionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }} />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={2} name="Actual" />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#10B981"
                strokeWidth={2}
                name="Predicted"
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Model Metrics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={accuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151" }} />
              <Bar dataKey="value" fill="#F59E0B" name="Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
