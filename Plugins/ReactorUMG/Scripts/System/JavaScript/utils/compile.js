"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UE = require("ue");
const puerts_1 = require("puerts");
const ts = require("typescript");
const tsi = require("../PuertsEditor/TypeScriptInternal");

let callObject = puerts_1.argv.getByName("callObject");

function getFileOptionSystem() {
    const customSystem = {
        args: [],
        newLine: '\n',
        useCaseSensitiveFileNames: true,
        write,
        readFile,
        writeFile,
        resolvePath: tsi.resolvePath,
        fileExists,
        directoryExists: tsi.directoryExists,
        createDirectory: tsi.createDirectory,
        getExecutingFilePath,
        getCurrentDirectory,
        getDirectories,
        readDirectory,
        exit,
    };
    function fileExists(path) {
        let res = UE.FileSystemOperation.FileExists(path);
        return res;
    }
    function write(s) {
        console.log(s);
    }
    function readFile(path, encoding) {
        let data = puerts_1.$ref(undefined);
        const res = UE.FileSystemOperation.ReadFile(path, data);
        if (res) {
            return puerts_1.$unref(data);
        }
        else {
            console.warn("readFile: read file fail! path=" + path + ", stack:" + new Error().stack);
            return undefined;
        }
    }
    function writeFile(path, data, writeByteOrderMark) {
        throw new Error("forbiden!");
    }
    function readDirectory(path, extensions, excludes, includes, depth) {
        return tsi.matchFiles(path, extensions, excludes, includes, true, getCurrentDirectory(), depth, tsi.getAccessibleFileSystemEntries, tsi.realpath);
    }
    function exit(exitCode) {
        throw new Error("exit with code:" + exitCode);
    }
    function getExecutingFilePath() {
        return getCurrentDirectory() + "node_modules/typescript/lib/tsc.js";
    }
    function getCurrentDirectory() {
        return callObject.TsProjectDir;
    }
    function getDirectories(path) {
        let result = [];
        let dirs = UE.FileSystemOperation.GetDirectories(path);
        for (var i = 0; i < dirs.Num(); i++) {
            result.push(dirs.Get(i));
        }
        return result;
    }
    return customSystem;
}

let customSystem = getFileOptionSystem();
if (!ts.sys) {
    let t = ts;
    t.sys = customSystem;
}

