#include "UMGManager.h"

#include "HttpModule.h"
#include "Components/PanelSlot.h"
#include "IRiveRendererModule.h"
#include "LogReactorUMG.h"
#include "ReactorUtils.h"
#include "Engine/Engine.h"
#include "Async/Async.h"
#include "Engine/AssetManager.h"
#include "Kismet/KismetRenderingLibrary.h"
#include "Rive/RiveFile.h"
#include "Engine/Font.h"
#include "Engine/StreamableManager.h"
#include "Interfaces/IHttpResponse.h"
#include "Kismet/GameplayStatics.h"

UReactorUIWidget* UUMGManager::CreateReactWidget(UWorld* World)
{
    return ::CreateWidget<UReactorUIWidget>(World);
}

UUserWidget* UUMGManager::CreateWidget(UWidgetTree* Outer, UClass* Class)
{
    return ::CreateWidget<UUserWidget>(Outer, Class);
}

void UUMGManager::SynchronizeWidgetProperties(UWidget* Widget)
{
    Widget->SynchronizeProperties();
}

void UUMGManager::SynchronizeSlotProperties(UPanelSlot* Slot)
{
    Slot->SynchronizeProperties();
}

USpineAtlasAsset* UUMGManager::LoadSpineAtlas(UObject* Context, const FString& AtlasPath, const FString& DirName)
{
    FString RawData;
    const FString AssetFilePath = ProcessAssetFilePath(AtlasPath, DirName);
    if (!FFileHelper::LoadFileToString(RawData, *AssetFilePath))
    {
        UE_LOG(LogReactorUMG, Error, TEXT("Spine atlas asset file( %s ) not exists."), *AssetFilePath);
        return nullptr;
    }
    
    USpineAtlasAsset* SpineAtlasAsset = NewObject<USpineAtlasAsset>(Context, USpineAtlasAsset::StaticClass(),
        NAME_None, RF_Public|RF_Transient);
    SpineAtlasAsset->SetRawData(RawData);
    SpineAtlasAsset->SetAtlasFileName(FName(*AssetFilePath));

    const FString BaseFilePath = FPaths::GetPath(AssetFilePath);

    // load textures
    spine::Atlas* Atlas = SpineAtlasAsset->GetAtlas();
    SpineAtlasAsset->atlasPages.Empty();

    spine::Vector<spine::AtlasPage*> &Pages = Atlas->getPages();
    for (size_t i = 0; i < Pages.size(); ++i)
    {
        spine::AtlasPage *P = Pages[i];
        const FString SourceTextureFilename = FPaths::Combine(*BaseFilePath, UTF8_TO_TCHAR(P->name.buffer()));
        UTexture2D *texture = UKismetRenderingLibrary::ImportFileAsTexture2D(SpineAtlasAsset, SourceTextureFilename);
        SpineAtlasAsset->atlasPages.Add(texture); 
    }
    
    return SpineAtlasAsset;
}

USpineSkeletonDataAsset* UUMGManager::LoadSpineSkeleton(UObject* Context, const FString& SkeletonPath, const FString& DirName)
{
    TArray<uint8> RawData;
    const FString AssetFilePath = ProcessAssetFilePath(SkeletonPath, DirName);
    if (!FFileHelper::LoadFileToArray(RawData, *AssetFilePath, 0))
    {
        UE_LOG(LogReactorUMG, Error, TEXT("Spine skeleton asset file( %s ) not exists."), *AssetFilePath);
        return nullptr;
    }

    USpineSkeletonDataAsset* SkeletonDataAsset = NewObject<USpineSkeletonDataAsset>(Context,
            USpineSkeletonDataAsset::StaticClass(), NAME_None, RF_Transient | RF_Public);
    
    SkeletonDataAsset->SetSkeletonDataFileName(FName(*AssetFilePath));
    SkeletonDataAsset->SetRawData(RawData);

    return SkeletonDataAsset;
}

