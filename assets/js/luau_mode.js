// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// Luau mode. Based on Lua mode from CodeMirror and Franciszek Wawrzak (https://codemirror.net/mode/lua/lua.js)

(function(mod) {
    if (typeof exports == "object" && typeof module == "object") // CommonJS
      mod(require("../../lib/codemirror"));
    else if (typeof define == "function" && define.amd) // AMD
      define(["../../lib/codemirror"], mod);
    else // Plain browser env
      mod(CodeMirror);
})(function(CodeMirror) {
    "use strict";
  
  CodeMirror.defineMode("luau", function(_, parserConfig) {
    var indentUnit = 4;
  
    function prefixRE(words) {
        return new RegExp("^(?:" + words.join("|") + ")");
    }
    function wordRE(words) {
        return new RegExp("^(?:" + words.join("|") + ")$");
    }
    var specials = wordRE(parserConfig.specials || ["type"]);
  
    // long list of standard functions from lua manual
    var builtins = wordRE([
      "_VERSION","assert","error","gcinfo","getfenv","getmetatable","ipairs","newproxy","next",
      "pairs","pcall","print","rawequal","rawget","rawlen","rawset","select","setfenv",
      "setmetatable","tonumber","tostring","type","typeof","unpack","xpcall",
  
      "bit32.arshift","bit32.band","bit32.bnot","bit32.bor","bit32.btest","bit32.bxor","bit32.byteswap",
      "bit32.countlz","bit32.countrz","bit32.extract","bit32.lrotate","bit32.lshift","bit32.replace","bit32.rrotate","bit32.rshift",

      "buffer.copy","buffer.create","buffer.fill","buffer.fromstring","buffer.len",
      "buffer.readf32","buffer.readf64","buffer.readi16","buffer.readi32","buffer.readi8","buffer.readstring","buffer.readu16","buffer.readu32","buffer.readu8",
      "buffer.tostring","buffer.writef32","buffer.writef64","buffer.writei16","buffer.writei32","buffer.writei8","buffer.writestring","buffer.writeu16","buffer.writeu32","buffer.writeu8",

      "coroutine.close","coroutine.create","coroutine.isyieldable","coroutine.resume","coroutine.running","coroutine.status","coroutine.wrap","coroutine.yield",
  
      "debug.info","debug.traceback",
  
      "math.abs","math.acos","math.asin","math.atan","math.atan2","math.ceil","math.clamp","math.cos","math.cosh",
      "math.deg","math.exp","math.floor","math.fmod","math.frexp","math.huge","math.ldexp","math.log","math.log10",
      "math.max","math.min","math.modf","math.noise","math.pi","math.pow","math.rad","math.random","math.randomseed",
      "math.round","math.sign","math.sin","math.sinh","math.sqrt","math.tan","math.tanh",
  
      "os.clock","os.date","os.difftime","os.time",

      "string.byte","string.char","string.find","string.format","string.gmatch","string.gsub","string.len","string.lower",
      "string.match","string.pack","string.packsize","string.rep","string.reverse","string.split","string.sub","string.unpack","string.upper",
  
      "table.clear","table.clone","table.concat","table.create","table.find","table.freeze","table.insert","table.isfrozen","table.maxn","table.move","table.pack","table.remove","table.sort","table.unpack",

      "utf8.char","utf8.charpattern","utf8.codepoint","utf8.codes","utf8.len","utf8.offset",

      "vector.create", "vector.magnitude", "vector.normalize", "vector.cross", "vector.dot", "vector.angle",
      "vector.floor", "vector.ceil", "vector.abs", "vector.sign", "vector.clamp", "vector.max", "vector.min"
    ]);
    var keywords = wordRE(["and","break","elseif","false","nil","not","or","return",
                           "true","function", "end", "if", "then", "else", "do",
                           "while", "repeat", "until", "for", "in", "local", "continue" ]);
  
    var indentTokens = wordRE(["function", "if","repeat","do", "\\(", "{"]);
    var dedentTokens = wordRE(["end", "until", "\\)", "}"]);
    var dedentPartial = prefixRE(["end", "until", "\\)", "}", "else", "elseif"]);
  
    function readBracket(stream) {
        var level = 0;
        while (stream.eat("=")) ++level;
        stream.eat("[");
        return level;
    }
  
    function normal(stream, state) {
        var ch = stream.next();
        if (ch == "-" && stream.eat("-")) {
            if (stream.eat("[") && stream.eat("["))
                return (state.cur = bracketed(readBracket(stream), "comment"))(stream, state);
            stream.skipToEnd();
            return "comment";
        }
        if (ch == "\"" || ch == "'" || ch == "`")
            return (state.cur = string(ch))(stream, state);
        if (ch == "[" && /[\[=]/.test(stream.peek()))
            return (state.cur = bracketed(readBracket(stream), "string"))(stream, state);
        if (/\d/.test(ch)) {
            stream.eatWhile(/[\w.%]/);
            return "number";
        }
        if (/[\w_]/.test(ch)) {
            stream.eatWhile(/[\w\\\-_.]/);
            return "variable";
        }
        return null;
    }
  
    function bracketed(level, style) {
        return function(stream, state) {
            var curlev = null, ch;
            while ((ch = stream.next()) != null) {
                if (curlev == null) {
                    if (ch == "]") curlev = 0;
                } else if (ch == "=") {
                    ++curlev;
                } else if (ch == "]" && curlev == level) {
                    state.cur = normal;
                    break; 
                } else {
                    curlev = null;
                }
            }
            return style;
        };
    }
  
    function string(quote) {
        return function(stream, state) {
            var escaped = false, ignoreWhitespace = false, ch;
            while ((ch = stream.next()) != null) {
                if (ch == quote && !escaped) {
                    break;
                }
                if (ch == "z" && escaped) {
                    stream.eatSpace();
                    ignoreWhitespace = stream.eol();
                }
                escaped = !escaped && ch == "\\";
            }

            if (!ignoreWhitespace) {
                state.cur = normal;
            }
            return "string";
        };
    }
  
    return {
        startState: function(basecol) {
            return {basecol: basecol || 0, indentDepth: 0, cur: normal};
        },
    
        token: function(stream, state) {
            if (stream.eatSpace()) {
                return null;
            }
            var style = state.cur(stream, state);
            var word = stream.current();
            if (style == "variable") {
                if (keywords.test(word)) {
                    style = "keyword";
                } else if (builtins.test(word)) {
                    style = "builtin";
                } else if (specials.test(word)) {
                    style = "variable-2";
                }
            }
            if ((style != "comment") && (style != "string")) {
                if (indentTokens.test(word)) {
                    ++state.indentDepth;
                } else if (dedentTokens.test(word)) {
                    --state.indentDepth;
                }
            }
            return style;
        },
    
        indent: function(state, textAfter) {
            var closing = dedentPartial.test(textAfter);
            return state.basecol + indentUnit * (state.indentDepth - (closing ? 1 : 0));
        },

        electricInput: /^\s*(?:end|until|else|\)|\})$/,
        lineComment: "--",
        blockCommentStart: "--[[",
        blockCommentEnd: "]]"
    }});
    CodeMirror.defineMIME("text/x-luau", "luau");
});
