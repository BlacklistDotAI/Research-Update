// src/components/TestReport.tsx
import React, { useState } from "react";
import { apiClient } from "../utils/api";
import { Category, Status, ProofType } from "../utils/api";

const TestReport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleTestReport = async () => {
    try {
      const formData = new FormData();
      formData.append("title", "Test Report");
      formData.append("description", "This is a test report created for testing");
      formData.append("category", Category.Company);
      formData.append("status", Status.Draft);
      formData.append("detail", "Additional detail for testing");

      if (file) {
        formData.append("proof_file", file);
        const fileType = file.type.split("/")[0]; // "image", "video", "audio"
        formData.append("proof_type", fileType); // backend có thể ignore, hoặc dùng để override
      }

      const response = await apiClient.post("/reports/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Report created:", response.data);
    } catch (error) {
      console.error("Report API error:", error);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input type="file" onChange={handleFileChange} />
      <button
        onClick={handleTestReport}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        Test Create Report
      </button>
    </div>
  );
};

export default TestReport;
