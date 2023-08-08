import { Modal } from "@mui/material";
import React from "react";
import { FaCheck } from "react-icons/fa";
import { Oval } from "react-loader-spinner";
import { BiSolidErrorCircle } from "react-icons/bi";

const AddedModal = ({ isOpen, onConfirm, onCancel, message }) => {
  const handleConfirmClick = () => {
    onConfirm();
  };

  const handleCancelClick = () => {
    onCancel();
  };
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleCancelClick();
    }
  };
  return (
    <div>
      <Modal
        open={isOpen}
        onClose={handleCancelClick}
        onBackdropClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div
          className="flex flex-col w-96 bg-white justify-center items-center absolute top-1/2 left-1/2 gap-y-2 rounded-lg border p-8"
          style={{
            transform: "translate(-50%, -50%)",
          }}
          onKeyDown={handleKeyDown}
        >
          <div className="flex flex-col gap-y-2 text-gray-800 items-center justify-start">
            {message.delete === "wait" && (
              <div className="flex justify-start items-center">
                <h2>1. 데이터 정리 준비중...</h2>
              </div>
            )}
            {message.delete === "start" && (
              <div className="flex justify-start items-center">
                <div className="flex">
                  <h2>1. 데이터 정리중</h2>
                </div>
                <div className="flex ml-2 justify-center items-center">
                  <Oval
                    height={20}
                    width={20}
                    color="#0455c0"
                    wrapperStyle={{}}
                    wrapperClass=""
                    visible={true}
                    ariaLabel="oval-loading"
                    secondaryColor="#4fa94d"
                    strokeWidth={2}
                    strokeWidthSecondary={2}
                  />
                </div>
              </div>
            )}
            {message.delete === "end" && (
              <div className="flex justify-start items-center w-full">
                <div className="flex">
                  <h2>1. 정리 완료</h2>
                </div>
                <div className="flex ml-2 justify-center items-center text-blue-800">
                  <FaCheck />
                </div>
              </div>
            )}
            {message.add === "wait" && (
              <div className="flex justify-start items-center">
                <h2>2. 데이터 저장 준비중</h2>
              </div>
            )}
            {message.add === "start" && (
              <div className="flex justify-start items-center">
                <h2>2. 데이터 저장중</h2>{" "}
              </div>
            )}
            {message.add === "end" && (
              <div className="flex justify-start items-center w-full">
                <div className="flex">
                  <h2>2. 저장 완료</h2>
                </div>
                <div className="flex ml-2 justify-center items-center text-blue-800">
                  <FaCheck />
                </div>
              </div>
            )}
            {message.validate === "wait" && (
              <div className="flex justify-start items-center">
                <h2>3. 데이터 검증 준비중</h2>
              </div>
            )}
            {message.validate === "start" && (
              <div className="flex justify-start items-center">
                <h2>3. 데이터 검증중</h2>{" "}
              </div>
            )}
            {message.validate === "fail" && (
              <div className="flex justify-start items-center w-full">
                <div className="flex">
                  <h2>3. 검증 실패</h2>
                  <span>{message.validateMsg}</span>
                </div>
                <div className="flex ml-2 justify-center items-center text-red-600">
                  <BiSolidErrorCircle />
                </div>
              </div>
            )}
            {message.validate === "end" && (
              <div className="flex justify-start items-center w-full">
                <div className="flex">
                  <h2>3. 검증 완료</h2>
                </div>
                <div className="flex ml-2 justify-center items-center text-blue-800">
                  <FaCheck />
                </div>
              </div>
            )}
          </div>
          {message.validate === "fail" && (
            <div className="flex justify-center gap-x-5 mt-5">
              <button
                className="bg-red-500 hover:bg-red-600 text-white rounded py-1 px-4 text-sm w-24 h-10"
                onClick={handleConfirmClick}
              >
                되돌아가기
              </button>
            </div>
          )}
          {message.validate === "end" && (
            <div className="flex justify-center gap-x-5 mt-5">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white rounded py-1 px-4 text-sm w-24 h-10"
                onClick={handleConfirmClick}
              >
                확인
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AddedModal;
