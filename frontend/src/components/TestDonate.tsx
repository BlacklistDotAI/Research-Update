import React from "react";
import { ContributionInterest, ContributionSkill, ParticipationTime, DonateResponse } from "../utils/api";
import { apiClient } from "../utils/api";

const TestDonate = () => {
  const handleTestDonate = async () => {
    try {
      const formData = new FormData();
      formData.append("name", "Nguyen");
      formData.append("email", "example@gmail.com");
      formData.append("contribution_interest", ContributionInterest.SkillsTime);
      formData.append("contribution_skill", ContributionSkill.AI_ML);
      formData.append("participation_time", ParticipationTime.AdHoc);
      formData.append("accept_information", "true");
      formData.append("accept_no_abuse", "true");

      formData.append("phone_number", "0123456789");
      formData.append("organization", "My Org");

      const response = await apiClient.post<DonateResponse>("/donates/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Donate created:", response.data);
    } catch (error) {
      console.error("Donate API error:", error);
    }
  };

  return (
    <button
      onClick={handleTestDonate}
      style={{ padding: "8px 16px", background: "black", color: "white", borderRadius: "6px" }}
    >
      Test Donate
    </button>
  );
};

export default TestDonate;
