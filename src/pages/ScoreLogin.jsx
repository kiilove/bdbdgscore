import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash"; // Import debounce from lodash
import {
  useFirebaseRealtimeGetDocument,
  useFirebaseRealtimeQuery,
  useFirebaseRealtimeUpdateData,
} from "../hooks/useFirebaseRealtime";
import { CurrentContestContext } from "../contexts/CurrentContestContext";
import { useFirestoreGetDocument } from "../hooks/useFirestores";

const ScoreLogin = () => {
  const navigate = useNavigate();
  const [stagesArray, setStagesArray] = useState([]);
  const [judgeArray, setJudgeArray] = useState([]);

  const [currentStagesAssign, setCurrentStagesAssign] = useState({});
  const [currentJudgeAssign, setCurrentJudgeAssign] = useState({});
  const [nextStagesAssign, setNextStagesAssign] = useState({});
  const [nextJudgeAssign, setNextJudgeAssign] = useState({});
  const [contests, setContests] = useState({});

  const [password, setPassword] = useState("");
  const [passwordInputs, setPasswordInputs] = useState(["", "", "", ""]);

  const {
    data: realtimeData,
    loading,
    error,
    getDocument,
  } = useFirebaseRealtimeGetDocument();

  const updateRealtimeJudge = useFirebaseRealtimeUpdateData();
  const fetchPlayersFinal = useFirestoreGetDocument("contest_players_final");
  const fetchStagesAssign = useFirestoreGetDocument("contest_stages_assign");
  const fetchJudgeAssign = useFirestoreGetDocument("contest_judges_assign");

  const pwdRefs = [useRef(), useRef(), useRef(), useRef()];
  const submitButtonRef = useRef(null);
  const handleKeyDown = (refPrev, event) => {
    if (event.key === "Backspace" && event.target.value === "") {
      refPrev.current.focus();
    }
  };

  const handleUpdateState = async (collectionInfo, seatIndex) => {
    const currentJudge = {
      isLogined: true,
      isEnd: false,
      seatIndex,
    };
    const updatedData = await updateRealtimeJudge.updateData(
      collectionInfo,
      currentJudge
    );
    console.log("Updated Data:", updatedData);
  };

  const handleJudgeLogin = async (collectionName, documentId, seatIndex) => {
    await handleUpdateState(
      `${collectionName}/${documentId}/judges/${seatIndex - 1}`,
      seatIndex
    ).then(() =>
      navigate("/autoscoretable", {
        state: {
          stageId: realtimeData.stageId,
          contestId: contests.contests.id,
          stageInfo: currentStagesAssign,
          judgeInfo: currentJudgeAssign,
          nextStageInfo: nextStagesAssign,
          nextJudge: nextJudgeAssign,
          collectionName: contests.contests.collectionName,
        },
      })
    );
  };
  const handleJudgeLogOut = async (collectionName, documentId, seatIndex) => {
    const collectionInfo = `${collectionName}/${documentId}/judges/${
      seatIndex - 1
    }`;
    const currentJudge = {
      isLogined: false,
      isEnd: false,
      seatIndex,
    };
    try {
      await updateRealtimeJudge
        .updateData(collectionInfo, currentJudge)
        .then(() => console.log("logouted"));
    } catch (error) {
      console.log(error);
    }
  };

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
      // Debounce the getDocument call to once every second

      const debouncedGetDocument = debounce(
        () => getDocument(`currentStage/${contests.contests.id}`),
        2000
      );
      debouncedGetDocument();
    }
  }, [getDocument, contests]);

  useEffect(() => {
    contests?.contests?.id &&
      fetchPool(
        contests.contests.contestStagesAssignId,
        contests.contests.contestJudgesAssignId
      );
  }, [contests]);

  useEffect(() => {
    if (
      stagesArray?.length > 0 &&
      judgeArray?.length > 0 &&
      realtimeData?.stageId
    ) {
      handleCurrentInfo(realtimeData.stageId);
    }
  }, [stagesArray, judgeArray, realtimeData]);

  const handleInputs = (index, value) => {
    if (value.length > 1) {
      return; // 입력의 길이가 1을 초과하면 아무 것도 하지 않음
    }

    setPasswordInputs((prevState) =>
      prevState.map((input, i) => (i === index ? value : input))
    );

    // 입력 값이 존재하면 다음 입력 칸으로 focus 이동
    if (value) {
      if (index < pwdRefs.length - 1) {
        pwdRefs[index + 1].current.focus();
      }
    } else {
      // 입력 값이 없으면 이전 입력 칸으로 focus 이동
      if (index > 0) {
        pwdRefs[index - 1].current.focus();
      }
    }

    // 모든 입력 칸에 값이 채워졌을 때 심사진행 버튼으로 focus 이동
    if (passwordInputs.join("").length === 4) {
      pwdRefs[pwdRefs.length - 1].current.blur(); // 마지막 입력 칸에서 focus 해제
      submitButtonRef.current.focus(); // 심사진행 버튼으로 focus 이동
    }
  };

  const fetchPool = async (stagesAssignId, judgesAssignId) => {
    const returnStagesAssign = await fetchStagesAssign.getDocument(
      stagesAssignId
    );
    const returnJudgeAssign = await fetchJudgeAssign.getDocument(
      judgesAssignId
    );

    returnStagesAssign && setStagesArray([...returnStagesAssign.stages]);
    returnJudgeAssign && setJudgeArray([...returnJudgeAssign.judges]);
  };

  const handleCurrentInfo = (stageId) => {
    const findStage = stagesArray.find((f) => f.stageId === stageId);
    const findNextStage = stagesArray.find(
      (f) => f.stageNumber === findStage.stageNumber + 1
    );

    const findJudges = judgeArray.find(
      (f) =>
        f.gradeId === findStage?.gradeId && f.seatIndex === contests.machineId
    );
    const findNextJudges = judgeArray.find(
      (f) =>
        f.gradeId === findNextStage?.gradeId &&
        f.seatIndex === contests.machineId
    );

    setCurrentStagesAssign({ ...findStage });
    setCurrentJudgeAssign({ ...findJudges });
    setNextStagesAssign({ ...findNextStage });
    setNextJudgeAssign({ ...findNextJudges });
  };

  return (
    <div className="flex w-full h-full flex-col">
      <div className="flex w-full justify-center items-center h-20">
        <span className="text-6xl font-sans font-bold text-gray-800">
          JUDGE
        </span>
        <span className="text-6xl font-sans font-bold text-gray-800 ml-2">
          {contests?.machineId}
        </span>
      </div>
      <div className="flex text-5xl font-bold text-blue-900 h-auto w-full justify-center items-center p-5">
        {realtimeData?.categoryTitle} ({realtimeData?.gradeTitle})
        {currentJudgeAssign?.onedayPassword}
      </div>
      <div className="flex w-full justify-center items-center p-5 gap-x-5">
        <div className="flex w-full justify-center items-center p-5 gap-x-5">
          {passwordInputs.map((value, index) => (
            <div
              key={index}
              className="flex justify-center items-center w-32 h-32 border-8 border-orange-400 rounded-md"
            >
              <input
                type="number"
                ref={pwdRefs[index]}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => handleKeyDown(pwdRefs[index - 1], e)}
                onChange={(e) => handleInputs(index, e.target.value)}
                value={value}
                name={`judgePassword${index + 1}`}
                maxLength={1}
                className="w-28 h-28 text-6xl flex text-center align-middle outline-none"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex w-full h-auto p-3 justify-center items-center">
        {passwordInputs.join("") === currentJudgeAssign.onedayPassword && (
          <button
            className="w-44 h-24 bg-blue-500 text-white text-2xl font-semibold rounded-lg"
            ref={submitButtonRef}
            onClick={() =>
              handleJudgeLogin(
                "currentStage",
                contests.contests.id,
                currentJudgeAssign.seatIndex
              )
            }
          >
            심사진행
          </button>
        )}
      </div>
    </div>
  );
};

export default ScoreLogin;