function logErrors(allDiagnostics) {
    allDiagnostics.forEach(diagnostic => {
        let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
        if (diagnostic.file) {
            let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
            console.error(`  Error ${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        }
        else {
            console.error(`  Error: ${message}`);
        }
    });
}

function readAndParseConfigFile(configFilePath) {
    let readResult = ts.readConfigFile(configFilePath, customSystem.readFile);
    return ts.parseJsonConfigFileContent(readResult.config, {
        useCaseSensitiveFileNames: true,
        readDirectory: customSystem.readDirectory,
        fileExists: customSystem.fileExists,
        readFile: customSystem.readFile,
        trace: s => console.log(s)
    }, customSystem.getCurrentDirectory());
}

function getClassPathInfo(sourceFilePath) {
    let modulePath = undefined;
    let moduleFileName = undefined;
    if (sourceFilePath.endsWith(".ts")) {
        if (options.baseUrl && sourceFilePath.startsWith(options.baseUrl)) {
            moduleFileName = sourceFilePath.substr(options.baseUrl.length + 1);
            modulePath = tsi.getDirectoryPath(moduleFileName);
            moduleFileName = tsi.removeExtension(moduleFileName, ".ts");
        }
    }
    return { moduleFileName, modulePath };
}

function compileInternal(sourceFilePath, program) {
    if (!program) {
        let beginTime = new Date().getTime();
        program = getProgramFromService();
        console.log("incremental compile " + sourceFilePath + " using " + (new Date().getTime() - beginTime) + "ms");
    }
    let sourceFile = program.getSourceFile(sourceFilePath);
    if (sourceFile) {
        const diagnostics = [
            ...program.getSyntacticDiagnostics(sourceFile),
            ...program.getSemanticDiagnostics(sourceFile)
        ];
        if (diagnostics.length > 0) {
            logErrors(diagnostics);
        } else {
            if (!sourceFile.isDeclarationFile) {
                let emitOutput = service.getEmitOutput(sourceFilePath);
                if (!emitOutput.emitSkipped) {
                    let modulePath = undefined;
                    let moduleFileName = undefined;
                    let jsSource = undefined;
                    emitOutput.outputFiles.forEach(output => {
                        console.log(`write ${output.name} ...`);
                        UE.FileSystemOperation.WriteFile(output.name, output.text);

                        if (output.name.endsWith(".js") || output.name.endsWith(".mjs")) {
                            jsSource = output.text;
                            if (options.outDir && output.name.startsWith(options.outDir)) {
                                moduleFileName = output.name.substr(options.outDir.length + 1);
                                modulePath = tsi.getDirectoryPath(moduleFileName);
                                moduleFileName = tsi.removeExtension(moduleFileName, output.name.endsWith(".js") ? ".js" : ".mjs");
                            }
                        }
                    });
                }
            }
        }
    }

}

function compile() {
    const configFilePath = tsi.combinePaths(projectDir, "tsconfig.json");
    let { filesFromConfig, options } = readAndParseConfigFile(configFilePath);
    const scriptDir = callObject.TsScriptHomeFullDir;
    let fileNames = UE.FileSystemOperation.GetFiles(scriptDir);

    console.log("start compile..", JSON.stringify({ fileNames: fileNames, options: options }));
    const fileVersions = {};
    let beginTime = new Date().getTime();
    fileNames.forEach(fileName => {
        fileVersions[fileName] = { version: UE.FileSystemOperation.FileMD5Hash(fileName), processed: false, isBP: false };
    });
    console.log("calc md5 using " + (new Date().getTime() - beginTime) + "ms");

    const scriptSnapshotsCache = new Map();

    const servicesHost = {
        getScriptFileNames: () => fileNames,
        getScriptVersion: fileName => {
            if (fileName in fileVersions) {
                return fileVersions[fileName] && fileVersions[fileName].version.toString();
            }
            else {
                let md5 = UE.FileSystemOperation.FileMD5Hash(fileName);
                fileVersions[fileName] = { version: md5, processed: false };
                return md5;
            }
        },
        getScriptSnapshot: fileName => {
            if (!customSystem.fileExists(fileName)) {
                console.error("getScriptSnapshot: file not existed! path=" + fileName);
                return undefined;
            }
            if (!(fileName in fileVersions)) {
                fileVersions[fileName] = { version: UE.FileSystemOperation.FileMD5Hash(fileName), processed: false };
            }
            if (!scriptSnapshotsCache.has(fileName)) {
                const sourceFile = customSystem.readFile(fileName);
                if (!sourceFile) {
                    console.error("getScriptSnapshot: read file failed! path=" + fileName);
                    return undefined;
                }
                scriptSnapshotsCache.set(fileName, {
                    version: fileVersions[fileName].version,
                    scriptSnapshot: ts.ScriptSnapshot.fromString(sourceFile)
                });
            }
            let scriptSnapshotsInfo = scriptSnapshotsCache.get(fileName);
            if (scriptSnapshotsInfo.version != fileVersions[fileName].version) {
                const sourceFile = customSystem.readFile(fileName);
                if (!sourceFile) {
                    console.error("getScriptSnapshot: read file failed! path=" + fileName);
                    return undefined;
                }
                scriptSnapshotsInfo.version = fileVersions[fileName].version;
                scriptSnapshotsInfo.scriptSnapshot = ts.ScriptSnapshot.fromString(sourceFile);
            }
            console.log("getScriptSnapshot:"+ fileName + ",in:" + new Error().stack)
            return scriptSnapshotsInfo.scriptSnapshot;
        },
        getCurrentDirectory: customSystem.getCurrentDirectory,
        getCompilationSettings: () => options,
        getDefaultLibFileName: options => tsi.combinePaths(getDefaultLibLocation(), ts.getDefaultLibFileName(options)),
        fileExists: ts.sys.fileExists,
        readFile: ts.sys.readFile,
        readDirectory: ts.sys.readDirectory,
        directoryExists: ts.sys.directoryExists,
        getDirectories: ts.sys.getDirectories,
    }

    let service = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
    function getProgramFromService() {
        while (true) {
            try {
                return service.getProgram();
            }
            catch (e) {
                console.error(e);
            }
            //异常了重新创建Language Service，有可能不断失败,UE的文件读取偶尔会失败，失败后ts增量编译会不断的在tryReuseStructureFromOldProgram那断言失败
            service = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
        }
    }

    beginTime = new Date().getTime();
    let program = getProgramFromService();
    console.log("full compile using " + (new Date().getTime() - beginTime) + "ms");
    fileNames.forEach(fileName => {
        if (fileName.endsWith(".ts") || fileName.endsWith(".tsx")) {
            compileInternal(fileName, program);
        }
    });
}

compile();
callObject.ReleaseJsEnv_EditorOnly();