URiveFile* UUMGManager::LoadRiveFile(UObject* Context, const FString& RivePath, const FString& DirName)
{
    if (!IRiveRendererModule::Get().GetRenderer())
    {
        UE_LOG(
            LogReactorUMG,
            Error,
            TEXT("Unable to import the Rive file '%s': the Renderer is null"),
            *RivePath);
        return nullptr;
    }

    const FString RiveAssetFilePath = ProcessAssetFilePath(RivePath, DirName);
    if (!FPaths::FileExists(RiveAssetFilePath))
    {
        UE_LOG(
            LogReactorUMG,
            Error,
            TEXT(
                "Unable to import the Rive file '%s': the file does not exist"),
            *RiveAssetFilePath);
        return nullptr;
    }

    if (!Context)
    {
        UE_LOG(
            LogReactorUMG,
            Error,
            TEXT(
                "Unable to create the Rive file '%s': the context is null"),
            *RiveAssetFilePath);
        return nullptr;
    }

    TArray<uint8> FileBuffer;
    if (!FFileHelper::LoadFileToArray(FileBuffer, *RiveAssetFilePath)) // load entire DNA file into the array
    {
        UE_LOG(
            LogReactorUMG,
            Error,
            TEXT(
                "Unable to import the Rive file '%s': Could not read the file"),
            *RiveAssetFilePath);
        return nullptr;
    }
    
    URiveFile* RiveFile =
    NewObject<URiveFile>(Context, URiveFile::StaticClass(), NAME_None, RF_Transient | RF_Public);
    check(RiveFile);

    if (!RiveFile->EditorImport(RiveAssetFilePath, FileBuffer))
    {
        UE_LOG(LogReactorUMG, Error,
       TEXT("Failed to import the Rive file '%s': Could not import the "
            "riv file"),
        *RiveAssetFilePath);
        RiveFile->ConditionalBeginDestroy();
        return nullptr;
    }

    return RiveFile;
}

UWorld* UUMGManager::GetWorld()
{
#if WITH_EDITOR
    if (GEditor && GEditor->PlayWorld)
    {
        return GEditor->PlayWorld;
    }

    if (GEditor && GEditor->GetEditorWorldContext().World())
    {
        return GEditor->GetEditorWorldContext().World();
    }
#endif

    if (GEngine && GEngine->GetWorld())
    {
        return GEngine->GetWorld();
    }
    
    return nullptr;
}

UObject* UUMGManager::FindFontFamily(const TArray<FString>& Names, UObject* InOuter)
{
    const FString FontDir = TEXT("/ReactorUMG/FontFamily");
    for (const FString& Name : Names)
    {
        const FString FontAssetPath = FontDir / Name + TEXT(".") + Name;
        if (UFont* Font = Cast<UFont>(StaticLoadObject(UFont::StaticClass(), InOuter, *FontAssetPath)))
        {
            return Font;
        }
    }

    const FString DefaultEngineFont = TEXT("/Engine/EngineFonts/Roboto.Roboto");
    if (UFont* DefaultFont = Cast<UFont>(StaticLoadObject(UFont::StaticClass(), InOuter, *DefaultEngineFont)))
    {
        return DefaultFont;
    }
    
    return nullptr;
}

FVector2D UUMGManager::GetWidgetGeometrySize(UWidget* Widget)
{
    if (!Widget)
    {
        return FVector2D::ZeroVector;
    }
    
    const FGeometry Geometry = Widget->GetPaintSpaceGeometry();
    const auto Size = Geometry.GetAbsoluteSize();
    FVector2D Result;
    Result.X = Size.X;
    Result.Y = Size.Y;
    return Result;
}

void UUMGManager::LoadBrushImageObject(const FString& ImagePath, FAssetLoadedDelegate OnLoaded,
    FEasyDelegate OnFailed, UObject* Context, bool bIsSyncLoad, const FString& DirName)
{
    if (ImagePath.StartsWith(TEXT("/")))
    {
        // 处理UE资产包路径 
        LoadImageBrushAsset(ImagePath, Context, bIsSyncLoad, OnLoaded, OnFailed);
        return;
    }

    if (ImagePath.StartsWith(TEXT("http")) || ImagePath.StartsWith(TEXT("HTTP")))
    {
        // 处理网络资源
        LoadImageTextureFromURL(ImagePath, Context, bIsSyncLoad, OnLoaded, OnFailed);
        return;
    }

    const FString AbsPath = ProcessAssetFilePath(ImagePath, DirName);
    if (!FPaths::FileExists(*AbsPath))
    {
        UE_LOG(LogReactorUMG, Error, TEXT("Image file( %s ) not exists."), *AbsPath);
        return; 
    }
    
    LoadImageTextureFromLocalFile(AbsPath, Context, bIsSyncLoad, OnLoaded, OnFailed);
}

