/** Note: Automatically generate code, Do not modify it */ 
import * as UE from "ue";
import { $Nullable, argv } from "puerts";
import {ReactorUMG, Root} from "reactorUMG";
import * as React from "react";
import { RiveTest } from "./RiveTest"

let rootBlueprint = (argv.getByName("WidgetBlueprint") as UE.ReactorUMGWidgetBlueprint);
function Launch(rootBlueprint: $Nullable<UE.ReactorUMGWidgetBlueprint>) : Root {
    ReactorUMG.init(rootBlueprint);
    return ReactorUMG.render(
        <RiveTest/>  
    );
}
Launch(rootBlueprint);
rootBlueprint.ReleaseJsEnv_EditorOnly();
