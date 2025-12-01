import React from "react";
import { DonateResponse } from "../utils/api";

interface DonatesTableProps {
  donates: DonateResponse[];
}

const DonatesTable: React.FC<DonatesTableProps> = ({ donates }) => {
  return (
    <div className="overflow-x-auto bg-white shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone Number</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Organization</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contribution Interest</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Skill</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Participation</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Link</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Accept Information</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Accept No Abuse</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {donates.map((donate) => (
            <tr key={donate.id} className="hover:bg-gray-50 transition-colors duration-150">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{donate.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{donate.name ?? "-"}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{donate.email ?? "-"}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{donate.phone_number ?? "-"}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{donate.organization ?? "-"}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{donate.contribution_interest ?? "-"}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{donate.contribution_skill ?? "-"}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{donate.participation_time ?? "-"}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{donate.referral_link ?? "-"}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{donate.note ?? "-"}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{donate.accept_information ? "Yes" : "No"}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{donate.accept_no_abuse ? "Yes" : "No"}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {donate.created_at ? new Date(donate.created_at).toLocaleString() : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DonatesTable;
