/*
 * Tencent is pleased to support the open source community by making Puerts available.
 * Copyright (C) 2020 THL A29 Limited, a Tencent company.  All rights reserved.
 * Puerts is licensed under the BSD 3-Clause License, except for the third-party components listed in the file 'LICENSE' which may
 * be subject to their corresponding license terms. This file is subject to the terms and conditions defined in file 'LICENSE',
 * which is part of this source code package.
 */

#pragma once

#include "CoreMinimal.h"
#include "ReactorUIWidget.h"
#include "Blueprint/UserWidget.h"
#include "Kismet/BlueprintFunctionLibrary.h"
#include "GameFramework/PlayerController.h"
#include "SpineSkeletonDataAsset.h"
#include "SpineAtlasAsset.h"
#include "Rive/RiveDescriptor.h"
#include "UMGManager.generated.h"

/**
 *
 */
UCLASS()
class REACTORUMG_API UUMGManager : public UBlueprintFunctionLibrary
{
    GENERATED_BODY()
public:
    UFUNCTION(BlueprintCallable, BlueprintCosmetic, Category = "Widget")
    static UReactorUIWidget* CreateReactWidget(UWorld* World);

    UFUNCTION(BlueprintCallable, BlueprintCosmetic, Category = "Widget")
    static UUserWidget* CreateWidget(UWorld* World, UClass* Class);

    UFUNCTION(BlueprintCallable, BlueprintCosmetic, Category = "Widget")
    static void SynchronizeWidgetProperties(UWidget* Widget);

    UFUNCTION(BlueprintCallable, BlueprintCosmetic, Category = "Widget")
    static void SynchronizeSlotProperties(UPanelSlot* Slot);

    /**
     * TODO@Caleb196x: 需要对资源加载逻辑进行优化
     * @param Context 
     * @param SkeletonPath 
     * @return 
     */
	UFUNCTION(BlueprintCallable, BlueprintCosmetic, Category = "Widget|Spine")
	static USpineSkeletonDataAsset* LoadSpineSkeleton(UObject* Context, const FString& SkeletonPath);

	UFUNCTION(BlueprintCallable, BlueprintCosmetic, Category="Widget|Spine")
	static USpineAtlasAsset* LoadSpineAtlas(UObject* Context, const FString& AtlasPath);

	UFUNCTION(BlueprintCallable, BlueprintCosmetic, Category="Widget|Rive")
	static URiveFile* LoadRiveFile(UObject* Context, const FString& RivePath);
};
