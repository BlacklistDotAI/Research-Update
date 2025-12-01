import React, { useEffect, useState } from "react";
import DonatesTable from "./DonateList";
import ReportsTable from "./ReportList";
import { getDonates, getReports, DonateResponse, ReportResponse } from "../utils/api";

const ShowTest: React.FC = () => {
  const [donates, setDonates] = useState<DonateResponse[]>([]);
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const d = await getDonates();
        const r = await getReports();
        setDonates(d);
        setReports(r);
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p className="text-gray-500">Loading data...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="p-8 space-y-12">
      <section>
        <h2 className="text-2xl font-bold mb-4">Donor Records</h2>
        <DonatesTable donates={donates} />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Report Records</h2>
        <ReportsTable reports={reports} />
      </section>
    </div>
  );
};

export default ShowTest;
