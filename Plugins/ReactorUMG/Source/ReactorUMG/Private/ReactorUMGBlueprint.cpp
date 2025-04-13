#include "ReactorUMGBlueprint.h"
#include "LogReactorUMG.h"
#include "ReactorUMGBlueprintGeneratedClass.h"
#include "ReactorUMGSetting.h"
#include "AssetRegistry/AssetRegistryModule.h"
#include "ReactorUtils.h"

UReactorUMGBlueprint::UReactorUMGBlueprint(const FObjectInitializer& ObjectInitializer)
	: Super(ObjectInitializer)
{
	WidgetName = GetName();
	
	TsProjectDir = FReactorUtils::GetTypeScriptHomeDir();
	TsScriptHomeFullDir = FPaths::Combine(TsProjectDir, TEXT("src"), TEXT("components"), WidgetName);
	TsScriptHomeRelativeDir = FPaths::Combine(TEXT("src"), TEXT("components"), WidgetName);

#if WITH_EDITOR
	RegisterBlueprintDeleteHandle();
#endif
}

#if WITH_EDITOR
bool UReactorUMGBlueprint::Rename(const TCHAR* NewName, UObject* NewOuter, ERenameFlags Flags)
{
	bool Res = Super::Rename(NewName, NewOuter, Flags);
	RenameScriptDir(NewName);
	WidgetName = FString(NewName);
	return Res;
}

void UReactorUMGBlueprint::RenameScriptDir(const TCHAR* NewName)
{
	if (NewName == nullptr)
	{
		// do nothing
		return;
	}

	if (WidgetName.Equals(NewName))
	{
		return;
	}

	const FString NewTsScriptHomeRelativeDir = FPaths::Combine(TEXT("src"), TEXT("components"), NewName);
	const FString NewTsScriptHomeFullDir = FPaths::Combine(TsProjectDir, NewTsScriptHomeRelativeDir);
	
	FString PluginContentDir = FReactorUtils::GetPluginContentDir();
	const FString OldTsScriptHomeDirFullPath = TsScriptHomeFullDir;
	const FString OldJsScriptHomeDirFullPath = FPaths::Combine(PluginContentDir, TEXT("JavaScript"), TsScriptHomeRelativeDir);

	const FString NewTsScriptHomeDirFullPath = NewTsScriptHomeFullDir;
	const FString NewJsScriptHomeDirFullPath = FPaths::Combine(PluginContentDir, TEXT("JavaScript"), NewTsScriptHomeRelativeDir);

	if (FPaths::DirectoryExists(OldTsScriptHomeDirFullPath))
	{
		IFileManager::Get().Move(*NewTsScriptHomeDirFullPath,*OldTsScriptHomeDirFullPath);
	}
	else
	{
		UE_LOG(LogReactorUMG, Warning, TEXT("Not exist %s rename to %s failed"), *OldTsScriptHomeDirFullPath, *NewTsScriptHomeDirFullPath)
	}

	if (FPaths::DirectoryExists(OldJsScriptHomeDirFullPath))
	{
		IFileManager::Get().Move(*NewJsScriptHomeDirFullPath,*OldJsScriptHomeDirFullPath);
	}
	else
	{
		UE_LOG(LogReactorUMG, Warning, TEXT("Not exist %s rename to %s failed"), *OldJsScriptHomeDirFullPath, *NewJsScriptHomeDirFullPath)
	}

	TsScriptHomeFullDir = NewTsScriptHomeFullDir;
	TsScriptHomeRelativeDir = NewTsScriptHomeRelativeDir;
}

void UReactorUMGBlueprint::RegisterBlueprintDeleteHandle()
{
	IAssetRegistry& AssetRegistry = FModuleManager::LoadModuleChecked<FAssetRegistryModule>("AssetRegistry").Get();
	
	AssetRegistry.OnAssetRemoved().AddLambda([this](const FAssetData& AssetData)
	{
		const FName AssetName = AssetData.AssetName;
		if (this->GetFName() == AssetName)
		{
			FString PluginContentDir = FReactorUtils::GetPluginContentDir();
			const FString TsScriptHomeDirFullPath = TsScriptHomeFullDir;
			if (FPaths::DirectoryExists(TsScriptHomeDirFullPath))
			{
				if (!FReactorUtils::DeleteDirectoryRecursive(TsScriptHomeDirFullPath))
				{
					UE_LOG(LogReactorUMG, Warning, TEXT("Delete %s failed"), *TsScriptHomeDirFullPath);
				}
				else
				{
					UE_LOG(LogReactorUMG, Log, TEXT("Delete %s success when delete smartui blueprint %s"), *TsScriptHomeDirFullPath, *AssetName.ToString());
				}
			}

			const FString JsScriptHomeDirFullPath = FPaths::Combine(PluginContentDir, TEXT("JavaScript"), TsScriptHomeRelativeDir);
			if (FPaths::DirectoryExists(JsScriptHomeDirFullPath))
			{
				if (!FReactorUtils::DeleteDirectoryRecursive(JsScriptHomeDirFullPath))
				{
					UE_LOG(LogReactorUMG, Warning, TEXT("Delete %s failed"), *JsScriptHomeDirFullPath);
				}
				else
				{
					UE_LOG(LogReactorUMG, Log, TEXT("Delete %s success when delete smartui blueprint %s"), *JsScriptHomeDirFullPath, *AssetName.ToString());
				}
			}
			
		}
	});
}

UClass* UReactorUMGBlueprint::GetBlueprintClass() const
{
	return UReactorUMGBlueprintGeneratedClass::StaticClass();
}

bool UReactorUMGBlueprint::SupportedByDefaultBlueprintFactory() const
{
	return false;
}
#endif
