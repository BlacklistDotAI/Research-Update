import React from "react";
import { ReportResponse } from "../utils/api";

interface ReportsTableProps {
  reports: ReportResponse[];
}

const ReportsTable: React.FC<ReportsTableProps> = ({ reports }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 shadow rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proof File</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proof Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Id</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created at</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated at</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reports.map((report) => (
            <tr key={report.id}>
              <td className="px-6 py-4 whitespace-nowrap">{report.title ?? "-"}</td>
              <td className="px-6 py-4 whitespace-nowrap">{report.description ?? "-"}</td>
              <td className="px-6 py-4 whitespace-nowrap">{report.category ?? "-"}</td>
              <td className="px-6 py-4 whitespace-nowrap">{report.detail ?? "-"}</td>
              <td className="px-6 py-4 whitespace-nowrap">{report.proof_file ?? "-"}</td>
              <td className="px-6 py-4 whitespace-nowrap">{report.proof_type ?? "-"}</td>
              <td className="px-6 py-4 whitespace-nowrap">{report.status ?? "-"}</td>
              <td className="px-6 py-4 whitespace-nowrap">{report.id}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {report.created_at ? new Date(report.created_at).toLocaleString() : "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {report.updated_at ? new Date(report.updated_at).toLocaleString() : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportsTable;
