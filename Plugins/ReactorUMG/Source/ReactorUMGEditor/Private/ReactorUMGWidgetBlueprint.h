#pragma once
#include "CoreMinimal.h"
#include "JsEnv.h"
#include "WidgetBlueprint.h"
#include "Components/PanelSlot.h"

#include "HAL/PlatformFilemanager.h"
#include "Misc/Paths.h"
#include "Misc/FileHelper.h"
#include "Async/TaskGraphInterfaces.h"
#include "Tickable.h"
#include "ReactorUMGWidgetBlueprint.generated.h"

DECLARE_MULTICAST_DELEGATE_ThreeParams(
	FDirectoryMonitorCallback, const TArray<FString>&, const TArray<FString>&, const TArray<FString>&);

class FDirectoryMonitor
{
public:
	FDirectoryMonitor() : bIsWatching(false) {}
	~FDirectoryMonitor() {}

	FDirectoryMonitorCallback& OnDirectoryChanged() { return OnChanged; }

	void Watch(const FString& InDirectory);
	void UnWatch();
	
private:
	FDelegateHandle DelegateHandle;

	FDirectoryMonitorCallback OnChanged;

	FString CurrentMonitorDirectory;
	
	bool bIsWatching;
};

UCLASS(BlueprintType)
class REACTORUMGEDITOR_API UReactorUMGWidgetBlueprint : public UWidgetBlueprint
{
	GENERATED_UCLASS_BODY()
public:
	UFUNCTION(BlueprintCallable, Category="ReactorUMGEditor|WidgetBlueprint")
	UPanelSlot* AddChild(UWidget* Content);
	
	UFUNCTION(BlueprintCallable, Category="ReactorUMGEditor|WidgetBlueprint")
	bool RemoveChild(UWidget* Content);
	
	UFUNCTION(BlueprintCallable, Category="ReactorUMGEditor|WidgetBlueprint")
	void ReleaseJsEnv();
	
	FORCEINLINE FString GetWidgetName()
	{
		return WidgetName;
	}

	// 在AssetEditorSubsystem的OnAssetOpenedInEditor事件中触发监听模式
	// 在在AssetEditorSubsystem的OnAssetClosedInEditor事件中结束监听模式
	void SetupMonitorForTsScripts();
	
	void SetupTsScripts(bool bForceCompile = false, bool bForceReload = false);

	void ReloadJsScripts();

	void ExecuteJsScripts();

	void CompileTsScript();
	
protected:
	UPROPERTY(BlueprintType, VisibleAnywhere, Category="ReactorUMGEditor|WidgetBlueprint")
	FString TsProjectDir;

	UPROPERTY(BlueprintType, VisibleAnywhere, Category="ReactorUMGEditor|WidgetBlueprint")
	FString TsScriptHomeFullDir;

	UPROPERTY(BlueprintType, VisibleAnywhere, Category = "ReactorUMGEditor|WidgetBlueprint")
	FString TsScriptHomeRelativeDir;

	UPROPERTY(BlueprintType, VisibleAnywhere, Category = "ReactorUMGEditor|WidgetBlueprint")
	FString WidgetName;
	
	virtual bool Rename(const TCHAR* NewName = nullptr, UObject* NewOuter = nullptr, ERenameFlags Flags = REN_None) override;
	virtual UClass* GetBlueprintClass() const override;
	virtual bool SupportedByDefaultBlueprintFactory() const override;
	
	void RenameScriptDir(const TCHAR* NewName);
	
	void RegisterBlueprintDeleteHandle();
	bool CheckLaunchJsScriptExist();
	void StartTsScriptsMonitor();
	FString GetLaunchJsScriptPath();
	
	void StopTsScriptsMonitor()
	{
		TsProjectMonitor.UnWatch();
		TsProjectMonitor.OnDirectoryChanged().Remove(TsMonitorDelegateHandle);
	}
	
	FDirectoryMonitor TsProjectMonitor;

private:
	FString LaunchJsScriptPath;
	
	TObjectPtr<UPanelSlot> RootSlot;
	
	TSharedPtr<puerts::FJsEnv> JsEnv;

	FDelegateHandle TsMonitorDelegateHandle;
	
	bool bTsScriptsChanged;
};
