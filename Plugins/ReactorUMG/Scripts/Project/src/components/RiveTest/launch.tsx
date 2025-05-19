/** Note: Auto-generated code, please do not make any changes */ 
import * as UE from "ue";
import { $Nullable, argv } from "puerts";
import {ReactorUMG, Root} from "reactorUMG";
import * as React from "react";
import { RiveTest } from "./RiveTest"

let container = (argv.getByName("WidgetTree") as UE.WidgetTree);
let bridgeCaller = (argv.getByName("BridgeCaller") as UE.JsBridgeCaller);

function Launch(container: $Nullable<UE.WidgetTree>) : Root {
    ReactorUMG.init(container);
    return ReactorUMG.render(
       <RiveTest/> 
    );
}

if (bridgeCaller) {
    bridgeCaller.MainCaller.Bind(Launch);
} else {
    Launch(container);
}
