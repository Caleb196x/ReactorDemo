/** Note: Auto-generated code, please do not make any changes */ 
import * as UE from "ue";
import { $Nullable, argv } from "puerts";
import {ReactorUMG, Root} from "reactorUMG";
import * as React from "react";
import { WBPR_YUAN } from "./WBPR_YUAN"

let container = (argv.getByName("WidgetTree") as UE.WidgetTree);
let bridgeCaller = (argv.getByName("ReactorUIWidget_BridgeCaller") as UE.JsBridgeCaller);
let customArgs = (argv.getByName("CustomArgs") as UE.CustomJSArg);

function Launch(container: $Nullable<UE.WidgetTree>) : Root {
    if (!container) {
        console.error("container is null");
        return null;
    }

    return ReactorUMG.render(
        container,
       <WBPR_YUAN/> 
    );
}

if (customArgs.bIsUsingBridgeCaller) {
    bridgeCaller.MainCaller.Bind(Launch);
    console.log("bridgeCaller finished");
} else {
    Launch(container);
    console.log("Launch finished");
}
