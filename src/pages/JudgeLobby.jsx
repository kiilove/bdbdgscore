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
  const [currentComparesArray, setCurrentComparesArray] = useState([]);
  const [currentStageInfo, setCurrentStageInfo] = useState([]);

  const { data: realtimeData, getDocument } = useFirebaseRealtimeGetDocument();
  const updateRealtimeData = useFirebaseRealtimeUpdateData();

  const fetchPlayersFinal = useFirestoreGetDocument("contest_players_final");
  const fetchStagesAssign = useFirestoreGetDocument("contest_stages_assign");
  const fetchJudgeAssign = useFirestoreGetDocument("contest_judges_assign");
  const fetchCompareList = useFirestoreGetDocument("contest_compares_list");
  const fetchJudgePool = useFirestoreQuery();

  const fetchPool = async (
    stageId,
    judgeAssignId,
    playersFinalId,
    contestId,
    compareListId
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

      await fetchCompareList.getDocument(compareListId).then((data) => {
        if (data?.compares?.length > 0) {
          console.log(data);
          setCurrentComparesArray(() => [...data.compares]);
        }
      });
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
    playersFinalArray,
    comparesArray
  ) => {
    // console.log(
    //   stageId,
    //   machineId,
    //   stagesAssign,
    //   judgesAssign,
    //   playersFinalArray
    // );
    //console.log(comparesArray);

    let topPlayers = [];
    let compareMode = "";
    let grades = [];
    let findCurrentStage = {};
    let findCurrentJudge = {};
    let findCurrentCompare = {};

    if (stageId && stagesAssign?.length > 0) {
      findCurrentStage = stagesAssign.find((f) => f.stageId === stageId);
      //console.log(findCurrentStage);
      if (findCurrentStage?.categoryJudgeType === "ranking") {
        setCardType(() => "score");
      }
      if (findCurrentStage?.categoryJudgeType === "point") {
        setCardType(() => "point");
      }
      grades = [...findCurrentStage?.grades];

      if (machineId && grades[0].gradeId) {
        findCurrentJudge = judgesAssign.find(
          (f) =>
            f.seatIndex === machineId && f.contestGradeId == grades[0].gradeId
        );
      }
    }

    //    console.log(realtimeData?.compares?.players);
    if (
      realtimeData?.compares?.players?.length > 0 &&
      realtimeData.compares.status.compareIng
    ) {
      topPlayers = [...realtimeData.compares.players];
      console.log(topPlayers);
      compareMode = realtimeData.compares;
    }

    if (realtimeData?.compares?.compareIndex > 1) {
      //이전 회차 top선수를 찾아야하므로 -1 되어야 한다.
      findCurrentCompare = currentComparesArray.find(
        (f) => f.compareIndex === realtimeData.compares.compareIndex - 1
      );
      console.log(findCurrentCompare);
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
          topPlayers,
          findCurrentCompare?.players,
          compareMode
        ),
      ]);
    }
  };

  const makeScoreCard = (
    stageInfo,
    judgeInfo,
    grades,
    players,
    topPlayers = [],
    prevComparePlayers = [],
    realtimeComparemode = {}
  ) => {
    console.log(prevComparePlayers);
    const { stageId, stageNumber, categoryJudgeType } = stageInfo;
    const {
      judgeUid,
      judgeName,
      isHead,
      seatIndex,
      contestId,
      onedayPassword,
    } = judgeInfo;

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
      let matchedSubPlayers = [];
      let matchedNormalPlayers = [];
      let matchedExtraPlayers = [];
      let matchedTopRange = [];
      let matchedSubRange = [];
      let matchedNormalRange = [];
      let matchedExtraRange = [];

      const { categoryId, categoryTitle, gradeId, gradeTitle } = grade;
      console.log(realtimeData.compares.scoreMode);
      if (
        realtimeData.compares.scoreMode === "topOnly" &&
        topPlayers.length > 0
      ) {
        comparePlayers = [...topPlayers];
      }

      if (
        realtimeData.compares.scoreMode === "topWithSub" &&
        prevComparePlayers.length > 0
      ) {
        comparePlayers = [...prevComparePlayers];
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
        topPlayers.some((cp) => cp.playerNumber === fp.playerNumber)
      );

      //다회차 비교심사의 경우 이전 회차의 선수 명부를 그대로 받아서 처리해야하므로
      //filterPlayers를 기준으로 하면 안되고 현재의 top, 이전 회차 players 배열을 합친후에 필터링 처리하였다.
      const filterSubPlayers = comparePlayers.filter((fp) =>
        topPlayers.every((cp) => cp.playerNumber !== fp.playerNumber)
      );

      //이전에는 top을 제외한 인원을 normal로 처리하면 되었지만
      //다회차 비교심사시 한번 더 그룹화 해야하고
      //이전 차수 선수들까지는 심사그룹에 들어가야 하기 때문에 다시 한번 그룹을 나눠야 했다.
      //변수형태로 변경하여 상황에 맞춰서 normal을 처리해야한다.
      let filterNormalPlayers = [];
      let filterExtraPlayers = [];

      //topOnly로 세팅되었다면 나머지 선수를 전부 제외처리하므로
      //filterExtraPlayers topPlayers를 제외한 모든 선수를 저장해야한다.
      //topWithSub의 경우는 이전 회차 선수들까지 심사를 해야하므로 역시 normal은 빈배열을 리턴한다.
      //sub를 normal로 세팅하지 않은 이유는 전체를 다 심사해야하는 경우
      //이전 회차 선수들의 순위를 보장하기 위해 top과 sub normal로 분리 처리할 예정이다.
      //normal은 심사를 할수 있는 그룹으로 변경되었기때문에 이경우 빈배열을 세팅해야한다.
      if (
        realtimeComparemode.scoreMode === "topOnly" ||
        realtimeComparemode.scoreMode === "topWithSub"
      ) {
        filterNormalPlayers = [];
        filterExtraPlayers = filterPlayers.filter((fp) =>
          comparePlayers.every((cp) => cp.playerNumber !== fp.playerNumber)
        );
      }

      //모든 선수 심사 모드일 경우만 normalPlayers의 항목이 생성되어야한다.
      if (realtimeComparemode.scoreMode === "all") {
        filterNormalPlayers = filterPlayers.filter((fp) =>
          comparePlayers.every((cp) => cp.playerNumber !== fp.playerNumber)
        );
      }

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

      if (filterSubPlayers?.length > 0) {
        const matchedPlayers = filterSubPlayers.map((player, pIdx) => {
          const newPlayers = { ...player, playerScore: 0, playerPointArray };

          return newPlayers;
        });
        matchedSubPlayers = [...matchedPlayers];
        matchedSubRange = matchedPlayers.map((player, pIdx) => {
          return {
            scoreValue: matchedTopPlayers.length + pIdx + 1,
            scoreIndex: matchedTopPlayers.length + pIdx,
            scoreOwner: undefined,
          };
        });
      }

      if (filterNormalPlayers?.length > 0) {
        const matchedPlayers = filterNormalPlayers.map((player, pIdx) => {
          const newPlayers = { ...player, playerScore: 0, playerPointArray };

          return newPlayers;
        });
        matchedNormalPlayers = [...matchedPlayers];
        matchedNormalRange = matchedPlayers.map((player, pIdx) => {
          return {
            scoreValue:
              matchedTopPlayers.length + matchedSubPlayers.length + pIdx + 1,
            scoreIndex: matchedPlayers.length + matchedSubPlayers.length + pIdx,
            scoreOwner: undefined,
          };
        });
      }

      //extra 제외처리함
      if (filterExtraPlayers?.length > 0) {
        const matchedPlayers = filterExtraPlayers.map((player, pIdx) => {
          const newPlayers = { ...player, playerScore: 1000, playerPointArray };

          return newPlayers;
        });
        matchedExtraPlayers = [...matchedPlayers];
        matchedExtraRange = matchedPlayers.map((player, pIdx) => {
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
            if (matchedExtraPlayers?.length > 0) {
              const findMatchedExtraPlayer = matchedExtraPlayers.findIndex(
                (f) => f.playerNumber === playerNumber
              );
              if (findMatchedExtraPlayer !== -1) {
                newPlayerScore = 1000;
              }
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
        matchedSubPlayers,
        matchedSubRange,
        matchedNormalPlayers,
        matchedNormalRange,
        matchedExtraPlayers,
        matchedExtraRange,
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
    let prevTop = [];
    switch (actionType) {
      case "login":
        navigate("/scorelogin", {
          replace: true,
          state: { currentStageInfo, currentJudgeInfo, contestInfo },
        });
        break;
      // case "judge":
      //   try {
      //     await updateRealtimeData
      //       .updateData(collectionInfo, {
      //         isEnd: false,
      //         isLogined: true,
      //         seatIndex: currentJudgeInfo.seatIndex,
      //       })
      //       .then(() => {
      //         if (realtimeData.categoryJudgeType === "score") {
      //           navigate("/autoscoretable", {
      //             replace: true,
      //             state: {
      //               currentStageInfo,
      //               currentJudgeInfo,
      //               contestInfo,
      //               compareInfo: { ...realtimeData?.compares },
      //             },
      //           });
      //         }
      //         if (realtimeData.categoryJudgeType === "point") {
      //           navigate("/autopointtable", {
      //             replace: true,
      //             state: {
      //               currentStageInfo,
      //               currentJudgeInfo,
      //               contestInfo,
      //               compareInfo: { ...realtimeData?.compares },
      //             },
      //           });
      //         }
      //       });
      //   } catch (error) {
      //     console.log(error);
      //   }

      //   break;
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
                replace: false,
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

      case "ranking":
        try {
          await updateRealtimeData
            .updateData(collectionInfo, {
              isEnd: false,
              isLogined: true,
              seatIndex: currentJudgeInfo.seatIndex,
            })
            .then(() =>
              navigate("/autoscoretable", {
                replace: false,
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
        if (realtimeData?.compares?.compareIndex >= 1) {
          prevTop = [
            ...currentComparesArray[currentComparesArray.length - 1]?.players,
          ];
        }

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
                  propSubPlayers: [...prevTop],
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
            //autoClickFunction();
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
        contestInfo.id,
        contestInfo.contestComparesListId
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
        currentplayersFinalArray,
        currentComparesArray
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
    if (realtimeData?.stageId) {
      handleCurrentStageInfo(
        realtimeData.stageId,
        machineId,
        currentStagesAssign,
        currentJudgeAssign,
        currentplayersFinalArray,
        currentComparesArray
      );
    }
  }, [realtimeData?.stageId, realtimeData?.compares]);

  useEffect(() => {
    console.log(currentStageInfo);
  }, [currentStageInfo]);

  // useEffect(() => {
  //   if (!judgeLogined) {
  //     setNavigateType(() => "login");
  //   }
  //   if (judgeLogined && !compareStatus?.compareStart) {
  //     setNavigateType(() => realtimeData?.categoryJudgeType);
  //   }
  //   if (judgeLogined && compareStatus?.compareIng) {
  //     setNavigateType(() => realtimeData?.categoryJudgeType);
  //   }
  //   if (
  //     judgeLogined &&
  //     compareStatus?.compareStart &&
  //     judgeCompareVoted === "확인전"
  //   ) {
  //     setNavigateType(() => "vote");
  //   }
  // }, [compareStatus, judgeCompareVoted, judgeLogined, countdown]);

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
    console.log(navigateType);
  }, [countdown]);

  // useEffect(() => {
  //   const timeout = setTimeout(autoClickFunction, 5000); // 5초 후에 autoClickFunction 실행
  //   return () => clearTimeout(timeout); // 컴포넌트 언마운트 시 타임아웃 제거
  // }, [
  //   judgeLogined,
  //   compareStatus,
  //   judgeScoreEnd,
  //   realtimeData,
  //   judgeCompareVoted,
  // ]);
  const NavigationButton = ({ onClick, label }) => (
    <div className="flex" onClick={onClick}>
      {label}
    </div>
  );

  const autoClickFunction = () => {
    if (
      judgeLogined &&
      !compareStatus.compareStart &&
      !compareStatus.compareIng &&
      !judgeScoreEnd
    ) {
      handleNavigate({
        actionType: realtimeData?.categoryJudgeType,
      });
    } else if (judgeLogined && compareStatus.compareIng && !judgeScoreEnd) {
      handleNavigate({
        actionType: realtimeData?.categoryJudgeType,
      });
    } else if (!judgeLogined) {
      handleNavigate({ actionType: "login" });
    } else if (
      judgeLogined &&
      compareStatus.compareStart &&
      judgeCompareVoted === "확인전"
    ) {
      handleNavigate({ actionType: "vote" });
    } else if (
      judgeLogined &&
      compareStatus.compareStart &&
      judgeCompareVoted === "투표중"
    ) {
      handleNavigate({ actionType: "vote" });
    }
  };

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
                      {realtimeData?.categoryJudgeType === "point"
                        ? "점수형"
                        : "랭킹형"}{" "}
                      심사페이지로 이동합니다.
                    </span>
                    <button
                      onClick={() =>
                        handleNavigate({
                          actionType: realtimeData?.categoryJudgeType,
                        })
                      }
                      className="mt-5 px-6 py-2 bg-blue-500 text-white rounded-md  w-68 h-20 flex justify-center items-center"
                    >
                      <div className="flex w-full">
                        <span>심사화면으로 이동</span>
                      </div>
                      {/* <div className="flex  justify-center items-center w-20 h-20 relative">
                        <CgSpinner
                          className="animate-spin w-16 h-16 "
                          style={{ animationDuration: "1.5s" }}
                        />
                        <span className="absolute inset-0 flex justify-center items-center">
                          {countdown}
                        </span>
                      </div> */}
                    </button>
                  </div>
                )}
              {judgeLogined && compareStatus.compareIng && !judgeScoreEnd && (
                <div className="flex flex-col items-center gap-y-2">
                  <span className="text-2xl h-10">
                    심사페이지로 이동합니다.
                  </span>
                  <button
                    onClick={() =>
                      handleNavigate({
                        actionType: realtimeData?.categoryJudgeType,
                      })
                    }
                    className="mt-5 px-6 py-2 bg-blue-500 text-white rounded-md  w-68 h-20 flex justify-center items-center"
                  >
                    <div className="flex w-full">
                      <span>심사화면으로 이동</span>
                    </div>
                    {/* <div className="flex  justify-center items-center w-20 h-20 relative">
                      <CgSpinner
                        className="animate-spin w-16 h-16 "
                        style={{ animationDuration: "1.5s" }}
                      />
                      <span className="absolute inset-0 flex justify-center items-center">
                        {countdown}
                      </span>
                    </div> */}
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
                    {/* <div className="flex  justify-center items-center w-20 h-20 relative">
                      <CgSpinner
                        className="animate-spin w-16 h-16 "
                        style={{ animationDuration: "1.5s" }}
                      />
                      <span className="absolute inset-0 flex justify-center items-center">
                        {countdown}
                      </span>
                    </div> */}
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
                      {/* <div className="flex  justify-center items-center w-20 h-20 relative">
                        <CgSpinner
                          className="animate-spin w-16 h-16 "
                          style={{ animationDuration: "1.5s" }}
                        />
                        <span className="absolute inset-0 flex justify-center items-center">
                          {countdown}
                        </span>
                      </div> */}
                    </button>
                  </div>
                )}
              {judgeLogined &&
                compareStatus.compareStart &&
                judgeCompareVoted === "투표중" && (
                  <div className="flex flex-col items-center gap-y-2">
                    <span className="text-2xl h-10">
                      비교심사 투표가 완료되지 않았습니다.
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
                      {/* <div className="flex  justify-center items-center w-20 h-20 relative">
                        <CgSpinner
                          className="animate-spin w-16 h-16 "
                          style={{ animationDuration: "1.5s" }}
                        />
                        <span className="absolute inset-0 flex justify-center items-center">
                          {countdown}
                        </span>
                      </div> */}
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
          </div>
        </div>
      </div>
    </>
  );
};

export default JudgeLobby;
