/** !!!Warning: Auto-generated code, please do not make any changes */ 
import * as UE from "ue";
import { $Nullable, argv } from "puerts";
import {ReactorUMG, Root} from "reactorUMG";
import * as React from "react";
import { URW_Debug2 } from "./URW_Debug2"

let bridgeCaller = (argv.getByName("ReactorUIWidget_BridgeCaller") as UE.JsBridgeCaller);
let container = (argv.getByName("WidgetTree") as UE.WidgetTree);
let customArgs = (argv.getByName("CustomArgs") as UE.CustomJSArg);
function Launch(container: $Nullable<UE.WidgetTree>) : Root {
    return ReactorUMG.render(
       container, 
       <URW_Debug2/> 
    );
}

console.log("before launch");
if (customArgs.bIsUsingBridgeCaller && bridgeCaller && bridgeCaller.MainCaller) { 
	if (bridgeCaller.MainCaller.IsBound()) {
        console.log("unBind")
		bridgeCaller.MainCaller.Unbind();
	}
    console.log("new Bind");
    bridgeCaller.MainCaller.Bind(Launch);
} else {
    console.log("direct launch");
	Launch(container);
}
argv.remove("WidgetTree", container);
argv.remove("CustomArgs", customArgs);
