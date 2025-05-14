/** Note: Auto-generated code, please do not make any changes */ 
import * as UE from "ue";
import { $Nullable, argv } from "puerts";
import {ReactorUMG, Root} from "reactorUMG";
import * as React from "react";
import { WBPR_YUAN } from "./WBPR_YUAN"

let rootBlueprint = (argv.getByName("WidgetBlueprint") as UE.ReactorUMGWidgetBlueprint);
function Launch(rootBlueprint: $Nullable<UE.ReactorUMGWidgetBlueprint>) : Root {
    ReactorUMG.init(rootBlueprint);
    return ReactorUMG.render(
       <WBPR_YUAN/> 
    );
}
Launch(rootBlueprint);
rootBlueprint.ReleaseJsEnv_EditorOnly();
