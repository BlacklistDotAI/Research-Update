import React,{ useState } from "react";
import { apiClient } from "../utils/api";
import { Category, Status } from "../utils/api";

const ReportForm: React.FC = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category|"">("");
  const [detail, setDetail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const handleSubmit = async (status: Status) => {
    try {
      setLoading(true);
      const formData = new FormData();

      if (title) formData.append("title", title);
      if (description) formData.append("description", description);
      if (category) formData.append("category", category);
      formData.append("detail", detail);
      formData.append("status", status);
      if (file) {
        formData.append("proof_file", file);
        const fileType = file.type.split("/")[0]; // image, video, audio
        formData.append("proof_type", fileType);
      }

      const response = await apiClient.post("/reports/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(`Report ${status === Status.Draft ? "saved as draft" : "published"} successfully!`);
      console.log("Report response:", response.data);

      // reset form
      setTitle("");
      setDescription("");
      setCategory("");
      setDetail("");
      setFile(null);
      window.location.reload();
    } catch (error) {
      console.error("Submit report error:", error);
      alert("Error submitting report! Title, Description and Category are required");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-4 shadow rounded flex flex-col gap-3">
      {!showForm ? (
        <button
          className="text-xl font-semibold p-2 bg-blue-600 text-white rounded"
          onClick={() => setShowForm(true)}
        >
          Create Report
        </button>
      ) : (
        <>
          <h2 className="text-xl font-semibold">Create Report</h2>

          <input
            type="text"
            placeholder="Report Title"
            className="border p-2 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            placeholder="Report Description"
            className="border p-2 rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <select
            value={category}
            className="border p-2 rounded"
            onChange={(e) =>
              setCategory(e.target.value as Category)
            }
          >
            <option value="" disabled>--Select Category--</option>
            <option value={Category.Company}>Company</option>
            <option value={Category.Event}>Event</option>
            <option value={Category.PersonnelKOL}>Personnel/KOL</option>
            <option value={Category.PhoneNumber}>Phone Number</option>
          </select>

          <textarea
            placeholder="Category Detail"
            className="border p-2 rounded"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            required
          />

          <input
            type="file"
            className="border p-2 rounded"
            onChange={(e) =>
              e.target.files && setFile(e.target.files[0])
            }
          />

          <div className="flex justify-between">
            <button
              disabled={loading}
              onClick={() => handleSubmit(Status.Draft)}
              className="px-3 py-2 bg-yellow-500 text-white rounded"
            >
              Save as Draft
            </button>

            <button
              disabled={loading}
              onClick={() => handleSubmit(Status.Publish)}
              className="px-3 py-2 bg-green-600 text-white rounded"
            >
              Publish
            </button>
          </div>

          <button
            className="mt-2 text-red-500 underline"
            onClick={() => setShowForm(false)}
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
};

export default ReportForm;