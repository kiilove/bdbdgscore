import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useFirestoreAddData,
  useFirestoreGetDocument,
  useFirestoreQuery,
} from "../hooks/useFirestores";
import { v4 as uuidv4 } from "uuid";
import { AiFillLock } from "react-icons/ai";
import YbbfLogo from "../assets/img/ybbf_logo.png";
import { addDoc, collection, where } from "firebase/firestore";
import CanvasWithImageData from "../components/CanvasWithImageData";
import { db } from "../firebase";
import { add } from "date-fns";
import { useFirebaseRealtimeUpdateData } from "../hooks/useFirebaseRealtime";
import { CurrentContestContext } from "../contexts/CurrentContestContext";
import LoadingPage from "./LoadingPage";

const AutoScoreTable = (currentStageId, currentJudgeUid) => {
  const [isLoading, setIsLoading] = useState(true);
  const [scoreRangeArray, setScoreRangeArray] = useState([]);
  const [scoreCardArray, setScoreCardArray] = useState([]);
  const [stagesAssignInfo, setStagesAssignInfo] = useState({});
  const [judgeInfo, setJudgeInfo] = useState({});
  const [playersFinalArray, setPlayersFinalArray] = useState([]);
  const [nextStagesAssignInfo, setNextStagesAssignInfo] = useState({});
  const [nextJudgeInfo, setNextJudgeInfo] = useState({});

  const [currentStageInfo, setCurrentStageInfo] = useState([]);
  const [stagePlayers, setStagePlayers] = useState([]);

  const [isHolding, setIsHolding] = useState(false);
  const [currentScoreBoard, setCurrentScoreBoard] = useState([]);
  const { currentContest } = useContext(CurrentContestContext);

  const fetchPlayersFinal = useFirestoreGetDocument("contest_players_final");

  const location = useLocation();
  const navigate = useNavigate();

  const handleScoreCardTitle = (grades) => {};
  const initScoreCard = (stageInfo, judgeInfo, grades, players) => {
    const { stageId, stageNumber } = stageInfo;
    const { judgeUid, judgeName, isHead, seatIndex, contestId } = judgeInfo;

    const scoreCardInfo = grades.map((grade, gIdx) => {
      const { categoryId, categoryTitle, gradeId, gradeTitle } = grade;

      const matchedPlayers = players
        .filter((player) => player.contestGradeId === gradeId)
        .sort((a, b) => a.playerIndex - b.playerIndex);

      const matchedRange = matchedPlayers.map((player, pIdx) => {
        return {
          scoreValue: pIdx + 1,
          scoreIndex: pIdx,
          scoreOwner: undefined,
        };
      });

      return {
        contestId,
        stageId,
        stageNumber,
        categoryId,
        categoryTitle,
        gradeId,
        gradeTitle,
        matchedPlayers,
        judgeUid,
        judgeName,
        matchedRange,
        isHead,
        seatIndex,
      };
    });
    console.log(scoreCardInfo);
    return scoreCardInfo;
  };

  const fetchPool = async (playersFinalId) => {
    if (playersFinalId === undefined) {
      return;
    }
    try {
      await fetchPlayersFinal
        .getDocument(playersFinalId)
        .then((data) => setPlayersFinalArray(() => [...data.players]));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!currentContest?.contests) {
      return;
    } else {
      fetchPool(currentContest.contests.contestPlayersFinalId);
    }
  }, [currentContest?.contests]);

  useEffect(() => {
    if (playersFinalArray?.length <= 0 && !location) {
      return;
    } else {
      const scoreInfo = initScoreCard(
        location.state.stageInfo,
        location.state.judgeInfo,
        location.state.stageInfo.grades,
        playersFinalArray
      );

      setCurrentStageInfo(() => [...scoreInfo]);
    }
    setIsLoading(false);
  }, [playersFinalArray]);

  useEffect(() => {
    console.log(location);
    if (!location?.state) {
      return;
    } else {
      setJudgeInfo(location.state.judgeInfo);
    }
  }, [location]);

  return (
    <>
      {isLoading && (
        <div className="flex w-full h-screen justify-center items-center">
          <LoadingPage />
        </div>
      )}
      <div className="flex w-full justify-start items-start mb-44 flex-col p-4">
        {!isLoading && (
          <>
            <div className="flex h-auto py-2 justify-end items-center w-full">
              <div className="flex w-1/3 items-start flex-col">
                <div className="flex w-32 h-auto py-2 justify-center items-center text-lg">
                  모드
                </div>
                <div className="flex w-32 h-auto py-2 justify-center items-center text-xl font-semibold">
                  일반
                </div>
                <div className="flex w-32 h-auto py-2 justify-center items-center ">
                  <button className="w-auto h-auto px-5 py-2 bg-blue-500 font-semibold rounded-lg text-white text-sm">
                    비교심사요청
                  </button>
                </div>
              </div>
              <div className="flex w-1/3 justify-center">
                <img src={YbbfLogo} alt="" className="w-36" />
              </div>
              <div className="flex w-1/3 items-end flex-col">
                <div className="flex w-32 h-auto py-2 justify-center items-center text-lg">
                  좌석번호
                </div>
                <div className="flex w-32 h-auto py-2 justify-center items-center text-5xl font-semibold">
                  {currentStageInfo[0].seatIndex}
                </div>
              </div>
            </div>
            <div className="flex justify-start flex-col w-full">
              {currentStageInfo.map((stage, sIdx) => (
                <>
                  <div className="flex w-full h-12 rounded-md gap-x-2 justify-center items-center bg-blue-300 mb-2 font-semibold text-lg">
                    {stage.categoryTitle} / {stage.gradeTitle}
                  </div>
                  <div className="flex w-full justify-start items-center flex-col gap-y-2 mb-5">
                    <div className="flex w-full rounded-md gap-x-2 justify-center items-center">
                      <div className="flex w-32 h-10 justify-center items-center bg-blue-200 rounded-lg border border-gray-200">
                        <span className="text-sm">선수번호</span>
                      </div>
                      <div className="flex w-32 h-10 justify-center items-center bg-blue-300 rounded-lg border border-gray-200">
                        <span className="text-sm">순위</span>
                      </div>
                      <div className="flex w-full h-10 justify-center items-center bg-blue-200 rounded-lg border border-gray-200">
                        <span className="text-sm">순위선택</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full justify-start items-center flex-col gap-y-2">
                    <div className="flex h-full rounded-md gap-y-2 flex-col w-full">
                      {stage.matchedPlayers?.length > 0 &&
                        stage.matchedPlayers.map((matched, bIdx) => {
                          const { playerNumber, playerScore, matchedRange } =
                            matched;
                          return (
                            <div className="flex w-full h-full rounded-md gap-x-2">
                              <div className="flex w-32 h-auto flex-col gap-y-2 justify-center items-center bg-blue-100 rounded-lg border border-gray-200">
                                <span className="text-4xl font-semibold">
                                  {playerNumber}
                                </span>
                              </div>
                              <div className="flex w-32 font-semibold justify-center items-center bg-blue-300 rounded-lg border border-gray-200">
                                {playerScore !== 0 && playerScore < 100 && (
                                  <span className="text-4xl">
                                    {playerScore}
                                  </span>
                                )}
                                {playerScore >= 100 && (
                                  <span className="text-4xl">제외</span>
                                )}
                              </div>
                              <div className="flex w-full h-full justify-center items-center bg-white rounded-lg border border-gray-500 flex-wrap p-1 gap-1">
                                <div className="flex w-full h-full flex-wrap gap-2">
                                  {matchedRange?.length > 0 &&
                                    matchedRange
                                      .sort(
                                        (a, b) => a.playerIndex - b.playerIndex
                                      )
                                      .map((score, rIdx) => {
                                        const { scoreValue, scoreOwner } =
                                          score;
                                        return (
                                          <>
                                            {scoreOwner === undefined &&
                                              playerScore === 0 && (
                                                <button
                                                  className="flex w-20 h-20 p-2 rounded-md border border-blue-300 justify-center items-center  bg-blue-100 text-3xl text-gray-600"
                                                  // onClick={() =>
                                                  //   handleScore(
                                                  //     rIdx,
                                                  //     bIdx,
                                                  //     playerNumber?.toString(),
                                                  //     scoreValue
                                                  //   )
                                                  // }
                                                >
                                                  {scoreValue}
                                                </button>
                                              )}
                                            {scoreOwner ===
                                              playerNumber?.toString() &&
                                              playerScore === scoreValue && (
                                                <button
                                                  className="flex w-20 h-20 p-2 rounded-md border border-blue-300 justify-center items-center  bg-blue-500 text-3xl text-gray-100"
                                                  // onClick={() =>
                                                  //   handleUnScore(
                                                  //     rIdx,
                                                  //     bIdx,
                                                  //     playerNumber.toString(),
                                                  //     scoreValue
                                                  //   )
                                                  // }
                                                >
                                                  <AiFillLock />
                                                </button>
                                              )}
                                          </>
                                        );
                                      })}
                                  {/* {playerScore >= 100 ? (
                            <button
                              className="flex w-20 h-20 p-2 rounded-md border border-blue-300 justify-center items-center  bg-blue-600 text-2xl text-gray-200"
                              onClick={() => handleUnExceptScore(bIdx)}
                            >
                              <span className="text-base">복원</span>
                            </button>
                          ) : (
                            <button
                              className="flex ml-10 w-20 h-20 p-2 rounded-md border border-blue-300 justify-center items-center  bg-blue-600 text-2xl text-gray-200"
                              onClick={() => handleExceptScore(bIdx, 100)}
                            >
                              <span className="text-base">제외</span>
                            </button>
                          )} */}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </>
              ))}

              <div className="flex w-full justify-start items-center flex-col gap-y-2">
                <div className="flex h-full rounded-md gap-y-2 flex-col w-full"></div>
                <div className="flex w-full h-auto py-2">
                  <div className="flex w-1/2 h-24 p-2">
                    <div className="flex rounded-lg">
                      <div className="flex w-1/6 justify-center items-center text-lg">
                        서명
                      </div>
                      <div className="flex w-5/6 justify-center items-center h-20 ">
                        {judgeInfo && (
                          <CanvasWithImageData
                            imageData={judgeInfo.judgeSignature}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex w-1/2 h-20 py-2 justify-center items-center">
                    <button
                      className="w-full h-full bg-blue-500 text-white text-xl font-bold rounded-lg"
                      // onClick={() =>
                      //   addScore(
                      //     {
                      //       ...currentScoreBoard,
                      //       judgeSignature: judgeSign,
                      //     },
                      //     location.state.collectionInfo
                      //   )
                      // }
                    >
                      제출
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AutoScoreTable;
