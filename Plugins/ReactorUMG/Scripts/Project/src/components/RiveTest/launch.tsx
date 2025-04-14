/** Note: Automatically generate code, Do not modify it */ 
import * as UE from "ue";
import { $Nullable, argv } from "puerts";
import {ReactorUMG, Root} from "reactorUMG";
import * as React from "react";
import { RiveTest } from "./RiveTest"

let bridgeCaller = (argv.getByName("BridgeCaller") as UE.JsBridgeCaller);
let coreWidget = (argv.getByName("CoreWidget") as UE.ReactorUIWidget);
bridgeCaller.MainCaller.Bind(Launch);
coreWidget.ReleaseJsEnv();
function Launch(coreWidget: $Nullable<UE.ReactorUIWidget>) : Root {
    ReactorUMG.init(coreWidget);
    return ReactorUMG.render(
       <RiveTest/> 
    );
}
