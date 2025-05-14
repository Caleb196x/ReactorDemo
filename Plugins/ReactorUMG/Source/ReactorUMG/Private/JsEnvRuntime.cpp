#include "JsEnvRuntime.h"

#include "LogReactorUMG.h"
#include "ReactorUtils.h"

FJsEnvRuntime::FJsEnvRuntime(int32 EnvPoolSize, int32 DebugPort)
{
	for (int32 i = 0; i < EnvPoolSize; i++)
	{
		TSharedPtr<puerts::FJsEnv> JsEnv = MakeShared<puerts::FJsEnv>(
		std::make_unique<puerts::DefaultJSModuleLoader>(TEXT("JavaScript")),
		std::make_shared<puerts::FDefaultLogger>(), DebugPort + i);
		JsRuntimeEnvPool.Add(JsEnv, 0);
	}
}

FJsEnvRuntime::~FJsEnvRuntime()
{
	/*for (auto& Pair : JsRuntimeEnvPool)
	{
		Pair.Key.Reset();
	}*/
	
	JsRuntimeEnvPool.Empty();
}

TSharedPtr<puerts::FJsEnv> FJsEnvRuntime::GetFreeJsEnv()
{
	TSharedPtr<puerts::FJsEnv> JsEnv = nullptr;
	for (auto& Pair : JsRuntimeEnvPool)
	{
		if (Pair.Value == 0)
		{
			JsEnv = Pair.Key;
			Pair.Value = 1;
			break;
		}
	}

	return JsEnv;
}

bool FJsEnvRuntime::StartJavaScript(const TSharedPtr<puerts::FJsEnv>& JsEnv, const FString& Script, const TArray<TPair<FString, UObject*>>& Arguments) const
{
	// 1. check js script legal
	if (!CheckScriptLegal(Script))
	{
		return false;
	}
	
	// 3. start js execute
	if (JsEnv)
	{
		JsEnv->Start(Script, Arguments);
		return true;
	}

	return false;
}

bool FJsEnvRuntime::CheckScriptLegal(const FString& Script) const
{
	// const FString JSContentDir = FPaths::ProjectContentDir() / TEXT("JavaScript");
	const FString FullPath = Script.EndsWith(TEXT(".js")) ? Script : Script + TEXT(".js");
	
	if (!FPaths::FileExists(FullPath))
	{
		UE_LOG(LogReactorUMG, Error, TEXT("can't find script: %s"), *Script);
		return false;
	}
	
	return true;
}

void FJsEnvRuntime::ReleaseJsEnv(TSharedPtr<puerts::FJsEnv> JsEnv)
{
	for (auto& Pair : JsRuntimeEnvPool)
	{
		auto Key = Pair.Key;
		if (Key.Get() == JsEnv.Get())
		{
			JsEnv->Release();
			Pair.Value = 0;
			break;
		}
	}
}

void FJsEnvRuntime::RestartJsScripts(
	const FString& JSContentDir, const FString& ScriptHomeDir,
	const FString& MainJsScript,  const TArray<TPair<FString, UObject*>>& Arguments
	)
{
	const FString JsScriptHomeDir = FPaths::Combine(JSContentDir, ScriptHomeDir);
	if (JsScriptHomeDir.IsEmpty() || !FPaths::DirectoryExists(JsScriptHomeDir))
	{
		UE_LOG(LogReactorUMG, Warning, TEXT("Script home directory not exists."))
		return;
	}

	IPlatformFile& PlatformFile = FPlatformFileManager::Get().GetPlatformFile();
	TArray<FString> FileNames;
	PlatformFile.FindFilesRecursively(FileNames, *JsScriptHomeDir, TEXT(""));

	TMap<FString, FString> ModuleNames;
	for (FString& SourcePath : FileNames)
	{
		if (SourcePath.EndsWith(TEXT(".js.map")))
		{
			continue;
		}
		
		FString RelativePath = SourcePath;
		FPaths::MakePathRelativeTo(RelativePath, *JSContentDir);
		RelativePath.RemoveFromStart(TEXT("JavaScript/"));

		int32 DotIndex = RelativePath.Find(TEXT("."), ESearchCase::IgnoreCase, ESearchDir::FromEnd);
		if (DotIndex != INDEX_NONE)
		{
			RelativePath.RemoveAt(DotIndex, RelativePath.Len() - DotIndex);
		}

		ModuleNames.Add(RelativePath, SourcePath);
	}

	// TODO@Caleb196x: 可以记录文件的hash值，通过对比hash值，当文件有修改时，才重新加载文件。
	for (const auto& ModulePair : ModuleNames)
	{
		FString FileContent;
		if (FReactorUtils::ReadFileContent(ModulePair.Value, FileContent))
		{
			for (auto& Pair : JsRuntimeEnvPool)
			{
				auto Env = Pair.Key;
				Env->ReloadModule(FName(*ModulePair.Key), FileContent);
				Env->ForceReloadJsFile(ModulePair.Value);
			}
		}
	}
	
	for (auto& Pair : JsRuntimeEnvPool)
	{
		auto Env = Pair.Key;
		Env->Release();
		Env->ForceReloadJsFile(MainJsScript);
		Env->Start(MainJsScript, Arguments);
	}
}