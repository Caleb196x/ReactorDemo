#include "UMGManager.h"

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

UReactorUIWidget* UUMGManager::CreateReactWidget(UWorld* World)
{
    return ::CreateWidget<UReactorUIWidget>(World);
}

UUserWidget* UUMGManager::CreateWidget(UWorld* World, UClass* Class)
{
    return ::CreateWidget<UUserWidget>(World, Class);
}

void UUMGManager::SynchronizeWidgetProperties(UWidget* Widget)
{
    Widget->SynchronizeProperties();
}

void UUMGManager::SynchronizeSlotProperties(UPanelSlot* Slot)
{
    Slot->SynchronizeProperties();
}

USpineAtlasAsset* UUMGManager::LoadSpineAtlas(UObject* Context, const FString& AtlasPath)
{
    FString RawData;
    if (!FFileHelper::LoadFileToString(RawData, *AtlasPath))
    {
        UE_LOG(LogReactorUMG, Error, TEXT("Spine atlas asset file( %s ) not exists."), *AtlasPath);
        return nullptr;
    }
    
    USpineAtlasAsset* SpineAtlasAsset = NewObject<USpineAtlasAsset>(Context, USpineAtlasAsset::StaticClass(),
        NAME_None, RF_Public|RF_Transient);
    SpineAtlasAsset->SetRawData(RawData);
    SpineAtlasAsset->SetAtlasFileName(FName(*AtlasPath));

    FString BaseFilePath = FPaths::GetPath(AtlasPath);

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

USpineSkeletonDataAsset* UUMGManager::LoadSpineSkeleton(UObject* Context, const FString& SkeletonPath)
{
    TArray<uint8> RawData;
    if (!FFileHelper::LoadFileToArray(RawData, *SkeletonPath, 0))
    {
        UE_LOG(LogReactorUMG, Error, TEXT("Spine skeleton asset file( %s ) not exists."), *SkeletonPath);
        return nullptr;
    }

    USpineSkeletonDataAsset* SkeletonDataAsset = NewObject<USpineSkeletonDataAsset>(Context,
            USpineSkeletonDataAsset::StaticClass(), NAME_None, RF_Transient | RF_Public);
    
    SkeletonDataAsset->SetSkeletonDataFileName(FName(*SkeletonPath));
    SkeletonDataAsset->SetRawData(RawData);

    return SkeletonDataAsset;
}

URiveFile* UUMGManager::LoadRiveFile(UObject* Context, const FString& RivePath)
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
    
    if (!FPaths::FileExists(RivePath))
    {
        UE_LOG(
            LogReactorUMG,
            Error,
            TEXT(
                "Unable to import the Rive file '%s': the file does not exist"),
            *RivePath);
        return nullptr;
    }

    TArray<uint8> FileBuffer;
    if (!FFileHelper::LoadFileToArray(FileBuffer, *RivePath)) // load entire DNA file into the array
    {
        UE_LOG(
            LogReactorUMG,
            Error,
            TEXT(
                "Unable to import the Rive file '%s': Could not read the file"),
            *RivePath);
        return nullptr;
    }
    
    URiveFile* RiveFile =
    NewObject<URiveFile>(Context, URiveFile::StaticClass(), NAME_None, RF_Transient | RF_Public);
    check(RiveFile);

    if (!RiveFile->EditorImport(RivePath, FileBuffer))
    {
        UE_LOG(LogReactorUMG, Error,
       TEXT("Failed to import the Rive file '%s': Could not import the "
            "riv file"),
        *RivePath);
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
        // LoadImageTextureFromURL
    }

    FString AbsPath = GetAbsoluteJSContentPath(ImagePath, DirName);
    if (!FPaths::FileExists(*AbsPath))
    {
        AbsPath = FReactorUtils::ConvertRelativePathToFullUsingTSConfig(ImagePath, DirName);
    }
    if (!FPaths::FileExists(*AbsPath))
    {
        UE_LOG(LogReactorUMG, Error, TEXT("Image file( %s ) not exists."), *AbsPath);
        return; 
    }
    // LoadImageTextureFromLocalFile
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
