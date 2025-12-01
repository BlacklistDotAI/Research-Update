// src/components/TestDonateForm.tsx
import React, { useState } from "react";
import { apiClient } from "../utils/api";
import {
  ContributionInterest,
  ContributionSkill,
  ParticipationTime,
  DonateResponse,
} from "../utils/api";

const DonationForm: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [organization, setOrganization] = useState("");
  const [contributionInterest, setContributionInterest] = useState<ContributionInterest | "">("");
  const [contributionSkill, setContributionSkill] = useState<ContributionSkill | "">("");
  const [participationTime, setParticipationTime] = useState<ParticipationTime | "">("");
  const [acceptInformation, setAcceptInformation] = useState(false);
  const [acceptNoAbuse, setAcceptNoAbuse] = useState(false);
  const [referral_link, setReferralLink] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const formData = new FormData();

      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone_number", phoneNumber);
      formData.append("organization", organization);
      if (contributionInterest) formData.append("contribution_interest", contributionInterest);
      if (contributionSkill) formData.append("contribution_skill", contributionSkill);
      if (participationTime) formData.append("participation_time", participationTime);
      formData.append("referral_link", referral_link);
      formData.append("note", note);
      formData.append("accept_information", acceptInformation.toString());
      formData.append("accept_no_abuse", acceptNoAbuse.toString());

      const response = await apiClient.post<DonateResponse>("/donates/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Donate submitted successfully!");
      console.log("Donate response:", response.data);

      // Reset form
      setName("");
      setEmail("");
      setPhoneNumber("");
      setOrganization("");
      setContributionInterest("");
      setContributionSkill("");
      setParticipationTime("");
      setReferralLink("");
      setNote("");
      setAcceptInformation(false);
      setAcceptNoAbuse(false);

      setShowForm(false);
      window.location.reload();
    } catch (error) {
      console.error("Donate API error:", error);
      alert("Error submitting donate! Name, email, and contribution interest are required.");
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
          Create Donate
        </button>
      ) : (
        <>
          <h2 className="text-xl font-semibold">Create Donate</h2>

          <input
            type="text"
            placeholder="Name"
            className="border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            className="border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Phone Number"
            className="border p-2 rounded"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />

          <input
            type="text"
            placeholder="Organization"
            className="border p-2 rounded"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />

          <select
            value={contributionInterest}
            className="border p-2 rounded"
            onChange={(e) => setContributionInterest(e.target.value as ContributionInterest)}
          >
            <option value="" disabled>--Select Contribution Interest--</option>
            {Object.values(ContributionInterest).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          <select
            value={contributionSkill}
            className="border p-2 rounded"
            onChange={(e) => setContributionSkill(e.target.value as ContributionSkill)}
          >
            <option value="" disabled>--Select Contribution Skill--</option>
            {Object.values(ContributionSkill).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          <select
            value={participationTime}
            className="border p-2 rounded"
            onChange={(e) => setParticipationTime(e.target.value as ParticipationTime)}
          >
            <option value="" disabled>--Select Participation Time--</option>
            {Object.values(ParticipationTime).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Referral Link"
            className="border p-2 rounded"
            value={referral_link}
            onChange={(e) => setReferralLink(e.target.value)}
          />

          <input
            type="text"
            placeholder="Note"
            className="border p-2 rounded"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={acceptInformation}
              onChange={(e) => setAcceptInformation(e.target.checked)}
            />
            I confirm that the information provided is accurate; agree to let Blacklist.vn contact & process data according to the Privacy Policy.
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={acceptNoAbuse}
              onChange={(e) => setAcceptNoAbuse(e.target.checked)}
            />
            I pledge not to abuse Blacklist.vn to defame or attack individuals; all accusations will be accompanied by evidence and the complaint process will be respected.
          </label>

          <div className="flex justify-center">
            <button
              disabled={loading}
              onClick={handleSubmit}
              className="px-3 py-2 bg-green-600 text-white rounded"
            >
              Submit
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

export default DonationForm;
