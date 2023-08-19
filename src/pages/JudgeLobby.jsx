import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useFirebaseRealtimeGetDocument,
  useFirebaseRealtimeUpdateData,
} from "../hooks/useFirebaseRealtime";
import { useEffect } from "react";
import { debounce } from "lodash";
import { useContext } from "react";
import { CurrentContestContext } from "../contexts/CurrentContestContext";
import { useState } from "react";
import LoadingPage from "./LoadingPage";
import ConfirmationModal from "../messageBox/ConfirmationModal";
import { FaSpinner } from "react-icons/fa";
import { CgSpinner } from "react-icons/cg";
import {
  useFirestoreGetDocument,
  useFirestoreQuery,
} from "../hooks/useFirestores";
import { Modal } from "@mui/material";
import CompareVote from "./CompareVote";
import { PointArray } from "../components/PointCard";
import { where } from "firebase/firestore";

const JudgeLobby = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [compareCountdown, setCompareCountdown] = useState(5);
  const [loginCountdown, setLoginCountdown] = useState(5);
  const [lobbyStatus, setLobbyStatus] = useState({
    isInitSetting: false,
    isLogined: false,
    isCompared: false,
    isVotedEnd: false,
    navigate: "",
    message: "",
    loadingIcon: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefresh, setIsRefresh] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [message, setMessage] = useState({});
  const [compareVoteOpen, setCompareVoteOpen] = useState(false);
  const [machineId, setMachineId] = useState(null);
  const [contestInfo, setContestInfo] = useState({});
  const [judgeLogined, setJudgeLogined] = useState(false);
  const [judgeScoreEnd, setJudgeScoreEnd] = useState(false);
  const [judgeSign, setJudgeSign] = useState("");
  const [compareStatus, setCompareStatus] = useState({});
  const [judgeCompareVoted, setJudgeCompareVoted] = useState();
  const [navigateType, setNavigateType] = useState("");
  const [cardType, setCardType] = useState("score");

  const [localJudgeUid, setLocalJudgeUid] = useState();
  const [currentplayersFinalArray, setCurrentPlayersFinalArray] = useState([]);
  const [currentStagesAssign, setCurrentStagesAssign] = useState({});
  const [currentJudgeAssign, setCurrentJudgeAssign] = useState({});
  const [currentJudgeInfo, setCurrentJudgeInfo] = useState({});
  const [judgePoolsArray, setJudgePoolsArray] = useState([]);
  const [currentStageInfo, setCurrentStageInfo] = useState([]);

  const { data: realtimeData, getDocument } = useFirebaseRealtimeGetDocument();
  const updateRealtimeData = useFirebaseRealtimeUpdateData();

  const fetchPlayersFinal = useFirestoreGetDocument("contest_players_final");
  const fetchStagesAssign = useFirestoreGetDocument("contest_stages_assign");
  const fetchJudgeAssign = useFirestoreGetDocument("contest_judges_assign");
  const fetchJudgePool = useFirestoreQuery();

  const fetchPool = async (
    stageId,
    judgeAssignId,
    playersFinalId,
    contestId
  ) => {
    console.log(contestId);
    const condition = [where("contestId", "==", contestId)];
    try {
      await fetchStagesAssign
        .getDocument(stageId)
        .then((data) => setCurrentStagesAssign([...data.stages]));

      await fetchJudgeAssign.getDocument(judgeAssignId).then((data) => {
        setCurrentJudgeAssign([...data.judges]);
      });

      await fetchPlayersFinal
        .getDocument(playersFinalId)
        .then((data) =>
          setCurrentPlayersFinalArray([
            ...data.players.filter((f) => f.playerNoShow === false),
          ])
        );

      await fetchJudgePool
        .getDocuments("contest_judges_pool", condition)
        .then((data) => {
          console.log(data);
          setJudgePoolsArray([...data]);
        });
    } catch (error) {
      console.log(error);
    } finally {
      setIsRefresh(false);
    }
  };

  const handleCurrentStageInfo = (
    stageId,
    machineId,
    stagesAssign,
    judgesAssign,
    playersFinalArray
  ) => {
    // console.log(
    //   stageId,
    //   machineId,
    //   stagesAssign,
    //   judgesAssign,
    //   playersFinalArray
    // );
    let topPlayers = [];
    let compareMode = "";
    let grades = [];
    let findCurrentStage = {};
    let findCurrentJudge = {};

    if (stageId && stagesAssign?.length > 0) {
      findCurrentStage = stagesAssign.find((f) => f.stageId === stageId);
      //console.log(findCurrentStage);
      if (findCurrentStage?.categoryJudgeType === "ranking") {
        setCardType("score");
      }
      if (findCurrentStage?.categoryJudgeType === "point") {
        setCardType("point");
      }
      grades = [...findCurrentStage?.grades];

      if (machineId && grades[0].gradeId) {
        findCurrentJudge = judgesAssign.find(
          (f) =>
            f.seatIndex === machineId && f.contestGradeId == grades[0].gradeId
        );
      }
    }

    if (
      realtimeData?.compares?.players?.length > 0 &&
      realtimeData.compares.status.compareIng
    ) {
      topPlayers = [...realtimeData.compares.players];
      compareMode = realtimeData.compares;
    }

    if (
      findCurrentStage &&
      findCurrentJudge &&
      grades.length > 0 &&
      playersFinalArray.length > 0
    ) {
      setCurrentJudgeInfo(() => ({ ...findCurrentJudge }));
      setCurrentStageInfo([
        ...makeScoreCard(
          findCurrentStage,
          findCurrentJudge,
          grades,
          playersFinalArray,
          topPlayers
        ),
      ]);
    }
  };

  const makeScoreCard = (
    stageInfo,
    judgeInfo,
    grades,
    players,
    topPlayers = []
  ) => {
    console.log(stageInfo);
    const { stageId, stageNumber, categoryJudgeType } = stageInfo;
    const {
      judgeUid,
      judgeName,
      isHead,
      seatIndex,
      contestId,
      onedayPassword,
    } = judgeInfo;

    console.log(judgePoolsArray);
    const judgeSignature = judgePoolsArray.find(
      (f) => f.judgeUid === judgeUid
    ).judgeSignature;

    //점수형에 필요한 정보를 초기화해서 선수 각자에게 부여한후 넘어간다.
    //playerspointIfno랑 변수명을 다르게 하기 위해 players를 빼고 변수명 정의
    const playerPointArray = PointArray.map((point, pIdx) => {
      const { title } = point;
      return { title, point: undefined };
    });

    const scoreCardInfo = grades.map((grade, gIdx) => {
      let comparePlayers = [];
      let matchedTopPlayers = [];
      let matchedNormalPlayers = [];
      let matchedTopRange = [];
      let matchedNormalRange = [];

      const { categoryId, categoryTitle, gradeId, gradeTitle } = grade;
      if (topPlayers.length > 0) {
        comparePlayers = [...topPlayers];
      }
      const filterPlayers = players
        .filter((player) => player.contestGradeId === gradeId)
        .sort((a, b) => a.playerIndex - b.playerIndex);

      let matchedOriginalPlayers = filterPlayers.map((player, pIdx) => {
        const newPlayers = { ...player, playerScore: 0, playerPointArray };

        return newPlayers;
      });
      let matchedOriginalRange = matchedOriginalPlayers.map((player, pIdx) => {
        return {
          scoreValue: pIdx + 1,
          scoreIndex: pIdx,
          scoreOwner: undefined,
        };
      });

      const filterTopPlayers = filterPlayers.filter((fp) =>
        comparePlayers.some((cp) => cp.playerNumber === fp.playerNumber)
      );
      const filterNormalPlayers = filterPlayers.filter((fp) =>
        comparePlayers.every((cp) => cp.playerNumber !== fp.playerNumber)
      );

      //비교심사 선정 인원있는 경우 비교심사대상 인원을 top으로 배정
      //topRange도 같이 배정
      if (filterTopPlayers?.length > 0) {
        const matchedPlayers = filterTopPlayers.map((player, pIdx) => {
          const newPlayers = { ...player, playerScore: 0, playerPointArray };

          return newPlayers;
        });
        matchedTopPlayers = [...matchedPlayers];
        matchedTopRange = matchedPlayers.map((player, pIdx) => {
          return {
            scoreValue: pIdx + 1,
            scoreIndex: pIdx,
            scoreOwner: undefined,
          };
        });
      }

      //비교심사 선정 인원있는 경우 비교심사대상 인원을 제외한 인원을 normal로 배정
      //normalRange도 같이 배정
      //normalRange를 일반형으로 정리
      if (
        filterNormalPlayers?.length > 0 &&
        realtimeData?.compares?.scoreMode !== "compare"
      ) {
        const matchedPlayers = filterNormalPlayers.map((player, pIdx) => {
          const newPlayers = { ...player, playerScore: 0, playerPointArray };

          return newPlayers;
        });
        matchedNormalPlayers = [...matchedPlayers];
        matchedNormalRange = matchedPlayers.map((player, pIdx) => {
          return {
            scoreValue: matchedTopPlayers.length + pIdx + 1,
            scoreIndex: matchedPlayers.length + pIdx,
            scoreOwner: undefined,
          };
        });
      }

      //normalRange를 일반형으로 정리
      if (
        filterNormalPlayers?.length > 0 &&
        realtimeData?.compares?.scoreMode === "compare"
      ) {
        const matchedPlayers = filterNormalPlayers.map((player, pIdx) => {
          const newPlayers = { ...player, playerScore: 1000, playerPointArray };

          return newPlayers;
        });
        matchedNormalPlayers = [...matchedPlayers];
        matchedNormalRange = matchedPlayers.map((player, pIdx) => {
          return {
            scoreValue: 1000,
            scoreIndex: matchedPlayers.length + pIdx,
            scoreOwner: "noId",
          };
        });

        //matchedOriginalPlayers도 여기에서 1000등으로 세팅해서 넘어간다.
        const newMatchedOriginalPlayers = matchedOriginalPlayers.map(
          (player, pIdx) => {
            let newPlayerScore = player.playerScore;
            const { playerNumber } = player;
            const findMatchedNormalPlayer = matchedNormalPlayers.findIndex(
              (f) => f.playerNumber === playerNumber
            );
            if (findMatchedNormalPlayer !== -1) {
              newPlayerScore = 1000;
            }

            return { ...player, playerScore: newPlayerScore };
          }
        );
        matchedOriginalPlayers = [...newMatchedOriginalPlayers];
      }

      //top, normal이 모두 없는 경우는 비교심시가 아니거나 아직 명단 확정이 안되었다고 가정
      //top은 빈배열로 정의하고 normal에 체급에 해당하는 선수 모두 배정
      if (filterTopPlayers.length === 0 && filterNormalPlayers.length === 0) {
        matchedTopPlayers = [];
        matchedTopRange = [];
        matchedNormalPlayers = [...matchedOriginalPlayers];

        matchedNormalRange = matchedOriginalPlayers.map((player, pIdx) => {
          return {
            scoreValue: pIdx + 1,
            scoreIndex: pIdx,
            scoreOwner: undefined,
          };
        });
      }

      return {
        contestId,
        stageId,
        stageNumber,
        categoryId,
        categoryTitle,
        categoryJudgeType,
        gradeId,
        gradeTitle,
        originalPlayers: matchedOriginalPlayers,
        originalRange: matchedOriginalRange,
        judgeUid,
        judgeName,
        judgeSignature,
        onedayPassword,
        isHead,
        seatIndex,
        matchedTopPlayers,
        matchedTopRange,
        matchedNormalPlayers,
        matchedNormalRange,
      };
    });

    return scoreCardInfo;
  };

  const handleMachineCheck = () => {
    const savedCurrentContest = localStorage.getItem("currentContest");
    const loginedJudgeUid = localStorage.getItem("loginedUid");
    if (savedCurrentContest) {
      console.log(savedCurrentContest);
      setMachineId(JSON.parse(savedCurrentContest).machineId);
      setContestInfo(JSON.parse(savedCurrentContest).contests);
      if (loginedJudgeUid) {
        setLocalJudgeUid(JSON.parse(loginedJudgeUid));
      }
    } else {
      setIsLoading(false);
      setMessage({
        body: "기기 초기값이 설정되지 않았습니다.",
        body2: "관리자 로그인페이지로 이동합니다.",
        isButton: true,
        confirmButtonText: "확인",
      });
      setMsgOpen(true);
    }
  };

  const handleLoginCheck = (judgeUid, currentJudgeUid) => {
    if (!judgeUid) {
      setJudgeLogined(false);
    }

    if (judgeUid !== currentJudgeUid) {
      setJudgeLogined(false);
    }

    if (judgeUid === currentJudgeUid) {
      setJudgeLogined(true);
    }
  };

  const handleMsgClose = () => {
    navigate("/adminlogin");
    setMsgOpen(false);
  };

  const handleNavigate = async ({ actionType }) => {
    const collectionInfo = `currentStage/${contestInfo.id}/judges/${
      currentJudgeInfo.seatIndex - 1
    }`;
    switch (actionType) {
      case "login":
        navigate("/scorelogin", {
          replace: true,
          state: { currentStageInfo, currentJudgeInfo, contestInfo },
        });
        break;
      case "judge":
        try {
          await updateRealtimeData
            .updateData(collectionInfo, {
              isEnd: false,
              isLogined: true,
              seatIndex: currentJudgeInfo.seatIndex,
            })
            .then(() => {
              if (cardType === "score") {
                navigate("/autoscoretable", {
                  replace: true,
                  state: {
                    currentStageInfo,
                    currentJudgeInfo,
                    contestInfo,
                    compareInfo: { ...realtimeData?.compares },
                  },
                });
              }
              if (cardType === "point") {
                navigate("/autopointtable", {
                  replace: true,
                  state: {
                    currentStageInfo,
                    currentJudgeInfo,
                    contestInfo,
                    compareInfo: { ...realtimeData?.compares },
                  },
                });
              }
            });
        } catch (error) {
          console.log(error);
        }

        break;
      case "point":
        try {
          await updateRealtimeData
            .updateData(collectionInfo, {
              isEnd: false,
              isLogined: true,
              seatIndex: currentJudgeInfo.seatIndex,
            })
            .then(() =>
              navigate("/autopointtable", {
                replace: true,
                state: {
                  currentStageInfo,
                  currentJudgeInfo,
                  contestInfo,
                  compareInfo: { ...realtimeData?.compares },
                },
              })
            );
        } catch (error) {
          console.log(error);
        }

        break;
      case "vote":
        const collectionInfoVote = `currentStage/${
          contestInfo.id
        }/compares/judges/${currentJudgeInfo.seatIndex - 1}`;
        try {
          await updateRealtimeData
            .updateData(collectionInfoVote, {
              messageStatus: "투표중",
              seatIndex: currentJudgeInfo.seatIndex,
            })
            // .then(async () => {
            //   await updateRealtimeData.updateData(collectionInfo, {
            //     isEnd: false,
            //     isLogined: true,
            //     seatIndex: currentJudgeInfo.seatIndex,
            //   });
            // })
            // 여기서 건드렸더니 오류가 남 compareVote에 진입했을때 변경하거나
            // compareVote를 저장했을때 변경하도록 해야겠어.
            .then(() =>
              navigate("/comparevote", {
                replace: true,
                state: {
                  currentStageInfo,
                  currentJudgeInfo,
                  contestInfo,
                  compareInfo: { ...realtimeData?.compares },
                },
              })
            );
        } catch (error) {
          console.log(error);
        }

        break;
      default:
        break;
    }
  };

  useEffect(() => {
    let timer;

    if (realtimeData?.stageId) {
      timer = setInterval(() => {
        setCountdown((prevCount) => {
          if (prevCount < 0) {
            return 5;
          }
          return prevCount - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer); // cleanup
  }, [realtimeData?.stageId]);

  useEffect(() => {
    if (contestInfo?.id) {
      // Debounce the getDocument call to once every second
      const debouncedGetDocument = debounce(
        () => getDocument(`currentStage/${contestInfo.id}`),
        2000
      );
      debouncedGetDocument();
    }
  }, [getDocument, contestInfo]);

  useEffect(() => {
    if (contestInfo.id && isRefresh) {
      fetchPool(
        contestInfo.contestStagesAssignId,
        contestInfo.contestJudgesAssignId,
        contestInfo.contestPlayersFinalId,
        contestInfo.id
      );
    }
  }, [contestInfo, isRefresh]);

  useEffect(() => {
    if (realtimeData?.stageId) {
      setIsLoading(false);
      handleCurrentStageInfo(
        realtimeData.stageId,
        machineId,
        currentStagesAssign,
        currentJudgeAssign,
        currentplayersFinalArray
      );
    }
    if (realtimeData?.compares) {
      setCompareStatus(() => ({ ...realtimeData.compares.status }));
    }

    if (realtimeData?.compares?.status?.compareStart) {
      setJudgeCompareVoted(
        () => realtimeData.compares.judges[machineId - 1].messageStatus
      );
    }

    if (realtimeData?.judges[machineId - 1]) {
      setJudgeScoreEnd(() => realtimeData?.judges[machineId - 1]?.isEnd);
      console.log(judgeScoreEnd);
    }
  }, [
    currentJudgeAssign,
    currentStagesAssign,
    currentplayersFinalArray,
    realtimeData,
  ]);

  useEffect(() => {
    //console.log(currentStageInfo);
  }, [currentStageInfo]);

  useEffect(() => {
    if (!judgeLogined) {
      setNavigateType("login");
    }
    if (judgeLogined && !compareStatus?.compareStart) {
      setNavigateType("score");
    }
    if (judgeLogined && compareStatus?.compareIng) {
      setNavigateType("score");
    }
    if (
      judgeLogined &&
      compareStatus?.compareStart &&
      judgeCompareVoted === "확인전"
    ) {
      setNavigateType("vote");
    }
  }, [compareStatus, judgeCompareVoted, judgeLogined]);

  useEffect(() => {
    handleMachineCheck();
    setIsRefresh(true);
  }, []);

  useEffect(() => {
    if (localJudgeUid && currentJudgeInfo) {
      handleLoginCheck(localJudgeUid, currentJudgeInfo.judgeUid);
    }
    //console.log(currentStageInfo);
  }, [localJudgeUid, currentJudgeInfo, realtimeData?.judges]);

  useEffect(() => {
    if (countdown <= 0) {
      console.log(navigateType);
      //handleNavigate({ actionType: navigateType });
    }
  }, [countdown]);

  return (
    <>
      {isLoading && (
        <div className="flex w-full h-screen justify-center items-center bg-white">
          <LoadingPage />
        </div>
      )}
      <div className="flex w-full h-full flex-col bg-white justify-start items-center gap-y-2">
        <div
          className="flex"
          onClick={() => navigate("/setting", { replace: true })}
        >
          기기설정
        </div>
        <div className="flex text-xl font-bold  bg-gray-100 rounded-lg w-full justify-center items-center text-gray-700 flex-col  h-screen ">
          <ConfirmationModal
            isOpen={msgOpen}
            message={message}
            onCancel={handleMsgClose}
            onConfirm={handleMsgClose}
          />
          <Modal
            open={compareVoteOpen}
            onClose={() => setCompareVoteOpen(false)}
          >
            <CompareVote />
          </Modal>
          <div className="flex w-full justify-center items-center h-auto py-20 ">
            <span className="text-7xl font-sans font-bold text-gray-800">
              JUDGE
            </span>
            <span className="text-7xl font-sans font-bold text-gray-800 ml-2">
              {machineId}
            </span>
          </div>
          <div className="flex w-full justify-center items-center h-auto ">
            {realtimeData !== null && (
              <span className="text-3xl font-sans font-bold text-gray-800">
                {realtimeData?.categoryTitle}({realtimeData?.gradeTitle})
              </span>
            )}
          </div>
          <div className="flex w-full justify-center items-center h-auto py-20">
            <div className="flex w-full justify-start items-center flex-col">
              {judgeLogined &&
                !compareStatus.compareStart &&
                !compareStatus.compareIng &&
                !judgeScoreEnd && (
                  <div className="flex flex-col items-center gap-y-2">
                    <span className="text-2xl h-10">
                      심사페이지로 이동합니다.
                    </span>
                    <button
                      onClick={() => handleNavigate({ actionType: "judge" })}
                      className="mt-5 px-6 py-2 bg-blue-500 text-white rounded-md  w-68 h-20 flex justify-center items-center"
                    >
                      <div className="flex w-full">
                        <span>심사화면으로 이동</span>
                      </div>
                      <div className="flex  justify-center items-center w-20 h-20 relative">
                        <CgSpinner
                          className="animate-spin w-16 h-16 "
                          style={{ animationDuration: "1.5s" }}
                        />
                        <span className="absolute inset-0 flex justify-center items-center">
                          {countdown}
                        </span>
                      </div>
                    </button>
                  </div>
                )}
              {judgeLogined && compareStatus.compareIng && !judgeScoreEnd && (
                <div className="flex flex-col items-center gap-y-2">
                  <span className="text-2xl h-10">
                    심사페이지로 이동합니다.
                  </span>
                  <button
                    onClick={() => handleNavigate({ actionType: "judge" })}
                    className="mt-5 px-6 py-2 bg-blue-500 text-white rounded-md  w-68 h-20 flex justify-center items-center"
                  >
                    <div className="flex w-full">
                      <span>심사화면으로 이동</span>
                    </div>
                    <div className="flex  justify-center items-center w-20 h-20 relative">
                      <CgSpinner
                        className="animate-spin w-16 h-16 "
                        style={{ animationDuration: "1.5s" }}
                      />
                      <span className="absolute inset-0 flex justify-center items-center">
                        {countdown}
                      </span>
                    </div>
                  </button>
                </div>
              )}
              {!judgeLogined && (
                <div className="flex flex-col items-center gap-y-2">
                  <span className="text-2xl h-10">
                    로그인 페이지로 이동합니다.
                  </span>
                  <button
                    onClick={() => handleNavigate({ actionType: "login" })}
                    className="mt-5 px-6 py-2 bg-blue-500 text-white rounded-md  w-68 h-20 flex justify-center items-center"
                  >
                    <div className="flex w-full">
                      <span>로그인화면</span>
                    </div>
                    <div className="flex  justify-center items-center w-20 h-20 relative">
                      <CgSpinner
                        className="animate-spin w-16 h-16 "
                        style={{ animationDuration: "1.5s" }}
                      />
                      <span className="absolute inset-0 flex justify-center items-center">
                        {countdown}
                      </span>
                    </div>
                  </button>
                </div>
              )}
              {judgeLogined &&
                compareStatus.compareStart &&
                judgeCompareVoted === "확인전" && (
                  <div className="flex flex-col items-center gap-y-2">
                    <span className="text-2xl h-10">
                      비교심사가 시작됩니다.
                    </span>
                    <span className="text-2xl h-10">
                      {realtimeData?.compares?.compareIndex}차 비교심사
                      투표화면으로 이동합니다.
                    </span>
                    <button
                      onClick={() => handleNavigate({ actionType: "vote" })}
                      className="mt-5 px-6 py-2 bg-blue-500 text-white rounded-md  w-68 h-20 flex justify-center items-center"
                    >
                      <div className="flex w-full">
                        <span>투표화면</span>
                      </div>
                      <div className="flex  justify-center items-center w-20 h-20 relative">
                        <CgSpinner
                          className="animate-spin w-16 h-16 "
                          style={{ animationDuration: "1.5s" }}
                        />
                        <span className="absolute inset-0 flex justify-center items-center">
                          {countdown}
                        </span>
                      </div>
                    </button>
                  </div>
                )}
              {judgeLogined &&
                compareStatus.compareStart &&
                judgeCompareVoted === "투표완료" && (
                  <div className="flex flex-col items-center gap-y-2">
                    <span className="text-2xl h-10">
                      비교심사 투표를 집계중입니다.
                    </span>
                    <span className="text-2xl h-10">잠시만 기다려주세요.</span>
                  </div>
                )}
              {judgeScoreEnd && !compareStatus.compareStart && (
                <div className="flex flex-col items-center gap-y-2">
                  <span className="text-2xl h-10">집계중입니다.</span>
                  <span className="text-2xl h-10">잠시만 기다려주세요.</span>
                </div>
              )}
            </div>
            {/* {realtimeData?.compares?.status?.compareStart &&
                  realtimeData?.compares?.judges[machineId - 1]
                    ?.messageStatus !== "투표완료" && (
                    <div className="flex flex-col items-center">
                      <span className="text-2xl h-20">
                        {realtimeData.categoryTitle}({realtimeData.gradeTitle})
                      </span>
                      <span className="text-2xl h-20">
                        비교심사가 시작됩니다.
                      </span>
                      <button
                        onClick={() =>
                          handleNavigate({ actionType: "compareVote" })
                        }
                        className="mt-5 px-6 py-2 bg-blue-500 text-white rounded-md  w-68 h-20 flex justify-center items-center"
                      >
                        <div className="flex w-full">
                          <span>비교심사 투표창 열기</span>
                        </div>
                        <div className="flex  justify-center items-center w-20 h-20 relative">
                          <CgSpinner
                            className="animate-spin w-16 h-16 "
                            style={{ animationDuration: "1.5s" }}
                          />
                          <span className="absolute inset-0 flex justify-center items-center">
                            {compareCountdown}
                          </span>
                        </div>
                      </button>
                    </div>
                  )}
                {realtimeData?.compares?.status?.compareStart &&
                  realtimeData?.compares?.judges[machineId - 1]
                    ?.messageStatus === "투표완료" && (
                    <div className="flex flex-col items-center">
                      <span className="text-2xl h-10">
                        비교 심사 투표가 진행중입니다.
                      </span>
                      <span className="text-2xl h-10">
                        잠시만 기다려주세요.
                      </span>
                    </div>
                  )}
                {realtimeData?.compares?.status?.compareStart &&
                  realtimeData?.compares?.judges[machineId - 1]
                    ?.messageStatus === "투표완료" && (
                    <div className="flex flex-col items-center">
                      <span className="text-2xl h-10">
                        비교 심사 투표가 진행중입니다.
                      </span>
                      <span className="text-2xl h-10">
                        잠시만 기다려주세요.
                      </span>
                    </div>
                  )}

                {!realtimeData?.compares?.status?.compareStart &&
                  realtimeData?.stageId &&
                  currentStageInfo?.length > 0 &&
                  !realtimeData.judges[machineId - 1]?.isEnd && (
                    <div className="flex flex-col items-center">
                      <span className="text-2xl h-20">
                        {currentStageInfo[0].categoryTitle}(
                        {currentStageInfo[0].gradeTitle}) 경기를 시작합니다.
                      </span>
                      {currentJudgeInfo.judgeUid !== localJudgeUid ? (
                        <>
                          <span className="text-3xl">
                            심판 로그인 화면으로 이동합니다.
                          </span>
                          <button
                            onClick={() =>
                              handleNavigate({ actionType: "login" })
                            }
                            className="mt-5 px-6 py-2 bg-blue-500 text-white rounded-md  w-68 h-20 flex justify-center items-center"
                          >
                            <div className="flex w-full">
                              <span>로그인으로 이동</span>
                            </div>
                            <div className="flex  justify-center items-center w-20 h-20 relative">
                              <CgSpinner
                                className="animate-spin w-16 h-16 "
                                style={{ animationDuration: "1.5s" }}
                              />
                              <span className="absolute inset-0 flex justify-center items-center">
                                {countdown}
                              </span>
                            </div>
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-3xl">
                            심사 화면으로 이동합니다.
                          </span>
                          <button
                            onClick={() =>
                              handleNavigate({ actionType: "scoreType1" })
                            }
                            className="mt-5 px-6 py-2 bg-blue-500 text-white rounded-md  w-68 h-20 flex justify-center items-center"
                          >
                            <div className="flex w-full">
                              <span>심사로 이동</span>
                            </div>
                            <div className="flex  justify-center items-center w-20 h-20 relative">
                              <CgSpinner
                                className="animate-spin w-16 h-16 "
                                style={{ animationDuration: "1.5s" }}
                              />
                              <span className="absolute inset-0 flex justify-center items-center">
                                {countdown}
                              </span>
                            </div>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                {!realtimeData?.compares?.status?.compareStart &&
                  realtimeData?.stageId &&
                  currentStageInfo?.length > 0 &&
                  realtimeData.judges[machineId - 1]?.isEnd && (
                    <div className="flex flex-col items-center">
                      <span className="text-2xl">
                        집계중입니다. 집계가 완료되면 알려드리겠습니다.
                      </span>
                      {/* <div
                        onClick={() => handleNavigate()}
                        className="mt-5 px-6 py-2 bg-blue-500 text-white rounded-md  w-52 h-20 flex justify-center items-center"
                      >
                        <div className="flex w-full">
                          <span>이동</span>
                        </div>
                        <div className="flex  justify-center items-center w-20 h-20 relative">
                          <CgSpinner
                            className="animate-spin w-16 h-16 "
                            style={{ animationDuration: "1.5s" }}
                          />
                          <span className="absolute inset-0 flex justify-center items-center">
                            {countdown}
                          </span>
                        </div>
                       </div> */}{" "}
          </div>
        </div>
      </div>
    </>
  );
};

export default JudgeLobby;
