import React, { useEffect } from "react";
import { useState } from "react";
import LoadingPage from "../pages/LoadingPage";

const CompareSelection = ({
  stageInfo,
  setClose,
  fullMatched,
  prevMatched,
  compareList,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [originalFullMatchedPlayers, setOriginalFullMatchedPlayers] = useState(
    []
  );
  const [originalPrevMatchedPlayers, setOriginalPrevMatchedPlayers] = useState(
    []
  );
  const [fullMatchedPlayers, setFullMatchedPlayers] = useState([]);
  const [prevMatchedPlayers, setPrevMatchedPlayers] = useState([]);
  const [compareArray, setCompareArray] = useState([]);
  const [votedPlayers, setVotedPlayers] = useState([]);
  console.log(fullMatched);

  const initMatched = () => {
    const promises = [
      setFullMatchedPlayers(fullMatched),
      setOriginalFullMatchedPlayers(fullMatched),
      setPrevMatchedPlayers(prevMatched),
      setOriginalPrevMatchedPlayers(prevMatched),
      setCompareArray(compareList),
      setIsLoading(false),
    ];
    Promise.all(promises);
  };

  const handleVotedPlayers = (playerUid, playerNumber) => {
    if (!playerUid && !playerNumber) {
      return;
    }
    const newVoted = [...votedPlayers];
    const newPrevMatched = [...prevMatchedPlayers];
    const newFullMatched = [...fullMatchedPlayers];
    const votedInfo = { playerUid, playerNumber };

    newVoted.push({ ...votedInfo });

    if (prevMatchedPlayers?.length > 0) {
      const findIndexPrevMatched = newPrevMatched.findIndex(
        (f) => f.playerUid === playerUid
      );
      newPrevMatched.splice(findIndexPrevMatched, 1);
    }

    if (fullMatchedPlayers?.length > 0) {
      const findIndexFullMatched = newFullMatched.findIndex(
        (f) => f.playerUid === playerUid
      );
      newFullMatched.splice(findIndexFullMatched, 1);
    }

    const promises = [
      setVotedPlayers(() => [...newVoted]),
      setPrevMatchedPlayers(() => [...newPrevMatched]),
      setFullMatchedPlayers(() => [...newFullMatched]),
    ];

    Promise.all(promises);
  };

  const handleUnVotedPlayers = (playerUid, playerNumber) => {
    if (!playerUid && !playerNumber) {
      return;
    }
    const newVoted = votedPlayers.filter((f) => f.playerUid !== playerUid);
    const newPrevMatched = [...prevMatchedPlayers];
    const newFullMatched = [...fullMatchedPlayers];

    const findPrevMatchedPlayers = originalPrevMatchedPlayers.find(
      (f) => f.playerUid === playerUid
    );

    const findFullMatchedPlayers = originalFullMatchedPlayers.find(
      (f) => f.playerUid === playerUid
    );

    if (findPrevMatchedPlayers !== undefined) {
      newPrevMatched.push({ ...findPrevMatchedPlayers });
    }

    if (findFullMatchedPlayers !== undefined) {
      newFullMatched.push({ ...findFullMatchedPlayers });
    }

    const promises = [
      setVotedPlayers(() => [...newVoted]),
      setPrevMatchedPlayers(() => [...newPrevMatched]),
      setFullMatchedPlayers(() => [...newFullMatched]),
    ];

    Promise.all(promises);
  };

  useEffect(() => {
    initMatched();
  }, []);

  return (
    <>
      {isLoading && (
        <div className="flex w-full h-screen justify-center items-center bg-white">
          <LoadingPage />
        </div>
      )}
      <div className="flex w-full h-full flex-col bg-white justify-start items-center p-5 gap-y-2">
        {!isLoading && (
          <>
            <div className="flex text-xl font-bold  bg-blue-300 rounded-lg w-full h-auto justify-center items-center text-gray-700 flex-col p-2 gap-y-2">
              <div className="flex w-full bg-blue-100 rounded-lg py-3 flex-col">
                <div className="flex w-full h-auto justify-center items-center">
                  <span>
                    {stageInfo.categoryTitle}({stageInfo.grades[0].gradeTitle}){" "}
                  </span>
                  <span className="pl-5 pr-2">
                    {compareArray?.length + 1 || 1}차
                  </span>
                  <span> 비교심사 투표</span>
                </div>
                <div className="flex w-full h-auto justify-center items-center text-3xl font-extrabold">
                  TOP 5 결정
                </div>
              </div>
              <div className="flex w-full h-auto justify-center items-start flex-col text-base font-normal">
                <div className="flex flex-col w-full h-auto p-2 bg-blue-100 rounded-lg">
                  <div className="flex w-full justify-start items-center">
                    <span>투표한 인원수 : {votedPlayers.length || 0}명</span>
                    <span className="mx-3"> / </span>
                    <span>남은 인원수 : {5 - votedPlayers.length}명</span>
                  </div>
                  <div className="flex w-full h-auto p-2 justify-start items-center">
                    {votedPlayers?.length > 0 ? (
                      <div className="flex w-5/6 h-auto flex-wrap box-border">
                        {votedPlayers
                          .sort((a, b) => a.playerIndex - b.playerIndex)
                          .map((voted, vIdx) => {
                            const { playerUid, playerNumber } = voted;

                            return (
                              <div className="flex w-auto h-auto p-2 flex-col gap-y-2">
                                <div className="flex w-20 h-20 rounded-lg bg-blue-500 justify-center items-center font-semibold border-2 border-blue-800 flex-col text-4xl text-gray-100">
                                  {playerNumber}
                                </div>
                                <button
                                  className="flex w-20 h-auto justify-center items-center bg-red-500 rounded-lg border-2 border-red-600 text-white text-sm"
                                  onClick={() =>
                                    handleUnVotedPlayers(
                                      playerUid,
                                      playerNumber
                                    )
                                  }
                                >
                                  <span>취소</span>
                                </button>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="flex w-full h-auto flex-wrap box-border">
                        <div className="flex w-full h-auto p-2 flex-col gap-y-2 text-lg justify-center items-center">
                          선수목록에서 선수번호를 터치해주세요.
                        </div>
                      </div>
                    )}
                  </div>
                  {5 - votedPlayers.length === 0 && (
                    <div className="flex 1/6">제출</div>
                  )}
                </div>
              </div>
            </div>
            {compareArray?.length > 0 && (
              <div className="flex w-full h-auto p-2 bg-blue-400 rounded-lg flex-col gap-y-2">
                <div className="flex bg-blue-100 w-full h-auto p-2 rounded-lg">
                  n차 비교심사 명단
                </div>
                <div className="flex bg-blue-100 w-full h-auto p-2 rounded-lg">
                  <div className="flex w-20 h-20 rounded-lg bg-white justify-center items-center font-semibold border-2 border-blue-400 flex-col text-4xl">
                    13
                  </div>
                </div>
              </div>
            )}

            <div className="flex w-full h-auto p-2 bg-gray-400 rounded-lg flex-col gap-y-2">
              <div className="flex bg-gray-100 w-full h-auto p-2 rounded-lg">
                전체 선수명단
              </div>
              <div className="flex bg-gray-100 w-full h-auto p-2 rounded-lg gap-2 flex-wrap box-border">
                {fullMatchedPlayers?.length > 0 &&
                  fullMatchedPlayers
                    .sort((a, b) => a.playerIndex - b.playerIndex)
                    .map((matched, mIdx) => {
                      const { playerUid, playerNumber } = matched;

                      return (
                        <button
                          className="flex w-20 h-20 rounded-lg bg-white justify-center items-center font-semibold border-2 border-gray-400 flex-col text-4xl"
                          onClick={() =>
                            handleVotedPlayers(playerUid, playerNumber)
                          }
                        >
                          {playerNumber}
                        </button>
                      );
                    })}
              </div>
            </div>
            <div className="flex w-full h-fulljustify-center items-center">
              <button onClick={() => setClose(false)}>닫기</button>
            </div>
          </>
        )}
      </div>
    </>
  );
};
export default CompareSelection;
