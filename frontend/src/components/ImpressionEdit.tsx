import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addUserImpression } from "../services/firestore-database_f.ts";

const ImpressionEdit: React.FC = () => {
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message) {
      console.log("message", message);
      await addUserImpression(message);
      alert("送信しました。");
      navigate(-1);
    }
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
export default ImpressionEdit;
