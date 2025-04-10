// Copyright Epic Games, Inc. All Rights Reserved.

#include "ReactorUMG.h"

#define LOCTEXT_NAMESPACE "FReactorUMGModule"

void FReactorUMGModule::StartupModule()
{
	// This code will execute after your module is loaded into memory; the exact timing is specified in the .uplugin file per-module
}

void FReactorUMGModule::ShutdownModule()
{
	// This function may be called during shutdown to clean up your module.  For modules that support dynamic reloading,
	// we call this function before unloading the module.
}

#undef LOCTEXT_NAMESPACE
	
IMPLEMENT_MODULE(FReactorUMGModule, ReactorUMG)