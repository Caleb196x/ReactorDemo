#pragma once
#include "JsEnv.h"

class FJsEnvRuntime
{
public:
	REACTORUMG_API static FJsEnvRuntime& GetInstance()
	{
		static FJsEnvRuntime Instance;
		return Instance;
	}

	~FJsEnvRuntime();

	TSharedPtr<puerts::FJsEnv> GetFreeJsEnv();
		
	REACTORUMG_API bool StartJavaScript(const TSharedPtr<puerts::FJsEnv>& JsEnv, const FString& Script, const TArray<TPair<FString, UObject*>>& Arguments) const;

	REACTORUMG_API bool CheckScriptLegal(const FString& Script) const;

	REACTORUMG_API void ReleaseJsEnv(TSharedPtr<puerts::FJsEnv> JsEnv);

	/**
	 * reload all javascript files under ScriptHomeDir
	 * @param ScriptHomeDir Relative path to the plugin content directory
	 */
	REACTORUMG_API void RestartJsScripts(const FString& ScriptHomeDir, const FString& MainJsScript, const TArray<TPair<FString, UObject*>>& Arguments);

private:
	FJsEnvRuntime(int32 EnvPoolSize = 1, int32 DebugPort = 8086);
	TMap<TSharedPtr<puerts::FJsEnv>, int32> JsRuntimeEnvPool;
};
