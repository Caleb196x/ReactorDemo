﻿#include "WidgetDeclarationGenerator.h"

#include "PropertyMacros.h"
#include "ReactorUtils.h"
#include "TypeScriptDeclarationGenerator.h"
#include "Components/PanelWidget.h"
#include "Components/Widget.h"

static FString SafeName(const FString& Name, bool firstCharLower = false)
{
	
	auto Ret = Name.Replace(TEXT(" "), TEXT(""))
				   .Replace(TEXT("-"), TEXT("_"))
				   .Replace(TEXT("/"), TEXT("_"))
				   .Replace(TEXT("("), TEXT("_"))
				   .Replace(TEXT(")"), TEXT("_"))
				   .Replace(TEXT("?"), TEXT("$"))
				   .Replace(TEXT(","), TEXT("_"));
	if (Ret.Len() > 0)
	{
		auto FirstChar = Ret[0];
		if ((TCHAR) '0' <= FirstChar && FirstChar <= (TCHAR) '9')
		{
			return TEXT("_") + Ret;
		}

		if (firstCharLower)
			Ret[0] = FChar::ToLower(Ret[0]);
	}
	
	return Ret;
}

static bool IsDelegate(PropertyMacro* InProperty)
{
	return InProperty->IsA<DelegatePropertyMacro>() || InProperty->IsA<MulticastDelegatePropertyMacro>()
#if ENGINE_MINOR_VERSION >= 23
		   || InProperty->IsA<MulticastInlineDelegatePropertyMacro>() || InProperty->IsA<MulticastSparseDelegatePropertyMacro>()
#endif
		;
}

static bool HasObjectParam(UFunction* InFunction)
{
	for (TFieldIterator<PropertyMacro> ParamIt(InFunction); ParamIt; ++ParamIt)
	{
		auto Property = *ParamIt;
		if (Property->IsA<ObjectPropertyBaseMacro>())
		{
			return true;
		}
	}
	return false;
}

static bool IsReactSupportProperty(PropertyMacro* Property)
{
	if (CastFieldMacro<ObjectPropertyMacro>(Property) || CastFieldMacro<ClassPropertyMacro>(Property) ||
		CastFieldMacro<WeakObjectPropertyMacro>(Property) || CastFieldMacro<SoftObjectPropertyMacro>(Property) ||
		CastFieldMacro<LazyObjectPropertyMacro>(Property))
		return false;
	if (auto ArrayProperty = CastFieldMacro<ArrayPropertyMacro>(Property))
	{
		return IsReactSupportProperty(ArrayProperty->Inner);
	}
	else if (auto DelegateProperty = CastFieldMacro<DelegatePropertyMacro>(Property))
	{
		return !HasObjectParam(DelegateProperty->SignatureFunction);
	}
	else if (auto MulticastDelegateProperty = CastFieldMacro<MulticastDelegatePropertyMacro>(Property))
	{
		return !HasObjectParam(MulticastDelegateProperty->SignatureFunction);
	}
	return true;
}

static bool IsPanelWidget(UWidget* CheckWidget)
{
	const UPanelWidget* PanelWidget = Cast<UPanelWidget>(CheckWidget);
	return PanelWidget == nullptr;
}

struct FReactDeclarationGenerator : public FTypeScriptDeclarationGenerator
{
	void Begin(FString Namespace) override;

	void GenReactDeclaration(const FString& ReactHomeDir);

	void GenClass(UClass* Class) override;

	void GenStruct(UStruct* Struct) override;

	void GenEnum(UEnum* Enum) override;

	void End() override;

	virtual ~FReactDeclarationGenerator()
	{
	}

	/* The following widgets are skipped when generating custom widget declarations */
	TArray<FString> PredefinedWidgets = {
		TEXT("Widget"), TEXT("UserWidget"), TEXT("PanelWidget"), TEXT("ContentWidget"), TEXT("BackgroundBlur"),
		TEXT("Border"), TEXT("Button"), TEXT("CanvasPanel"), TEXT("CheckBox"), TEXT("CircularThrobber"),
		TEXT("ComboBox"), TEXT("ComboBoxString"), TEXT("EditableText"), TEXT("EditableTextBox"), TEXT("ExpandableArea"),
		TEXT("GridPanel"), TEXT("HorizontalBox"), TEXT("Image"), TEXT("InvalidationBox"), TEXT("ListViewBase"),
		TEXT("ListView"), TEXT("MultiLineEditableText"), TEXT("MultiLineEditableTextBox"), TEXT("Overlay"), TEXT("ProgressBar"),
		TEXT("RetainerBox"), TEXT("RichTextBlock"), TEXT("ScaleBox"), TEXT("ScrollBar"), TEXT("ScrollBox"),
		TEXT("SizeBox"), TEXT("Slider"), TEXT("ScaleBox"), TEXT("SpinBox"), TEXT("TextBlock"),
		TEXT("Throbber"), TEXT("TileView"), TEXT("TreeView"), TEXT("UniformGridPanel"), TEXT("VerticalBox"),
		TEXT("WrapBox"), TEXT("PropertyViewBase"), TEXT("ReactorUIWidget"), TEXT("ReactRiveWidget"), TEXT("RiveWidget"),
		TEXT("SpineWidget ")
	};
};

void FReactDeclarationGenerator::Begin(FString Namespace)
{
	// do nothing
}

void FReactDeclarationGenerator::End()
{
	// do nothing
}

void FReactDeclarationGenerator::GenStruct(UStruct* Struct)
{
}

void FReactDeclarationGenerator::GenEnum(UEnum* Enum)
{
}

