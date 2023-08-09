import React, { useContext } from "react";
import { useState } from "react";
import LoadingPage from "../pages/LoadingPage";
import { useEffect } from "react";
import { isNumber } from "lodash";
import { MdLiveHelp } from "react-icons/md";
import { useFirebaseRealtimeUpdateData } from "../hooks/useFirebaseRealtime";
import { generateUUID } from "../functions/functions";
import {
  useFirestoreAddData,
  useFirestoreGetDocument,
  useFirestoreUpdateData,
} from "../hooks/useFirestores";
import ConfirmationModal from "../messageBox/ConfirmationModal";
import { CurrentContestContext } from "../contexts/CurrentContestContext";

const CompareSetting = ({
  stageInfo,
  setClose,
  gradeListId,
  prevMatched,
  fullMatched,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [compareList, setCompareList] = useState({});
  const [compareArray, setCompareArray] = useState([]);

  const [msgOpen, setMsgOpen] = useState(false);
  const [message, setMessage] = useState({});

  const [gradesArray, setGradesArray] = useState([]);
  const [judgesAssignArray, setJudgesAssignArray] = useState([]);
  const [votedInfo, setVotedInfo] = useState({
    playerLength: undefined,
    scoreMode: undefined,
  });
  const [isVotedPlayerLengthInput, setIsVotedPlayerLengthInput] =
    useState(false);

  const updateRealtimeCompare = useFirebaseRealtimeUpdateData();
  const addCompare = useFirestoreAddData("contest_compare_list");

  const fetchGrades = useFirestoreGetDocument("contest_grades_list");
  const updateGrades = useFirestoreUpdateData("contest_grades_list");
  const fetchJudgesAssign = useFirestoreGetDocument("contest_judges_assign");

  const fetchCompare = useFirestoreGetDocument("contest_compares_list");
  const updateCompare = useFirestoreUpdateData("contest_compares_list");

  const { currentContest } = useContext(CurrentContestContext);

  const fetchPool = async (gradeId, compareId, judgeAssignId) => {
    if (gradeId === undefined || compareId === undefined) {
      setMessage({
        body: "데이터 로드에 문제가 발생했습니다.",
        body2: "다시 시도해주세요.",
        isButton: true,
        confirmButtonText: "확인",
      });
      setMsgOpen(true);
      return;
    }
    try {
      await fetchGrades
        .getDocument(gradeListId)
        .then((data) => setGradesArray([...data.grades]));
    } catch (error) {
      console.log(error);
    }

    try {
      await fetchCompare
        .getDocument(compareId)
        .then((data) => setCompareList({ ...data }))
        .then(() => setCompareArray([...compareList.compares]));
    } catch (error) {
      console.log(error);
    }

    try {
      await fetchJudgesAssign
        .getDocument(judgeAssignId)
        .then((data) =>
          setJudgesAssignArray(() => [
            ...data.judges.filter((f) => f.contestGradeId === gradeId),
          ])
        );
    } catch (error) {
      console.log(error);
    }
  };

  const handleCompareModeStart = async (contestId, data) => {
    const collectionInfo = `currentStage/${contestId}/compares`;
    try {
      const updatedData = await updateRealtimeCompare.updateData(
        collectionInfo,
        data
      );

      console.log(updatedData);
    } catch (error) {
      console.log(error);
    }
  };

  // firestore와 realtime저장까지는 성공했어.
  // 심판들 화면에서 compare의 값이 바뀌면 비교심사가 진행된다는 팝업을 띄우는부분부터 하면 됨

  // 비교심사 컬렉션을 하나 더 만들어서 나눠서 들어가는게 맞을것 같아
  // contest_grades_list에 체급을 하나 추가하는 방향으로 잡아보기도 했는데
  // contest_players_final에 다시 선수를 추가하는 방향과
  // contest_grades_compare라는 컬렉션안에 다 담아서 처리하는 방향
  // 두가지중에 한가지를 선택해야할것 같아
  const handleAdd = async (contestId, compareId) => {
    const collection = `currentStage/${contestId}/compare`;
    const compareIndex = compareArray.length + 1;

    const findIndexGrades = gradesArray.findIndex(
      (f) => f.contestGradeId === stageInfo.grades[0].gradeId
    );
    if (findIndexGrades === -1) {
      setMessage({
        body: "데이터 로드에 문제가 발생했습니다.",
        body2: "다시 시도해주세요.",
        isButton: true,
        confirmButtonText: "확인",
      });
      setMsgOpen(true);
      return;
    }

    const newGradeInfo = { ...gradesArray[findIndexGrades], isCompared: true };
    const initVotedArray = fullMatched.map((player, pIdx) => {
      const { playerIndex, playerUid, playerNumber } = player;

      return { playerNumber, votedJudges: [], votedCount: 0 };
    });
    const compareInfo = {
      compareId: generateUUID(),
      contestId,
      categoryId: stageInfo.categoryId,
      gradeId: stageInfo.grades[0].gradeId,
      categoryTitle: stageInfo.categoryTitle,
      gradeTitle: stageInfo.grades[0].gradeTitle,
      compareIndex,
      comparePlayerLength: parseInt(votedInfo.playerLength),
      compareScoreMode: votedInfo.scoreMode,
      comparePlayerLength: parseInt(votedInfo.playerLength),
      compareScoreMode: votedInfo.scoreMode,
      compareVoted: initVotedArray,
    };

    console.log(compareInfo);
    const judgeMessageInfo = judgesAssignArray.map((assign, aIdx) => {
      const { seatIndex, judgeUid } = assign;
      return { judgeUid, seatIndex, messageStatus: "확인전" };
    });
    const realtimeCompareInfo = {
      compareIndex,
      isCompared: true,
      status: "start",
      playerLength: votedInfo.playerLength,
      scoreMode: votedInfo.scoreMode,
      judges: [...judgeMessageInfo],
    };

    try {
      const newCompares = [...compareArray];
      newCompares.push({ ...compareInfo });
      const updatedCompare = await updateCompare
        .updateData(compareId, {
          ...compareList,
          compares: [...newCompares],
        })
        .then(() => {
          const promises = [
            setCompareList({ ...compareList, compares: [...newCompares] }),
            setCompareArray([...newCompares]),
          ];

          Promise.all(promises);
        })
        .then(() => {
          handleCompareModeStart(
            currentContest.contests.id,
            realtimeCompareInfo
          );
        });
    } catch (error) {
      console.log(error);
    }
    // const propCompareInfo = {
    //   ...votedInfo,
    //   compareId: generateUUID(),
    //   categoryId: stageInfo.categoryId,
    //   gradeId: stageInfo.grades[0].gradeId,
    //   compareTitle: `${stageInfo.categoryTitle}(${
    //     stageInfo.grades[0].gradeTitle
    //   }) ${compareArray.length + 1}차 비교심사`,
    // };
    // const propVoteInfo = {
    //   contestId,
    //   compares: [{ ...propCompareInfo }],
    // };

    // try {
    //   await addCompare.addData({ ...propVoteInfo }).then((data) => {
    //     handleCompareModeStart(propCollection, propCompareIndex, {
    //       ...propCompareInfo,
    //       refCompareId: data.id,
    //     });
    //   });
    // } catch (error) {
    //   console.log(error);
    // }
  };

  useEffect(() => {
    console.log(votedInfo);
  }, [votedInfo]);

  useEffect(() => {
    console.log(stageInfo);
    console.log(currentContest);
    if (
      stageInfo.grades[0].gradeId &&
      currentContest.contests.contestComparesListId
    ) {
      fetchPool(
        stageInfo.grades[0].gradeId,
        currentContest.contests.contestComparesListId,
        currentContest.contests.contestJudgesAssignId
      );
    }
  }, [
    stageInfo.grades[0].gradeId,
    currentContest.contests.contestComparesListId,
  ]);

  return (
    <>
      <div className="flex w-full h-full flex-col bg-white justify-start items-center p-5 gap-y-2">
        {!isLoading && (
          <>
            <div className="flex text-2xl font-bold  bg-blue-300 rounded-lg w-full h-auto justify-center items-center text-gray-700 flex-col p-2 gap-y-2">
              <ConfirmationModal
                isOpen={msgOpen}
                message={message}
                onCancel={() => setMsgOpen(false)}
                onConfirm={() => {
                  setClose(false);
                  setMsgOpen(false);
                }}
              />
              <div className="flex w-full bg-blue-100 rounded-lg py-3 flex-col">
                <div className="flex w-full h-auto justify-center items-center">
                  <div className="flex w-24 h-auto"> </div>
                  <div className="flex w-full h-auto justify-center items-center">
                    <span>
                      {stageInfo?.categoryTitle}(
                      {stageInfo?.grades[0]?.gradeTitle}){" "}
                    </span>
                    <span className="pl-5 pr-2">
                      {compareArray?.length + 1 || 1}차
                    </span>
                    <span> 비교심사 설정</span>
                  </div>
                  <div className="flex w-24 h-auto justify-start px-3">
                    <button
                      className="w-full text-base font-normal bg-red-400 p-2 rounded-lg text-gray-100"
                      onClick={() => setClose(() => false)}
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex w-full bg-gray-100 rounded-lg py-3 flex-col text-xl">
                <div className="flex w-full h-auto px-5 py-2">
                  <div
                    className="flex h-auto justify-start items-center"
                    style={{ width: "10%", minWidth: "230px" }}
                  >
                    심사대상 인원수 설정
                  </div>
                  <div className="flex h-auto justify-center items-center gap-2 text-lg flex-wrap box-border">
                    <button
                      value={3}
                      onClick={(e) => {
                        setVotedInfo(() => ({
                          ...votedInfo,
                          playerLength: parseInt(e.target.value),
                        }));
                        setIsVotedPlayerLengthInput(false);
                      }}
                      className={`${
                        votedInfo.playerLength === 3
                          ? "bg-blue-500 p-2 rounded-lg border border-blue-600 text-gray-100"
                          : "bg-white p-2 rounded-lg border border-blue-200"
                      }`}
                      style={{ minWidth: "80px" }}
                    >
                      TOP 3
                    </button>
                    <button
                      value={5}
                      onClick={(e) => {
                        setVotedInfo(() => ({
                          ...votedInfo,
                          playerLength: parseInt(e.target.value),
                        }));
                        setIsVotedPlayerLengthInput(false);
                      }}
                      className={`${
                        votedInfo.playerLength === 5
                          ? "bg-blue-500 p-2 rounded-lg border border-blue-600 text-gray-100"
                          : "bg-white p-2 rounded-lg border border-blue-200"
                      }`}
                      style={{ minWidth: "80px" }}
                    >
                      TOP 5
                    </button>
                    <button
                      value={7}
                      onClick={(e) => {
                        setVotedInfo(() => ({
                          ...votedInfo,
                          playerLength: parseInt(e.target.value),
                        }));
                        setIsVotedPlayerLengthInput(false);
                      }}
                      className={`${
                        votedInfo.playerLength === 7
                          ? "bg-blue-500 p-2 rounded-lg border border-blue-600 text-gray-100"
                          : "bg-white p-2 rounded-lg border border-blue-200"
                      }`}
                      style={{ minWidth: "80px" }}
                    >
                      TOP 7
                    </button>
                    <button
                      className={`${
                        isVotedPlayerLengthInput
                          ? "bg-blue-500 p-2 rounded-lg border border-blue-600 text-gray-100"
                          : "bg-white p-2 rounded-lg border border-blue-200"
                      }`}
                      onClick={() => {
                        setIsVotedPlayerLengthInput(
                          () => !isVotedPlayerLengthInput
                        );
                        setVotedInfo(() => ({
                          ...votedInfo,
                          playerLength: undefined,
                        }));
                      }}
                    >
                      직접입력
                    </button>
                    {isVotedPlayerLengthInput && (
                      <div className="flex">
                        <input
                          type="number"
                          name="playerLength"
                          className="w-auto h-auto p-2 rounded-lg border border-blue-600 text-center"
                          style={{ maxWidth: "80px" }}
                          onChange={(e) => {
                            setVotedInfo(() => ({
                              ...votedInfo,
                              playerLength: parseInt(e.target.value),
                            }));
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex w-full h-auto px-5 py-2">
                  <div
                    className="flex h-auto justify-start items-center"
                    style={{ width: "10%", minWidth: "230px" }}
                  >
                    채점모드 설정
                  </div>
                  <div className="flex w-full flex-col gap-y-1">
                    <div className="flex h-auto justify-start items-center gap-2 text-lg">
                      <button
                        value="all"
                        onClick={(e) => {
                          setVotedInfo(() => ({
                            ...votedInfo,
                            scoreMode: e.target.value,
                          }));
                        }}
                        className={`${
                          votedInfo.scoreMode === "all"
                            ? "bg-blue-500 p-2 rounded-lg border border-blue-600 text-gray-100"
                            : "bg-white p-2 rounded-lg border border-blue-200"
                        }`}
                        style={{ minWidth: "80px" }}
                      >
                        전체
                      </button>
                      <button
                        value="compare"
                        onClick={(e) => {
                          setVotedInfo(() => ({
                            ...votedInfo,
                            scoreMode: e.target.value,
                          }));
                        }}
                        className={`${
                          votedInfo.scoreMode === "compare"
                            ? "bg-blue-500 p-2 rounded-lg border border-blue-600 text-gray-100"
                            : "bg-white p-2 rounded-lg border border-blue-200"
                        }`}
                        style={{ minWidth: "80px" }}
                      >
                        비교심사
                      </button>
                    </div>
                    <div className="flex">
                      {votedInfo.scoreMode === "all" && (
                        <div className="flex justify-start items-center gap-x-2 ml-2">
                          <span className="text-lg text-blue-700">
                            <MdLiveHelp />
                          </span>
                          <span className="text-base font-semibold">
                            출전선수 전원 채점을 완료해야합니다.
                          </span>
                        </div>
                      )}
                      {votedInfo.scoreMode === "compare" && (
                        <div className="flex justify-start items-center gap-x-2 ml-2">
                          <span className="text-lg text-blue-700">
                            <MdLiveHelp />
                          </span>
                          <span className="text-base font-semibold">
                            비교심사 대상만 채점합니다. 나머지 선수는 순위외
                            처리됩니다.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex w-full h-auto px-5 py-2">
                  {votedInfo.playerLength !== undefined &&
                    votedInfo.scoreMode !== undefined && (
                      <button
                        className="w-full h-auto px-5 py-2 bg-blue-500 rounded-lg text-gray-100"
                        onClick={() =>
                          handleAdd(
                            currentContest.contests.id,
                            currentContest.contests.contestComparesListId
                          )
                        }
                      >
                        비교심사 투표개시
                      </button>
                    )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CompareSetting;
