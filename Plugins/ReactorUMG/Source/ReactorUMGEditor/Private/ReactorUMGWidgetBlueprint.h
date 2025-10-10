#pragma once
#include "CoreMinimal.h"
#include "JsEnv.h"
#include "WidgetBlueprint.h"
#include "Components/PanelSlot.h"
#include "CustomJSArg.h"
#include "HAL/PlatformFilemanager.h"
#include "Misc/Paths.h"
#include "Misc/FileHelper.h"
#include "Async/TaskGraphInterfaces.h"
#include "Tickable.h"
#include "ReactorBlueprintCompilerContext.h"
#include "ReactorUMGWidgetBlueprint.generated.h"

DECLARE_MULTICAST_DELEGATE_ThreeParams(
	FDirectoryMonitorCallback, const TArray<FString>&, const TArray<FString>&, const TArray<FString>&);

DECLARE_DYNAMIC_DELEGATE_OneParam(FCompileReportDelegate, const FString&, Message);


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
class UCompileErrorReport : public UObject
{
	GENERATED_BODY()
public:
	UPROPERTY(BlueprintType)
	FCompileReportDelegate CompileReportDelegate;
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

	UFUNCTION(Blueprintable, Category="ReactorUMGEditor|WidgetBlueprint")
	void ReportToMessageLog(const FString& Message);

	// The path of the main javascript file where the entry function is used to execute during the runtime,
	// which is the relative path of the Content/JavaScript path.
	UPROPERTY(BlueprintType, VisibleAnywhere, Category="ReactorUMGEditor|WidgetBlueprint")
	FString MainScriptPath;
	
	FORCEINLINE FString GetWidgetName()
	{
		return WidgetName;
	}

	/**
	* 1. 在AssetEditorSubsystem的OnAssetOpenedInEditor事件中触发监听模式
	* 2. 在在AssetEditorSubsystem的OnAssetClosedInEditor事件中结束监听模式
	 */
	void SetupMonitorForTsScripts();
	
	void SetupTsScripts(const FReactorUMGCompilerLog& CompilerResultsLogger, bool bForceCompile = false, bool bForceReload = false);

	void ReloadJsScripts();

	void ExecuteJsScripts();

	void CompileTsScript();
	
	UPROPERTY(BlueprintType, VisibleAnywhere, Category="ReactorUMGEditor|WidgetBlueprint")
	FString TsProjectDir;
	
	UPROPERTY(BlueprintType, VisibleAnywhere, Category="ReactorUMGEditor|WidgetBlueprint")
	FString TsScriptHomeFullDir;

	UPROPERTY(BlueprintType, VisibleAnywhere, Category="ReactorUMGEditor|WidgetBlueprint")
	FString TsScriptHomeRelativeDir;

	UPROPERTY(BlueprintType, VisibleAnywhere, Category="ReactorUMGEditor|WidgetBlueprint")
	FString WidgetName;

	UPROPERTY(BlueprintType, VisibleAnywhere, Category="ReactorUMGEditor|WidgetBlueprint")
	UCompileErrorReport* CompileErrorReporter;
	
protected:
	virtual bool Rename(const TCHAR* NewName = nullptr, UObject* NewOuter = nullptr, ERenameFlags Flags = REN_None) override;
	virtual UClass* GetBlueprintClass() const override;
	virtual bool SupportedByDefaultBlueprintFactory() const override;
	
	void RenameScriptDir(const TCHAR* NewName);
	
	void RegisterBlueprintDeleteHandle();
	bool CheckLaunchJsScriptExist();
	void StartTsScriptsMonitor();
	FString GetLaunchJsScriptPath(bool bForceFullPath = true);
	/**
	 * Repeat the script function via the bridge caller,
	 * You need to bind the function to the bridge caller in the script.
	 * @param ScriptPath 
	 */
	void ExecuteScriptFunctionViaBridgeCaller(const FString& BindName, const FString& ScriptPath);
	
	void StopTsScriptsMonitor()
	{
		TsProjectMonitor.UnWatch();
		TsProjectMonitor.OnDirectoryChanged().Remove(TsMonitorDelegateHandle);
	}
	
	FDirectoryMonitor TsProjectMonitor;

private:
	
	TObjectPtr<UCustomJSArg> CustomJSArg;
	
	FString LaunchJsScriptFullPath;

	FString JSScriptContentDir;
	
	TObjectPtr<UPanelSlot> RootSlot;
	
	TSharedPtr<puerts::FJsEnv> JsEnv;

	FDelegateHandle TsMonitorDelegateHandle;

	FString TSCompileErrorMessageBuffer;
	
	bool bTsScriptsChanged;
};
