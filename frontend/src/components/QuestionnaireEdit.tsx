import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QuestionnaireData } from "shared/dist/types";

const QuestionnaireEdit: React.FC = () => {
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>(
    useLocation().state
  );
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setQuestionnaire((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questionnaire) {
      console.log("questionnaire", questionnaire);
    }
    navigate(-1);
  };

  return (
    <div>
      <h2>アンケート</h2>
      <form>
        <div>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        <button onClick={handleSubmit}>更新</button>
      </form>
    </div>
  );
};
export default QuestionnaireEdit;