void FReactDeclarationGenerator::GenReactDeclaration(const FString& ReactHomeDir)
{
    FString Components = TEXT("exports.lazyloadComponents = {};\n");

    Output << "\n\n /* Widget declaration generated from custom widgets user defined*/ \n\n";

    for (TObjectIterator<UClass> It; It; ++It)
    {
        UClass* Class = *It;
        checkfSlow(Class != nullptr, TEXT("Class name corruption!"));
        if (Class->GetName().StartsWith("SKEL_") || Class->GetName().StartsWith("REINST_") ||
            Class->GetName().StartsWith("TRASHCLASS_") || Class->GetName().StartsWith("PLACEHOLDER_"))
        {
            continue;
        }
    	
        if (Class->IsChildOf<UWidget>())
        {
            Gen(Class);
            Components += "exports." + SafeName(Class->GetName()) + " = '" + SafeName(Class->GetName()) + "';\n";
            if (!(Class->ClassFlags & CLASS_Native))
            {
                Components += "exports.lazyloadComponents." + SafeName(Class->GetName()) + " = '" + Class->GetPathName() + "';\n";
            }
        }
    }

	const FString TSProjectDir = ReactHomeDir;
	const FString DeclarationFile = TSProjectDir / TEXT("reactorUMG/index.d.ts");
	if (FPaths::FileExists(*DeclarationFile))
	{
		FFileHelper::SaveStringToFile(ToString(), *DeclarationFile,
			FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM, &IFileManager::Get(), FILEWRITE_Append);
	}

	const FString JSContentDir = FReactorUtils::GetTSCBuildOutDirFromTSConfig(FReactorUtils::GetTypeScriptHomeDir());
	const FString ComponentsFile = JSContentDir / TEXT("src/reactorUMG/components.js");
	if (FPaths::FileExists(*ComponentsFile))
	{
		FFileHelper::SaveStringToFile(Components, *ComponentsFile,
			FFileHelper::EEncodingOptions::ForceUTF8WithoutBOM, &IFileManager::Get(), FILEWRITE_Append);
	}
}

void FReactDeclarationGenerator::GenClass(UClass* Class)
{
    if (!Class->IsChildOf<UWidget>())
        return;
	
    bool IsWidget = Class->IsChildOf<UWidget>();
	bool IsPanelWidget = Class->IsChildOf<UPanelWidget>();
    FStringBuffer StringBuffer{"", ""};
    StringBuffer << "interface " << SafeName(Class->GetName());
    if (IsWidget)
        StringBuffer << "Props";

    auto Super = Class->GetSuperStruct();

    if (Super && Super->IsChildOf<UWidget>())
    {
        Gen(Super);
        StringBuffer << " extends " << SafeName(Super->GetName());
        if (Super->IsChildOf<UWidget>())
            StringBuffer << "Props";
    }
	else if (IsPanelWidget)
	{
		StringBuffer << " extends PanelProps";
	}
    else if (IsWidget)
    {
        StringBuffer << " extends CommonProps";
    }

    StringBuffer << " {\n";

    for (TFieldIterator<PropertyMacro> PropertyIt(Class, EFieldIteratorFlags::ExcludeSuper); PropertyIt; ++PropertyIt)
    {
        auto Property = *PropertyIt;
        if (!IsReactSupportProperty(Property))
            continue;

		//UE.27上遇到一个问题,
        //引擎内置蓝图DefaultBurnIn有个FLinearColor类型的变量Foreground Color,
        //并且父类UUserWidget有个FSlateColor类型的变量ForegroundColor
        //此处SafeName去掉空格导致interface写入了父类变量名字,类型对不上,有报错,仅此一例
        //PuerTS插件DeclarationGenerator.cpp中的SafeName存在同样隐患
        FString PropertyNameSafe = SafeName(Property->GetName());
        UClass* SuperClass = Class->GetSuperClass();
        if (PropertyNameSafe != Property->GetName() &&
            SuperClass != nullptr && SuperClass->FindPropertyByName(*PropertyNameSafe) != nullptr)
        {
            UE_LOG(LogTemp, Warning, TEXT("ReactUMG, invalid property name, origin name: %s, safe name %s in super class!"), *Property->GetName(), *PropertyNameSafe);
            continue;
        }

        FStringBuffer TmpBuff;
        TmpBuff << "    " << SafeName(Property->GetName(), true) << "?: ";
        TArray<UObject*> RefTypesTmp;
        if (!IsWidget && IsDelegate(Property))    // UPanelSlot skip delegate
        {
            continue;
        }
    	
        if (CastFieldMacro<StructPropertyMacro>(Property))
        {
            TmpBuff << "RecursivePartial<";
        }
        if (!GenTypeDecl(TmpBuff, Property, RefTypesTmp, false, true))
        {
            continue;
        }
        if (CastFieldMacro<StructPropertyMacro>(Property))
        {
            TmpBuff << ">";
        }
        for (auto Type : RefTypesTmp)
        {
            Gen(Type);
        }
        StringBuffer << "    " << TmpBuff.Buffer << ";\n";
    }

    StringBuffer << "    "
                 << "}\n\n";

    if (IsWidget)
    {
        StringBuffer << "    "
                     << "class " << SafeName(Class->GetName()) << " extends React.Component<" << SafeName(Class->GetName())
                     << "Props> {\n"
                     << "        native: " << GetNameWithNamespace(Class) << ";\n";
    	if (IsPanelWidget)
    	{
    		StringBuffer << "		children: React.ReactNode;" << "\n    }\n\n";
    	}
    }

    Output << StringBuffer;
}

void UWidgetDeclarationGenerator::Gen_Implementation(const FString& OutDir) const
{
	FReactDeclarationGenerator ReactDeclarationGenerator;
	ReactDeclarationGenerator.GenReactDeclaration(OutDir);
}
