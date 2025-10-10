/** !!!Warning: Auto-generated code, please do not make any changes */ 
import * as UE from "ue";
import { $Nullable, argv } from "puerts";
import {ReactorUMG, Root} from "reactorUMG";
import * as React from "react";
import { RW_Debug } from "./RW_Debug"

let bridgeCaller = (argv.getByName("ReactorUIWidget_BridgeCaller") as UE.JsBridgeCaller);
let container = (argv.getByName("WidgetTree") as UE.WidgetTree);
let customArgs = (argv.getByName("CustomArgs") as UE.CustomJSArg);
function Launch(container: $Nullable<UE.WidgetTree>) : Root {
    ReactorUMG.init(container);
    return ReactorUMG.render(
       <RW_Debug/> 
    );
}

if (customArgs.bIsUsingBridgeCaller && bridgeCaller && bridgeCaller.MainCaller) { 
	if (bridgeCaller.MainCaller.IsBound()) {
		bridgeCaller.MainCaller.Unbind();
	}
    bridgeCaller.MainCaller.Bind(Launch);
} else { 
	Launch(container);
}
