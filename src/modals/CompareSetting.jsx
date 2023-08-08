import React from "react";
import { useState } from "react";
import LoadingPage from "../pages/LoadingPage";
import { useEffect } from "react";
import { isNumber } from "lodash";
import { MdLiveHelp } from "react-icons/md";
import { useFirebaseRealtimeUpdateData } from "../hooks/useFirebaseRealtime";
import { generateUUID } from "../functions/functions";
import { useFirestoreAddData } from "../hooks/useFirestores";

const CompareSetting = ({ stageInfo, contestId, setClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [compareArray, setCompareArray] = useState([]);
  const [votedInfo, setVotedInfo] = useState({
    playerLength: undefined,
    scoreMode: undefined,
  });
  const [isVotedPlayerLengthInput, setIsVotedPlayerLengthInput] =
    useState(false);

  const updateRealtimeCompare = useFirebaseRealtimeUpdateData();
  const addCompare = useFirestoreAddData("contest_compare_list");

  const handleCompareModeStart = async (collectionInfo, compareIndex, data) => {
    console.log(data);
    try {
      const updatedData = await updateRealtimeCompare.updateData(
        collectionInfo,
        compareIndex,
        data
      );

      console.log(updatedData);
    } catch (error) {
      console.log(error);
    }
  };

  // firestore와 realtime저장까지는 성공했어.
  // 심판들 화면에서 compare의 값이 바뀌면 비교심사가 진행된다는 팝업을 띄우는부분부터 하면 됨
  const handleAdd = async () => {
    const propCollection = `currentStage/${contestId}/compare`;
    const propCompareIndex = compareArray.length;
    const propCompareInfo = {
      ...votedInfo,
      compareId: generateUUID(),
      categoryId: stageInfo.categoryId,
      gradeId: stageInfo.grades[0].gradeId,
      compareTitle: `${stageInfo.categoryTitle}(${
        stageInfo.grades[0].gradeTitle
      }) ${compareArray.length + 1}차 비교심사`,
    };
    const propVoteInfo = {
      contestId,
      compares: [{ ...propCompareInfo }],
    };

    try {
      await addCompare.addData({ ...propVoteInfo }).then((data) => {
        handleCompareModeStart(propCollection, propCompareIndex, {
          ...propCompareInfo,
          refCompareId: data.id,
        });
      });
    } catch (error) {
      console.log(error);
    }
  };

  console.log(contestId);
  useEffect(() => {
    console.log(votedInfo);
  }, [votedInfo]);

  return (
    <>
      <div className="flex w-full h-full flex-col bg-white justify-start items-center p-5 gap-y-2">
        {!isLoading && (
          <>
            <div className="flex text-2xl font-bold  bg-blue-300 rounded-lg w-full h-auto justify-center items-center text-gray-700 flex-col p-2 gap-y-2">
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
                        onClick={() => handleAdd()}
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
