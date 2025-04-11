#include "UMGManager.h"

#include "Components/PanelSlot.h"
#include "IRiveRendererModule.h"
#include "LogReactorUMG.h"
#include "Engine/Engine.h"
#include "Async/Async.h"
#include "Kismet/KismetRenderingLibrary.h"
#include "Rive/RiveFile.h"

UReactCoreWidget* UUMGManager::CreateReactWidget(UWorld* World)
{
    return ::CreateWidget<UReactCoreWidget>(World);
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
