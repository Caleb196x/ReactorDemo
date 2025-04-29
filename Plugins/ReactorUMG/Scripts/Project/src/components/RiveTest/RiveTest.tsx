import * as UE from "ue";
import * as React from "react";
import { Rive, Overlay } from "reactorUMG";
import background from "./assets/background.riv";
import leaves_bl from "./assets/leaves_bl.riv";
import leaves_br from "./assets/leaves_br.riv";
import leaves_tl from "./assets/leaves_tl.riv";
import leaves_tr from "./assets/leaves_tr.riv";
import logo from "./assets/logo.riv";
import settings from "./assets/settings.riv";
import rewards from "./assets/rewards.riv";
import start from "./assets/start.riv";

export class RiveTest extends React.Component {
    render() {
        /* Write your code here */
        return <Overlay>
            <Rive fitType="fill" rive={background} style={{justifySelf: "stretch", alignSelf: "stretch"}}/>
            <Rive fitType="fill" rive={leaves_bl} style={{justifySelf: "stretch", alignSelf: "stretch"}}/>
            <Rive fitType="fill" rive={leaves_br} style={{justifySelf: "stretch", alignSelf: "stretch"}}/>
            <Rive fitType="fill" rive={leaves_tl} style={{justifySelf: "stretch", alignSelf: "stretch"}}/>
            <Rive fitType="fill" rive={leaves_tr} style={{justifySelf: "stretch", alignSelf: "stretch"}}/>
            <Rive fitType="fill" rive={logo} style={{justifySelf: "center", alignSelf: "top", padding: "60px 0 0 0"}}/>

            {/* <button style={{backgroundColor: "transparent"}}>
            </button> */}
            <Overlay style={{justifySelf: "center", alignSelf: "center", padding: "0"}}>
                <Rive fitType="contain" rive={start} scale={2.0} style={{justifySelf: "center", alignSelf: "center"}}/>
                <p style={{justifySelf: "center", alignSelf: "center", padding: "0"}}>Start</p>
            </Overlay>

            <Overlay style={{justifySelf: "center", alignSelf: "center", padding: "200px 0 0 0"}}>
                <Rive fitType="contain" rive={settings} scale={2.0} style={{justifySelf: "center", alignSelf: "center"}}/>
                <p style={{fontSize: "20px", outline: "1px solid red", fontWeight: "bold", fontStyle: 'italic', justifySelf: "center", alignSelf: "center", padding: "0"}}>Settings</p>
            </Overlay>

            <Overlay style={{justifySelf: "center", alignSelf: "center", padding: "400px 0 0 0"}}>
                <Rive fitType="contain" rive={rewards} scale={2.0} style={{justifySelf: "center", alignSelf: "center"}}/>
                <p style={{justifySelf: "center", alignSelf: "center", padding: "0"}}>Rewards</p>
            </Overlay>
            <img onLoad={()=>{console.log("load")}} onError={()=>{console.log("error")}} src='https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png'/>
            {/* <button style={{backgroundColor: "transparent"}}>
            </button>

            <button style={{backgroundColor: "transparent"}}>
            </button> */}

        </Overlay>
    }
}
