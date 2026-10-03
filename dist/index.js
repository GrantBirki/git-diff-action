import './sourcemap-register.cjs';import { createRequire as __WEBPACK_EXTERNAL_createRequire } from "module";
/******/ var __webpack_modules__ = ({

/***/ 202:
/***/ ((__unused_webpack_module, __webpack_exports__, __nccwpck_require__) => {


// EXPORTS
__nccwpck_require__.d(__webpack_exports__, {
  Y: () => (/* binding */ gitDiff)
});

;// CONCATENATED MODULE: external "node:crypto"
const external_node_crypto_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:crypto");
;// CONCATENATED MODULE: external "node:fs"
const external_node_fs_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:fs");
var external_node_fs_default = /*#__PURE__*/__nccwpck_require__.n(external_node_fs_namespaceObject);
;// CONCATENATED MODULE: external "node:os"
const external_node_os_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:os");
;// CONCATENATED MODULE: ./src/actions-core.ts
// Narrow runner-command adapter for this action's string-only inputs and outputs.
// Adapted from actions/toolkit (MIT), see LICENSES/actions-toolkit.txt.



function escapeData(value) {
    return value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}
function getInput(name) {
    return (process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] ?? '').trim();
}
function info(message) {
    process.stdout.write(message + external_node_os_namespaceObject.EOL);
}
function debug(message) {
    info(`::debug::${escapeData(message)}`);
}
function warning(message) {
    info(`::warning::${escapeData(message)}`);
}
function setFailed(message) {
    process.exitCode = 1;
    info(`::error::${escapeData(message)}`);
}
function setOutput(name, value) {
    const outputPath = process.env.GITHUB_OUTPUT;
    if (outputPath) {
        const delimiter = `ghadelimiter_${(0,external_node_crypto_namespaceObject.randomUUID)()}`;
        if (name.includes(delimiter)) {
            throw new Error(`Unexpected input: name should not contain the delimiter "${delimiter}"`);
        }
        if (value.includes(delimiter)) {
            throw new Error(`Unexpected input: value should not contain the delimiter "${delimiter}"`);
        }
        if (!(0,external_node_fs_namespaceObject.existsSync)(outputPath)) {
            throw new Error(`Missing file at path: ${outputPath}`);
        }
        (0,external_node_fs_namespaceObject.appendFileSync)(outputPath, `${name}<<${delimiter}${external_node_os_namespaceObject.EOL}${value}${external_node_os_namespaceObject.EOL}${delimiter}${external_node_os_namespaceObject.EOL}`, 'utf8');
        return;
    }
    const property = name
        ? ` name=${escapeData(name).replace(/:/g, '%3A').replace(/,/g, '%2C')}`
        : '';
    info(`${external_node_os_namespaceObject.EOL}::set-output${property}::${escapeData(value)}`);
}

;// CONCATENATED MODULE: ./node_modules/parse-git-diff/build/mjs/context.js
class Context {
    line = 1;
    lines = [];
    options = {
        noPrefix: false,
    };
    constructor(diff, options) {
        this.lines = diff.split('\n');
        this.options.noPrefix = !!options?.noPrefix;
    }
    getCurLine() {
        return this.lines[this.line - 1];
    }
    nextLine() {
        this.line++;
        return this.getCurLine();
    }
    isEof() {
        return this.line > this.lines.length;
    }
}
//# sourceMappingURL=context.js.map
;// CONCATENATED MODULE: ./node_modules/parse-git-diff/build/mjs/constants.js
const LineType = {
    Added: 'AddedLine',
    Deleted: 'DeletedLine',
    Unchanged: 'UnchangedLine',
    Message: 'MessageLine',
};
const FileType = {
    Changed: 'ChangedFile',
    Added: 'AddedFile',
    Deleted: 'DeletedFile',
    Renamed: 'RenamedFile',
};
const ExtendedHeader = {
    Index: 'index',
    OldMode: 'old mode',
    NewMode: 'new mode',
    Copy: 'copy',
    Similarity: 'similarity',
    Dissimilarity: 'dissimilarity',
    Deleted: 'deleted',
    NewFile: 'new file',
    RenameFrom: 'rename from',
    RenameTo: 'rename to',
};
const ExtendedHeaderValues = Object.values(ExtendedHeader);
//# sourceMappingURL=constants.js.map
;// CONCATENATED MODULE: ./node_modules/parse-git-diff/build/mjs/parse-git-diff.js


function parseGitDiff(diff, options) {
    const ctx = new Context(diff, options);
    const files = parseFileChanges(ctx);
    return {
        type: 'GitDiff',
        files,
    };
}
function parseFileChanges(ctx) {
    const changedFiles = [];
    while (!ctx.isEof()) {
        const changed = parseFileChange(ctx);
        if (!changed) {
            break;
        }
        changedFiles.push(changed);
    }
    return changedFiles;
}
function parseFileChange(ctx) {
    if (!isComparisonInputLine(ctx.getCurLine())) {
        return;
    }
    const comparisonLineParsed = parseComparisonInputLine(ctx);
    let isDeleted = false;
    let isNew = false;
    let isRename = false;
    let pathBefore = '';
    let pathAfter = '';
    let oldMode = undefined;
    let newMode = undefined;
    while (!ctx.isEof()) {
        const extHeader = parseExtendedHeader(ctx);
        if (!extHeader) {
            break;
        }
        if (extHeader.type === ExtendedHeader.Deleted) {
            isDeleted = true;
            pathBefore = comparisonLineParsed?.from || '';
        }
        if (extHeader.type === ExtendedHeader.NewFile) {
            isNew = true;
            pathAfter = comparisonLineParsed?.to || '';
        }
        if (extHeader.type === ExtendedHeader.RenameFrom) {
            isRename = true;
            pathBefore = extHeader.path;
        }
        if (extHeader.type === ExtendedHeader.RenameTo) {
            isRename = true;
            pathAfter = extHeader.path;
        }
        if (extHeader.type === ExtendedHeader.OldMode) {
            oldMode = extHeader.mode;
        }
        if (extHeader.type === ExtendedHeader.NewMode) {
            newMode = extHeader.mode;
        }
    }
    const changeMarkers = parseChangeMarkers(ctx);
    const chunks = parseChunks(ctx);
    if (isDeleted && chunks.length && chunks[0].type === 'BinaryFilesChunk') {
        return {
            type: FileType.Deleted,
            chunks,
            path: chunks[0].pathBefore,
        };
    }
    if (isDeleted) {
        return {
            type: FileType.Deleted,
            chunks,
            path: changeMarkers?.deleted || pathBefore,
        };
    }
    else if (isNew && chunks.length && chunks[0].type === 'BinaryFilesChunk') {
        return {
            type: FileType.Added,
            chunks,
            path: chunks[0].pathAfter,
        };
    }
    else if (isNew) {
        return {
            type: FileType.Added,
            chunks,
            path: changeMarkers?.added || pathAfter,
        };
    }
    else if (isRename) {
        return {
            type: FileType.Renamed,
            pathAfter,
            pathBefore,
            chunks,
            oldMode,
            newMode,
        };
    }
    else if (changeMarkers) {
        return {
            type: FileType.Changed,
            chunks,
            path: changeMarkers.added,
            oldMode,
            newMode,
        };
    }
    else if (oldMode && newMode && comparisonLineParsed) {
        return {
            type: FileType.Changed,
            chunks,
            path: comparisonLineParsed.to,
            oldMode,
            newMode,
        };
    }
    else if (chunks.length &&
        chunks[0].type === 'BinaryFilesChunk' &&
        chunks[0].pathAfter) {
        return {
            type: FileType.Changed,
            chunks,
            path: chunks[0].pathAfter,
        };
    }
    return;
}
function isComparisonInputLine(line) {
    return line.indexOf('diff') === 0;
}
function parseComparisonInputLine(ctx) {
    const line = ctx.getCurLine();
    const [to, from] = line.split(' ').reverse();
    ctx.nextLine();
    if (to && from) {
        return {
            from: getFilePath(ctx, from, 'src'),
            to: getFilePath(ctx, to, 'dst'),
        };
    }
    return null;
}
function parseChunks(context) {
    const chunks = [];
    while (!context.isEof()) {
        const chunk = parseChunk(context);
        if (!chunk) {
            break;
        }
        chunks.push(chunk);
    }
    return chunks;
}
function parseChunk(context) {
    const chunkHeader = parseChunkHeader(context);
    if (!chunkHeader) {
        return;
    }
    if (chunkHeader.type === 'Normal') {
        const changes = parseChanges(context, chunkHeader.fromFileRange, chunkHeader.toFileRange);
        return {
            ...chunkHeader,
            type: 'Chunk',
            changes,
        };
    }
    else if (chunkHeader.type === 'Combined' &&
        chunkHeader.fromFileRangeA &&
        chunkHeader.fromFileRangeB) {
        const changes = parseChanges(context, chunkHeader.fromFileRangeA.start < chunkHeader.fromFileRangeB.start
            ? chunkHeader.fromFileRangeA
            : chunkHeader.fromFileRangeB, chunkHeader.toFileRange);
        return {
            ...chunkHeader,
            type: 'CombinedChunk',
            changes,
        };
    }
    else if (chunkHeader.type === 'BinaryFiles' &&
        chunkHeader.fileA &&
        chunkHeader.fileB) {
        return {
            type: 'BinaryFilesChunk',
            pathBefore: chunkHeader.fileA,
            pathAfter: chunkHeader.fileB,
        };
    }
}
function parseExtendedHeader(ctx) {
    if (isComparisonInputLine(ctx.getCurLine())) {
        return null;
    }
    const line = ctx.getCurLine();
    const type = ExtendedHeaderValues.find((v) => line.startsWith(v));
    if (type) {
        ctx.nextLine();
    }
    if (type === ExtendedHeader.RenameFrom || type === ExtendedHeader.RenameTo) {
        return {
            type,
            path: line.slice(`${type} `.length),
        };
    }
    else if (type === ExtendedHeader.OldMode ||
        type === ExtendedHeader.NewMode) {
        return {
            type,
            mode: line.slice(`${type} `.length),
        };
    }
    else if (type) {
        return {
            type,
        };
    }
    return null;
}
function parseChunkHeader(ctx) {
    const line = ctx.getCurLine();
    const normalChunkExec = /^@@\s\-(\d+),?(\d+)?\s\+(\d+),?(\d+)?\s@@\s?(.+)?/.exec(line);
    if (!normalChunkExec) {
        const combinedChunkExec = /^@@@\s\-(\d+),?(\d+)?\s\-(\d+),?(\d+)?\s\+(\d+),?(\d+)?\s@@@\s?(.+)?/.exec(line);
        if (!combinedChunkExec) {
            const binaryChunkExec = /^Binary\sfiles\s(.*)\sand\s(.*)\sdiffer$/.exec(line);
            if (binaryChunkExec) {
                const [all, fileA, fileB] = binaryChunkExec;
                ctx.nextLine();
                return {
                    type: 'BinaryFiles',
                    fileA: getFilePath(ctx, fileA, 'src'),
                    fileB: getFilePath(ctx, fileB, 'dst'),
                };
            }
            return null;
        }
        const [all, delStartA, delLinesA, delStartB, delLinesB, addStart, addLines, context,] = combinedChunkExec;
        ctx.nextLine();
        return {
            context,
            type: 'Combined',
            fromFileRangeA: getRange(delStartA, delLinesA),
            fromFileRangeB: getRange(delStartB, delLinesB),
            toFileRange: getRange(addStart, addLines),
        };
    }
    const [all, delStart, delLines, addStart, addLines, context] = normalChunkExec;
    ctx.nextLine();
    return {
        context,
        type: 'Normal',
        toFileRange: getRange(addStart, addLines),
        fromFileRange: getRange(delStart, delLines),
    };
}
function getRange(start, lines) {
    const startNum = parseInt(start, 10);
    return {
        start: startNum,
        lines: lines === undefined ? 1 : parseInt(lines, 10),
    };
}
function parseChangeMarkers(context) {
    const deleterMarker = parseMarker(context, '--- ');
    const deleted = deleterMarker
        ? getFilePath(context, deleterMarker, 'src')
        : deleterMarker;
    const addedMarker = parseMarker(context, '+++ ');
    const added = addedMarker
        ? getFilePath(context, addedMarker, 'dst')
        : addedMarker;
    return added && deleted ? { added, deleted } : null;
}
function parseMarker(context, marker) {
    const line = context.getCurLine();
    if (line?.startsWith(marker)) {
        context.nextLine();
        return line.replace(marker, '');
    }
    return null;
}
const CHAR_TYPE_MAP = {
    '+': LineType.Added,
    '-': LineType.Deleted,
    ' ': LineType.Unchanged,
    '\\': LineType.Message,
};
function parseChanges(ctx, rangeBefore, rangeAfter) {
    const changes = [];
    let lineBefore = rangeBefore.start;
    let lineAfter = rangeAfter.start;
    while (!ctx.isEof()) {
        const line = ctx.getCurLine();
        const type = getLineType(line);
        if (!type) {
            break;
        }
        ctx.nextLine();
        let change;
        const content = line.slice(1);
        switch (type) {
            case LineType.Added: {
                change = {
                    type,
                    lineAfter: lineAfter++,
                    content,
                };
                break;
            }
            case LineType.Deleted: {
                change = {
                    type,
                    lineBefore: lineBefore++,
                    content,
                };
                break;
            }
            case LineType.Unchanged: {
                change = {
                    type,
                    lineBefore: lineBefore++,
                    lineAfter: lineAfter++,
                    content,
                };
                break;
            }
            case LineType.Message: {
                change = {
                    type,
                    content: content.trim(),
                };
                break;
            }
        }
        changes.push(change);
    }
    return changes;
}
function getLineType(line) {
    return CHAR_TYPE_MAP[line[0]] || null;
}
function getFilePath(ctx, input, type) {
    if (ctx.options.noPrefix) {
        return input;
    }
    if (type === 'src')
        return input.replace(/^a\//, '');
    if (type === 'dst')
        return input.replace(/^b\//, '');
    throw new Error('Unexpected unreachable code');
}
//# sourceMappingURL=parse-git-diff.js.map
;// CONCATENATED MODULE: ./node_modules/parse-git-diff/build/mjs/index.js

/* harmony default export */ const mjs = (parseGitDiff);
//# sourceMappingURL=index.js.map
;// CONCATENATED MODULE: external "node:child_process"
const external_node_child_process_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:child_process");
;// CONCATENATED MODULE: external "node:util"
const external_node_util_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:util");
;// CONCATENATED MODULE: ./src/functions/exec-async.ts


async function execFileAsync(file, args, opts) {
    return await (0,external_node_util_namespaceObject.promisify)(external_node_child_process_namespaceObject.execFile)(file, args, { ...opts, encoding: 'utf8' });
}

;// CONCATENATED MODULE: external "node:path"
const external_node_path_namespaceObject = __WEBPACK_EXTERNAL_createRequire(import.meta.url)("node:path");
var external_node_path_default = /*#__PURE__*/__nccwpck_require__.n(external_node_path_namespaceObject);
;// CONCATENATED MODULE: ./src/functions/git-diff.ts





// Constants
const DEFAULT_MAX_BUFFER_SIZE = 1000000;
const GIT_DIFF_MARKER = 'diff --git';
// Helper function to validate and get max buffer size
function getMaxBufferSize(maxBufferSizeInput) {
    if (Number.isNaN(maxBufferSizeInput)) {
        info(`max_buffer_size is not defined, using default of ${DEFAULT_MAX_BUFFER_SIZE}`);
        return DEFAULT_MAX_BUFFER_SIZE;
    }
    return maxBufferSizeInput;
}
function tokenizeInputArgs(value, inputName) {
    if (!value || value.trim() === '') {
        return [];
    }
    const args = [];
    let current = '';
    let quote = null;
    let escaped = false;
    let tokenInProgress = false;
    for (const char of value) {
        if (escaped) {
            current += char;
            escaped = false;
            tokenInProgress = true;
            continue;
        }
        if (quote === "'") {
            if (char === "'") {
                quote = null;
            }
            else {
                current += char;
            }
            tokenInProgress = true;
            continue;
        }
        if (quote === '"') {
            if (char === '"') {
                quote = null;
            }
            else if (char === '\\') {
                escaped = true;
            }
            else {
                current += char;
            }
            tokenInProgress = true;
            continue;
        }
        if (/\s/.test(char)) {
            if (tokenInProgress) {
                if (current !== '') {
                    args.push(current);
                }
                current = '';
                tokenInProgress = false;
            }
            continue;
        }
        if (char === "'" || char === '"') {
            quote = char;
            tokenInProgress = true;
            continue;
        }
        if (char === '\\') {
            escaped = true;
            tokenInProgress = true;
            continue;
        }
        current += char;
        tokenInProgress = true;
    }
    if (quote) {
        throw new Error(`${inputName} contains an unterminated quoted value`);
    }
    if (escaped) {
        throw new Error(`${inputName} ends with an incomplete escape sequence`);
    }
    if (tokenInProgress && current !== '') {
        args.push(current);
    }
    return args;
}
function getGitDiffArgs(gitOptions, baseBranch, searchPath) {
    return [
        '--no-pager',
        'diff',
        ...tokenizeInputArgs(gitOptions, 'git_options'),
        baseBranch,
        '--',
        searchPath
    ];
}
function resolveWorkspacePath(filePath) {
    const workspaceRoot = external_node_fs_default().realpathSync(process.env.GITHUB_WORKSPACE || process.cwd());
    const resolvedPath = external_node_path_default().resolve(workspaceRoot, filePath);
    const realPath = external_node_fs_default().realpathSync(resolvedPath);
    const relativePath = external_node_path_default().relative(workspaceRoot, realPath);
    if (relativePath === '' ||
        (!relativePath.startsWith('..') && !external_node_path_default().isAbsolute(relativePath))) {
        return realPath;
    }
    throw new Error('git_diff_file must resolve to a file inside the GitHub workspace');
}
// Helper function to get the diff from the git command
// :returns: The diff object which is parsed git diff
// If an error occurs, setFailed is called and it returns null
async function gitDiff() {
    try {
        info('🏃 starting the git-diff-action');
        // Get the base branch to use for the diff
        const baseBranch = getInput('base_branch');
        debug(`base_branch: ${baseBranch}`);
        const searchPath = getInput('search_path');
        debug(`search_path: ${searchPath}`);
        const maxBufferSizeInput = parseInt(getInput('max_buffer_size'));
        debug(`max_buffer_size: ${maxBufferSizeInput}`);
        const fileOutputOnly = getInput('file_output_only') === 'true';
        const gitOptions = getInput('git_options');
        debug(`git_options: ${gitOptions}`);
        const gitDiffFile = getInput('git_diff_file');
        debug(`git_diff_file: ${gitDiffFile}`);
        let rawGitDiff;
        // If git_diff_file is provided, read the file and return the diff
        if (gitDiffFile !== 'false') {
            const safeGitDiffFile = resolveWorkspacePath(gitDiffFile);
            info(`📂 reading git diff from file: ${safeGitDiffFile}`);
            rawGitDiff = external_node_fs_default().readFileSync(safeGitDiffFile, 'utf8');
        }
        else {
            // if max_buffer_size is not defined, just use the default
            const maxBufferSize = getMaxBufferSize(maxBufferSizeInput);
            const gitDiffArgs = getGitDiffArgs(gitOptions, baseBranch, searchPath);
            if (gitDiffArgs.includes('--binary')) {
                warning(`--binary flag is set, this may cause unexpected issues with the diff`);
            }
            // --no-pager ensures that the git command does not use a pager (like less) to display the diff
            debug(`running git diff argv: ${JSON.stringify(['git', ...gitDiffArgs])}`);
            const { stdout, stderr } = await execFileAsync('git', gitDiffArgs, {
                maxBuffer: maxBufferSize
            });
            if (stderr) {
                setFailed(`git diff error: ${stderr}`);
                return;
            }
            rawGitDiff = stdout;
        }
        // Count files changed in the raw diff
        // Note: This simple counting method may over-count if file content contains the git diff marker
        const totalFilesChanged = rawGitDiff.split(GIT_DIFF_MARKER).length - 1;
        info(`🧮 total detected files changed (raw diff): ${totalFilesChanged}`);
        // only log the raw diff if the Action is explicitly set to run in debug mode
        debug(`raw git diff: ${rawGitDiff}`);
        if (fileOutputOnly === false) {
            // only set the output if fileOutputOnly is false
            setOutput('raw-diff', rawGitDiff);
        }
        // Write the raw diff to a file if the path is provided
        const rawPath = getInput('raw_diff_file_output');
        if (rawPath) {
            info(`💾 writing raw diff to: ${rawPath}`);
            setOutput('raw-diff-path', rawPath);
            external_node_fs_default().writeFileSync(rawPath, rawGitDiff);
        }
        // JSON diff
        const diff = mjs(rawGitDiff);
        const jsonDiff = JSON.stringify(diff);
        // log the total amount of files changed in the json diff
        info(`🧮 total detected files changed (json diff): ${diff.files.length}`);
        // only log the json diff if the Action is explicitly set to run in debug mode
        debug(`jsonDiff: ${jsonDiff}`);
        // only set the output if fileOutputOnly is false
        if (fileOutputOnly === false) {
            setOutput('json-diff', jsonDiff);
        }
        // Write the JSON diff to a file if the path is provided
        const jsonPath = getInput('json_diff_file_output');
        if (jsonPath) {
            info(`💾 writing json diff to: ${jsonPath}`);
            setOutput('json-diff-path', jsonPath);
            external_node_fs_default().writeFileSync(jsonPath, jsonDiff);
        }
        info('✅ git-diff-action completed successfully');
        return diff;
    }
    catch (e) {
        setFailed(`error getting git diff: ${e}`);
        return undefined;
    }
}


/***/ }),

/***/ 730:
/***/ ((module, __unused_webpack___webpack_exports__, __nccwpck_require__) => {

__nccwpck_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony import */ var _functions_git_diff_js__WEBPACK_IMPORTED_MODULE_0__ = __nccwpck_require__(202);

await (0,_functions_git_diff_js__WEBPACK_IMPORTED_MODULE_0__/* .gitDiff */ .Y)();

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } }, 1);

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __nccwpck_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	var threw = true;
/******/ 	try {
/******/ 		__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 		threw = false;
/******/ 	} finally {
/******/ 		if(threw) delete __webpack_module_cache__[moduleId];
/******/ 	}
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/async module */
/******/ (() => {
/******/ 	var webpackQueues = typeof Symbol === "function" ? Symbol("webpack queues") : "__webpack_queues__";
/******/ 	var webpackExports = typeof Symbol === "function" ? Symbol("webpack exports") : "__webpack_exports__";
/******/ 	var webpackError = typeof Symbol === "function" ? Symbol("webpack error") : "__webpack_error__";
/******/ 	var resolveQueue = (queue) => {
/******/ 		if(queue && queue.d < 1) {
/******/ 			queue.d = 1;
/******/ 			queue.forEach((fn) => (fn.r--));
/******/ 			queue.forEach((fn) => (fn.r-- ? fn.r++ : fn()));
/******/ 		}
/******/ 	}
/******/ 	var wrapDeps = (deps) => (deps.map((dep) => {
/******/ 		if(dep !== null && typeof dep === "object") {
/******/ 			if(dep[webpackQueues]) return dep;
/******/ 			if(dep.then) {
/******/ 				var queue = [];
/******/ 				queue.d = 0;
/******/ 				dep.then((r) => {
/******/ 					obj[webpackExports] = r;
/******/ 					resolveQueue(queue);
/******/ 				}, (e) => {
/******/ 					obj[webpackError] = e;
/******/ 					resolveQueue(queue);
/******/ 				});
/******/ 				var obj = {};
/******/ 				obj[webpackQueues] = (fn) => (fn(queue));
/******/ 				return obj;
/******/ 			}
/******/ 		}
/******/ 		var ret = {};
/******/ 		ret[webpackQueues] = x => {};
/******/ 		ret[webpackExports] = dep;
/******/ 		return ret;
/******/ 	}));
/******/ 	__nccwpck_require__.a = (module, body, hasAwait) => {
/******/ 		var queue;
/******/ 		hasAwait && ((queue = []).d = -1);
/******/ 		var depQueues = new Set();
/******/ 		var exports = module.exports;
/******/ 		var currentDeps;
/******/ 		var outerResolve;
/******/ 		var reject;
/******/ 		var promise = new Promise((resolve, rej) => {
/******/ 			reject = rej;
/******/ 			outerResolve = resolve;
/******/ 		});
/******/ 		promise[webpackExports] = exports;
/******/ 		promise[webpackQueues] = (fn) => (queue && fn(queue), depQueues.forEach(fn), promise["catch"](x => {}));
/******/ 		module.exports = promise;
/******/ 		body((deps) => {
/******/ 			currentDeps = wrapDeps(deps);
/******/ 			var fn;
/******/ 			var getResult = () => (currentDeps.map((d) => {
/******/ 				if(d[webpackError]) throw d[webpackError];
/******/ 				return d[webpackExports];
/******/ 			}))
/******/ 			var promise = new Promise((resolve) => {
/******/ 				fn = () => (resolve(getResult));
/******/ 				fn.r = 0;
/******/ 				var fnQueue = (q) => (q !== queue && !depQueues.has(q) && (depQueues.add(q), q && !q.d && (fn.r++, q.push(fn))));
/******/ 				currentDeps.map((dep) => (dep[webpackQueues](fnQueue)));
/******/ 			});
/******/ 			return fn.r ? promise : getResult();
/******/ 		}, (err) => ((err ? reject(promise[webpackError] = err) : outerResolve(exports)), resolveQueue(queue)));
/******/ 		queue && queue.d < 0 && (queue.d = 0);
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/compat get default export */
/******/ (() => {
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__nccwpck_require__.n = (module) => {
/******/ 		var getter = module && module.__esModule ?
/******/ 			() => (module['default']) :
/******/ 			() => (module);
/******/ 		__nccwpck_require__.d(getter, { a: getter });
/******/ 		return getter;
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__nccwpck_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
/******/ 
/******/ // startup
/******/ // Load entry module and return exports
/******/ // This entry module used 'module' so it can't be inlined
/******/ var __webpack_exports__ = __nccwpck_require__(730);
/******/ __webpack_exports__ = await __webpack_exports__;
/******/ 

//# sourceMappingURL=index.js.map