import * as UE from "ue";
import * as React from "react";
import { useEffect, useRef, useState } from "react";

export const ReplayComponent = () => {

    const recordingSpan = useRef(null);
    const [replayName, setReplayName] = useState("");
    const replayNameRef = useRef(replayName);
    const [isRecording, setIsRecording] = useState(false);
    const isRecordingRef = useRef(isRecording);

    const handleRecording = () => {
        const name = replayNameRef.current;
        console.log("Recording: " + name);
        setIsRecording(true);
    }

    const handleStopRecording = () => {
        console.log("Stop Recording: " + replayNameRef.current);
        setIsRecording(false);
    }

    const handleExit = () => {
        console.log("Exit");
        UE.GameplayStatics.OpenLevel(UE.UMGManager.GetCurrentWorld(), "FirstPersonMap");
    }

    useEffect(() => {
        console.log("isRecording in useEffect: " + isRecording);
        isRecordingRef.current = isRecording;
        if (isRecording) {
            recordingSpan.current.SetVisibility(UE.ESlateVisibility.Visible);
        } else {
            recordingSpan.current.SetVisibility(UE.ESlateVisibility.Hidden);
        }
    }, [isRecording]);

    return (
        <div style={{flexDirection: "column"}}>
            <div style={{flexDirection: "row"}}>
                
                <div style={{width: "300px", height: "50px"}}>
                    <input type="text" placeholder="Input" value="ReplayTest" onChange={(e) => {
                         const v = e.target.value; setReplayName(v); replayNameRef.current = v; 
                    }} />
                </div>
                <button onClick={handleRecording} style={{marginLeft: "20px"}}>Recording</button>
                <button onClick={handleStopRecording} style={{marginLeft: "20px"}}>Stop</button>
                <button onClick={handleExit} style={{alignSelf: "end"}}>Exit</button>
                <span style={{visibility: isRecording ? "visible" : "hidden", margin: "0 20px 0 50px"}} ref={recordingSpan}>录制中...</span>
            </div>
        </div>
    ) 
}