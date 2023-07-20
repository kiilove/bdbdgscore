import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useFirebaseRealtimeGetDocument,
  useFirebaseRealtimeQuery,
} from "../hooks/useFirebaseRealtime";
import { CurrentContestContext } from "../contexts/CurrentContestContext";

const ScoreLogin = () => {
  const navigate = useNavigate();
  const [contests, setContests] = useState({});
  const { data, loading, error, getDocument } =
    useFirebaseRealtimeGetDocument();

  //const { currentContest } = useContext(CurrentContestContext);

  useEffect(() => {
    const getContests = JSON.parse(localStorage.getItem("currentContest"));

    if (!getContests) {
      navigate("/adminlogin", { replace: true });
    } else {
      setContests(getContests);
    }
  }, []);

  useEffect(() => {
    if (contests?.contests?.id) {
      getDocument("currentStage", contests.contests.id); // Replace with your actual collection name and document id
    }
  }, [getDocument, contests]);

  if (!contests) {
    // 리다이렉트를 위한 useEffect를 기다림
    return null;
  }

  return (
    <div className="flex w-full h-full flex-col">
      <div className="flex w-full justify-center items-center h-20">
        <span className="text-6xl font-sans font-bold text-gray-800">
          JUDGE
        </span>
        <span className="text-6xl font-sans font-bold text-gray-800 ml-2">
          {contests.machineId}
        </span>
      </div>
      <div className="flex">{data && data.categoryTitle}</div>
    </div>
  );
};

export default ScoreLogin;
