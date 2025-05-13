import * as UE from "ue";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { TArray } from "reactorUMG";

export const ReplayComponent = () => {
    
    const replayListSelector = useRef(null);
    const recordingSpan = useRef(null);
    const [selectedReplay, setSelectedReplay] = useState("");
    const [replayName, setReplayName] = useState("");
    const replayNameRef = useRef(replayName);
    const selectedReplayRef = useRef(selectedReplay);
    const [isRecording, setIsRecording] = useState(false);
    const isRecordingRef = useRef(isRecording);

    const handleRecording = () => {
        const name = replayNameRef.current;
        console.log("Recording: " + name);
        setIsRecording(true);
    }

    const handleStopRecording = () => {
        console.log("Stop Recording");
        setIsRecording(false);
    }

    const handlePlay = () => {
        const selected = selectedReplayRef.current;
        console.log("Play recording: " + selected);
    }

    const handleDelete = () => {
        const selected = selectedReplayRef.current;
        console.log("Delete recording: " + selected);
    }

    const handleExit = () => {
        console.log("Exit");
        UE.GameplayStatics.OpenLevel(UE.UMGManager.GetWorld(), "FirstPersonMap");
    }

    const handleReplayListChange = (e) => {
        console.log("handleReplayListChange: " + e.target.value);
        setSelectedReplay(e.target.value);
    }

    useEffect(() => {
        console.log("replayName in useEffect: " + replayName);
        replayNameRef.current = replayName;
    }, [replayName]);

    useEffect(() => {
        console.log("selectedReplay in useEffect: " + selectedReplay);
        selectedReplayRef.current = selectedReplay;
    }, [selectedReplay]);

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
                    <input type="text" placeholder="Input your replay name" value="ReplayTest" onChange={(e) => setReplayName(preVal => {
                        return e.target.value;
                    })} />
                </div>
                <button onClick={handleRecording} style={{marginLeft: "20px"}}>Recording</button>
                <button onClick={handleStopRecording} style={{marginLeft: "20px"}}>Stop</button>
                <button onClick={handleExit} style={{alignSelf: "end"}}>Exit</button>
                <span style={{visibility: isRecording ? "visible" : "hidden", margin: "0 20px 0 50px"}} ref={recordingSpan}>录制中...</span>
            </div>
            <div style={{flexDirection: "row"}}>
                <button onClick={handlePlay} style={{marginLeft: "20px"}}>Play</button>
                <button onClick={handleDelete} style={{marginLeft: "20px"}}>Delete</button>
            </div>
        </div>
    ) 
}