FString UUMGManager::GetAbsoluteJSContentPath(const FString& RelativePath, const FString& DirName)
{
    if (DirName.IsEmpty() || RelativePath.IsEmpty())
    {
        return RelativePath;
    }

    FString AbsolutePath = RelativePath;
    if (FPaths::IsRelative(RelativePath))
    {
        // 处理相对路径的情况
        AbsolutePath = FPaths::ConvertRelativePathToFull(DirName / RelativePath);
    }
    
    return AbsolutePath;
}

FString UUMGManager::ProcessAssetFilePath(const FString& RelativePath, const FString& DirName)
{
    if (!FPaths::FileExists(*RelativePath))
    {
        FString AbsPath = GetAbsoluteJSContentPath(RelativePath, DirName);
        if (!FPaths::FileExists(*AbsPath))
        {
            AbsPath = FReactorUtils::ConvertRelativePathToFullUsingTSConfig(RelativePath, DirName);
        }

        return AbsPath;
    }
    
    return RelativePath;
}

void UUMGManager::LoadImageBrushAsset(const FString& AssetPath, UObject* Context,
    bool bIsSyncLoad, FAssetLoadedDelegate OnLoaded, FEasyDelegate OnFailed)
{
    FSoftObjectPath SoftObjectPath(AssetPath);
    if (bIsSyncLoad)
    {
        UAssetManager::GetStreamableManager().RequestSyncLoad(SoftObjectPath);
        UObject* LoadedObject = SoftObjectPath.ResolveObject();
        if (LoadedObject)
        {
            LoadedObject->AddToCluster(Context);
            OnLoaded.ExecuteIfBound(LoadedObject);
        } else
        {
            OnFailed.ExecuteIfBound();
        }
    }else
    {
        UAssetManager::GetStreamableManager().RequestAsyncLoad(SoftObjectPath,
            FStreamableDelegate::CreateLambda([SoftObjectPath, OnLoaded, OnFailed]()
        {
                UObject* LoadedObject = SoftObjectPath.ResolveObject();
                if (LoadedObject)
                {
                    OnLoaded.ExecuteIfBound(LoadedObject);
                } else
                {
                    OnFailed.ExecuteIfBound();
                }
        }));   
    }
}

void UUMGManager::LoadImageTextureFromLocalFile(const FString& FilePath, UObject* Context,
    bool bIsSyncLoad, FAssetLoadedDelegate OnLoaded, FEasyDelegate OnFailed)
{
    if (bIsSyncLoad)
    {
        UTexture2D* Texture = UKismetRenderingLibrary::ImportFileAsTexture2D(nullptr, FilePath);
        if (Texture)
        {
            Texture->AddToCluster(Context);
            OnLoaded.ExecuteIfBound(Texture);
        } else
        {
            OnFailed.ExecuteIfBound();
        }
    }else
    {
        AsyncTask(ENamedThreads::GameThread, [FilePath, Context, OnLoaded, OnFailed]()
        {
            UTexture2D *Texture = UKismetRenderingLibrary::ImportFileAsTexture2D(nullptr, FilePath);
            if (Texture)
            {
                Texture->AddToCluster(Context);
                OnLoaded.ExecuteIfBound(Texture);
            } else
            {
                OnFailed.ExecuteIfBound();
            }
        });
    }
}

void UUMGManager::LoadImageTextureFromURL(const FString& Url, UObject* Context,
    bool bIsSyncLoad, FAssetLoadedDelegate OnLoaded, FEasyDelegate OnFailed)
{
    FHttpModule& HTTP = FHttpModule::Get();
    TSharedRef<IHttpRequest> HttpRequest = HTTP.CreateRequest();
    HttpRequest->OnProcessRequestComplete().BindLambda(
        [Url, Context, OnLoaded, OnFailed](FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful)
        {
            check(IsInGameThread());
            if (!bWasSuccessful || !Response.IsValid())
            {
                UE_LOG(LogTemp, Error, TEXT("Failed to download image."));
                OnFailed.ExecuteIfBound();
                return;
            }

            TArray<uint8> ImageData = Response->GetContent();
            UTexture2D* Texture = UKismetRenderingLibrary::ImportBufferAsTexture2D(nullptr, ImageData);
            if (Texture)
            {
                UE_LOG(LogReactorUMG, Log, TEXT("Download image file successfully for url: %s"), *Url);
                Texture->AddToCluster(Context);
                OnLoaded.ExecuteIfBound(Texture);
            } else
            {
                OnFailed.ExecuteIfBound();
            }
        });
    
    HttpRequest->SetURL(Url);
    HttpRequest->SetVerb("GET");
    HttpRequest->ProcessRequest();
}