/**!
 * Synhigh Code Highlighter
 *
 * Lightweight syntax highlighting with auto language detection, line numbers, and a copy button.
 *
 * @copyright Copyright 2026 Rayiumir Limited.
 * @author    Raymond Baghumian
 * @link      https://github.com/Synhigh/synhigh-code-highlighter
 * @version   v1.0.0
 *
 */
(function (root) {
	'use strict';

	var Synhigh = root.Synhigh = root.Synhigh || {};
	var defs = Synhigh._defs = {};
	var names = [];
	var alias = {};
	var MAX_LEN = 150000;

	// Helpers shared by language definitions

	var u = Synhigh.util = {
		esc: function (s) {
			return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		},
		/* Whole-word keyword matcher from a space separated list. */
		W: function (words) {
			var list = words.trim().split(/\s+/).map(function (w) {
				return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			});
			return new RegExp('\\b(?:' + list.join('|') + ')\\b');
		},
		/* Build a RegExp from a source string; null when the engine can't parse it (e.g. no lookbehind). */
		R: function (src) {
			try { return new RegExp(src); } catch (e) { return null; }
		},
		dq: /"(?:\\.|[^"\\\n])*"/,
		sq: /'(?:\\.|[^'\\\n])*'/,
		num: /\b(?:0[xX][\da-fA-F_]+|0[bB][01_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)[uUlLfFnN]*\b/,
		fn: /[A-Za-z_$][\w$]*(?=\s*\()/,
		cap: /\b[A-Z][A-Za-z0-9_]*\b/,
		caps: /\b[A-Z][A-Z0-9_]{2,}\b/,
		op: /[-+*\/%=<>!&|^~?]+/,
		lc: /\/\/.*/,
		bc: /\/\*[\s\S]*?(?:\*\/|$)/
	};

	// Registry

	Synhigh.define = function (name, def) {
		def.name = name;
		def._c = {};
		defs[name] = def;
		if (!def.hidden && names.indexOf(name) < 0) { names.push(name); }
		alias[name] = name;
		(def.aliases || []).forEach(function (a) { alias[a.toLowerCase()] = name; });
		return def;
	};
	Synhigh.resolve = function (n) {
		if (!n) { return null; }
		var k = String(n).toLowerCase();
		return Object.prototype.hasOwnProperty.call(alias, k) ? alias[k] : null;
	};
	Synhigh.languages = function () { return names.slice(); };

	// Compiler: one combined regex per language

	function groups(src) { 
		return new RegExp(src + '|').exec('').length - 1; 
	}

	function compile(L, noRegions) {
		var key = noRegions ? 'n' : 'r';
		if (L._c[key]) { return L._c[key]; }
		var parts = [], rules = [];
		L.rules.forEach(function (rule) {
			if (!rule || !rule.r || (noRegions && rule.end)) { return; }
			var src = rule.r.source;
			try {
				if (groups(src) !== 0) {
					if (Synhigh.debug && root.console) { root.console.warn('Synhigh: capture group in rule', L.name, src); }
					return;
				}
			} catch (e) { return; }
			parts.push('(' + src + ')');
			rules.push(rule);
		});
		if (!parts.length) { parts.push('(?!)'); }
		var out = { re: new RegExp(parts.join('|'), 'gm' + (L.ci ? 'i' : '')), rules: rules };
		L._c[key] = out;
		return out;
	}

	// Tokenizer

	function pushAll(out, toks, fallback) {
		for (var i = 0; i < toks.length; i++) { out.push([toks[i][0] || fallback, toks[i][1]]); }
	}

	// Embedded language region (e.g. <script>...</script>, <?php ... ?>). Returns the new scan position.

	function region(code, m, rule, host, out) {
		var from = m.index + m[0].length;
		if (rule.ot) { out.push([rule.ot, m[0]]); } else { pushAll(out, tokenize(m[0], host, true), ''); }
		var er = new RegExp(rule.end.source, 'gi');
		er.lastIndex = from;
		var em = er.exec(code);
		var stop = em ? em.index : code.length;
		pushAll(out, tokenize(code.slice(from, stop), rule.lang), '');
		if (!em) { return code.length; }
		if (rule.ct) { out.push([rule.ct, em[0]]); } else { pushAll(out, tokenize(em[0], host, true), ''); }
		return em.index + em[0].length;
	}

	function tokenize(code, name, noRegions) {
		var L = defs[name];
		if (!L) { return [['', code]]; }
		var C = compile(L, noRegions);
		var re = C.re, out = [], last = 0, base = L.base || '', m, g, rule;
		re.lastIndex = 0;
		while ((m = re.exec(code)) !== null) {
			if (m[0].length === 0) { re.lastIndex++; continue; }
			for (g = 1; m[g] === undefined; g++) { /* find the matching rule */ }
			rule = C.rules[g - 1];
			if (m.index > last) { out.push([base, code.slice(last, m.index)]); }
			last = m.index + m[0].length;
			if (rule.end) {
				last = region(code, m, rule, name, out);
			} else if (rule.sub) {
				pushAll(out, tokenize(m[0], rule.sub), rule.t || '');
			} else {
				out.push([rule.t || base, m[0]]);
			}
			re.lastIndex = last;
		}
		if (last < code.length) { out.push([base, code.slice(last)]); }
		return out;
	}
	Synhigh.tokenize = tokenize;

	// Renderer: one block element per source line

	function render(tokens) {
		var lines = [[]];
		tokens.forEach(function (t) {
			var parts = t[1].split('\n');
			for (var i = 0; i < parts.length; i++) {
				if (i > 0) { lines.push([]); }
				if (parts[i]) {
					var cur = lines[lines.length - 1], prev = cur[cur.length - 1];
					if (prev && prev[0] === t[0]) { prev[1] += parts[i]; } else { cur.push([t[0], parts[i]]); }
				}
			}
		});
		var html = lines.map(function (line) {
			return '<span class="synhigh-line">' + line.map(function (t) {
				var text = u.esc(t[1]);
				return t[0] ? '<span class="synhigh-' + t[0] + '">' + text + '</span>' : text;
			}).join('') + '</span>';
		}).join('');
		return { html: html, lines: lines.length };
	}

	// Public API

	Synhigh.highlight = function (code, lang, opts) {
		opts = opts || {};
		code = String(code).replace(/\r\n?/g, '\n');
		var name = Synhigh.resolve(lang);
		if (!name && opts.auto !== false && typeof Synhigh.detect === 'function') { name = Synhigh.detect(code); }
		var tokens = (name && code.length <= MAX_LEN) ? tokenize(code, name) : [['', code]];
		var r = render(tokens);
		return { lang: name || 'plain', html: r.html, lines: r.lines };
	};

	if (typeof module !== 'undefined' && module.exports) { module.exports = Synhigh; }
}(typeof window !== 'undefined' ? window : globalThis));

// Synhigh - web languages: HTML/XML, CSS, JavaScript/TypeScript, JSON, PHP, SQL

(function (root) {
	'use strict';
	var Synhigh = root.Synhigh, u = Synhigh.util, W = u.W;

	// HTML / XML (with embedded CSS, JS and PHP)

	Synhigh.define('htmltag', {
		hidden: true,
		rules: [
			{ r: /<\/?[A-Za-z][\w:.-]*/, t: 'tag' },
			{ r: /[\w:@.#-]+(?=\s*=)/, t: 'attr' },
			{ r: u.dq, t: 'string' },
			{ r: u.sq, t: 'string' },
			{ r: /\/?>/, t: 'tag' },
			{ r: /[\w:@.#-]+/, t: 'attr' }
		]
	});

	Synhigh.define('html', {
		aliases: ['xml', 'svg', 'xhtml', 'markup', 'htm', 'vue', 'mathml', 'rss', 'xsl'],
		rules: [
			{ r: /<!--[\s\S]*?(?:-->|$)/, t: 'comment' },
			{ r: /<!\[CDATA\[[\s\S]*?(?:\]\]>|$)/, t: 'string' },
			{ r: /<!DOCTYPE[^>]*>|<\?xml[^>]*\?>/i, t: 'meta' },
			{ r: /<\?(?:php\b|=)/, end: /\?>/, lang: 'php', ot: 'meta', ct: 'meta' },
			{ r: /<script\b(?:"[^"]*"|'[^']*'|[^>"'])*>/i, end: /<\/script\s*>/, lang: 'javascript' },
			{ r: /<style\b(?:"[^"]*"|'[^']*'|[^>"'])*>/i, end: /<\/style\s*>/, lang: 'css' },
			{ r: /<\/?[A-Za-z][\w:.-]*(?:"[^"]*"|'[^']*'|[^>"'])*>/, sub: 'htmltag' },
			{ r: /&#?\w+;/, t: 'const' }
		]
	});

	// CSS / SCSS / LESS

	Synhigh.define('css', {
		aliases: ['scss', 'sass', 'less', 'stylesheet'],
		rules: [
			{ r: u.bc, t: 'comment' },
			{ r: /\/\/.*/, t: 'comment' },
			{ r: u.dq, t: 'string' },
			{ r: u.sq, t: 'string' },
			{ r: /@[\w-]+/, t: 'keyword' },
			{ r: /!important\b/, t: 'keyword' },
			{ r: /#(?:[\da-fA-F]{8}|[\da-fA-F]{6}|[\da-fA-F]{3,4})\b/, t: 'number' },
			{ r: /--[\w-]+|\$[\w-]+/, t: 'var' },
			{ r: /-?(?:\d+\.\d+|\.\d+|\d+)(?:%|[a-zA-Z]{1,4}\b)?/, t: 'number' },
			{ r: /[\w-]+(?=\()/, t: 'fn' },
			{ r: /[a-z-]+(?=\s*:\s*[^;{}]*[;}])/, t: 'attr' },
			{ r: /::?[A-Za-z-]+(?:\([^)]*\))?/, t: 'keyword' },
			{ r: /[.#][A-Za-z_-][\w-]*/, t: 'tag' },
			{ r: /\b(?:a|abbr|article|aside|body|button|div|footer|form|h[1-6]|header|html|img|input|label|li|main|nav|ol|p|pre|section|span|table|td|textarea|th|tr|ul)\b(?=[\s,.:#>+~[{])/, t: 'tag' },
			{ r: /[{}();,]/, t: 'punct' }
		]
	});

	// JavaScript / TypeScript / JSX

	var jsKeywords = 'async await break case catch class const continue debugger default delete do else export extends finally for from function get if import in instanceof let new of return set static super switch throw try typeof var void while with yield as';
	var tsKeywords = ' interface type enum implements namespace declare abstract readonly private public protected keyof infer is satisfies';
	Synhigh.define('javascript', {
		aliases: ['js', 'jsx', 'mjs', 'cjs', 'node', 'typescript', 'ts', 'tsx', 'json5'],
		rules: [
			{ r: u.lc, t: 'comment' },
			{ r: u.bc, t: 'comment' },
			{ r: /`(?:\\[\s\S]|[^`\\])*(?:`|$)/, t: 'string' },
			{ r: u.dq, t: 'string' },
			{ r: u.sq, t: 'string' },
			{ r: /\/(?![*\/])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^\/\\\n[])+\/[dgimsuyv]*(?=\s*(?:[.,;:)\]}]|$))/, t: 'regex' },
			{ r: W(jsKeywords + tsKeywords), t: 'keyword' },
			{ r: W('true false null undefined NaN Infinity this arguments'), t: 'const' },
			{ r: W('console window document Math JSON Object Array String Number Boolean Promise Date RegExp Map Set WeakMap WeakSet Symbol Error parseInt parseFloat require module exports process Buffer string number boolean any unknown never void object'), t: 'builtin' },
			{ r: u.num, t: 'number' },
			{ r: /\$?[A-Za-z_$][\w$]*(?=\s*\()/, t: 'fn' },
			{ r: /[A-Za-z_$][\w$]*(?=\s*[:=]\s*(?:async\s*)?(?:\([^)]*\)|[\w$]+)\s*=>)/, t: 'fn' },
			{ r: u.cap, t: 'type' },
			{ r: /=>|[-+*\/%=<>!&|^~?:]+/, t: 'op' },
			{ r: /[{}()[\];,.]/, t: 'punct' }
		]
	});

	// JSON

	Synhigh.define('json', {
		aliases: ['jsonc', 'jsonld', 'webmanifest', 'geojson'],
		rules: [
			{ r: u.lc, t: 'comment' },
			{ r: u.bc, t: 'comment' },
			{ r: /"(?:\\.|[^"\\\n])*"(?=\s*:)/, t: 'attr' },
			{ r: u.dq, t: 'string' },
			{ r: /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/, t: 'number' },
			{ r: /\b(?:true|false|null)\b/, t: 'const' },
			{ r: /[{}[\]:,]/, t: 'punct' }
		]
	});

	// PHP

	var phpKeywords = 'abstract and array as break callable case catch class clone const continue declare default do echo else elseif empty enddeclare endfor endforeach endif endswitch endwhile enum extends final finally fn for foreach function global goto if implements include include_once instanceof insteadof interface isset list match namespace new or print private protected public readonly require require_once return static switch throw trait try unset use var while xor yield from';
	Synhigh.define('php', {
		aliases: ['php3', 'php4', 'php5', 'php7', 'php8', 'phtml', 'blade', 'laravel'],
		rules: [
			{ r: /<\?(?:php\b|=)|\?>/, t: 'meta' },
			{ r: u.lc, t: 'comment' },
			{ r: /#(?!\[).*/, t: 'comment' },
			{ r: u.bc, t: 'comment' },
			{ r: /<<<["']?[A-Za-z_]\w*["']?\n[\s\S]*?\n[ \t]*[A-Za-z_]\w*(?=;|,|\)|\s|$)/, t: 'string' },
			{ r: u.dq, t: 'string' },
			{ r: u.sq, t: 'string' },
			{ r: /`(?:\\.|[^`\\])*`/, t: 'string' },
			{ r: /#\[[^\]]*\]/, t: 'meta' },
			{ r: /\$+[A-Za-z_]\w*/, t: 'var' },
			{ r: /\b(?:true|false|null|TRUE|FALSE|NULL|__[A-Z]+__|PHP_[A-Z_]+|E_[A-Z_]+)\b/, t: 'const' },
			{ r: W(phpKeywords), t: 'keyword' },
			{ r: W('int float string bool boolean array object mixed void never iterable callable self parent static null'), t: 'type' },
			{ r: u.num, t: 'number' },
			{ r: /\\?[A-Za-z_]\w*(?:\\[A-Za-z_]\w*)*(?=\s*\()/, t: 'fn' },
			{ r: /\b[A-Z][A-Za-z0-9_]*(?=::)/, t: 'type' },
			{ r: /(?:\\[A-Za-z_]\w*)+|\b[A-Z][A-Za-z0-9_]*\b/, t: 'type' },
			{ r: /->|\?->|=>|::|[-+*\/%=<>!&|^~?.@]+/, t: 'op' },
			{ r: /[{}()[\];,]/, t: 'punct' }
		]
	});

	// SQL

	var sqlKeywords = 'add all alter and any as asc backup begin between by case check column commit constraint create cross database default delete desc distinct drop else end exec exists foreign from full group having if in index inner insert into is join key left like limit not null offset on or order outer primary procedure replace returning right rollback select set table temporary top transaction truncate union unique update use using values view when where with recursive over partition window explain analyze grant revoke trigger cascade references auto_increment engine charset collate';
	Synhigh.define('sql', {
		ci: true,
		aliases: ['mysql', 'pgsql', 'postgresql', 'sqlite', 'mariadb', 'plsql', 'tsql', 'psql'],
		rules: [
			{ r: /--.*|#.*/, t: 'comment' },
			{ r: u.bc, t: 'comment' },
			{ r: u.sq, t: 'string' },
			{ r: /"(?:[^"\n]|"")*"|`[^`\n]*`|\[[^\]\n]+\]/, t: 'var' },
			{ r: /[@:]\w+|\$\d+|\?/, t: 'var' },
			{ r: W('true false null unknown current_timestamp current_date'), t: 'const' },
			{ r: W('int integer bigint smallint tinyint serial varchar char text blob boolean bool date datetime timestamp time decimal numeric float double real json jsonb uuid enum binary'), t: 'type' },
			{ r: W(sqlKeywords), t: 'keyword' },
			{ r: u.num, t: 'number' },
			{ r: /[A-Za-z_]\w*(?=\s*\()/, t: 'fn' },
			{ r: /[-+*\/%=<>!|&^~]+/, t: 'op' },
			{ r: /[()[\];,.]/, t: 'punct' }
		]
	});
}(typeof window !== 'undefined' ? window : globalThis));

// Synhigh - general languages: Python, Bash, C, C++, Java, C#, Go, Rust, YAML, Ruby, Markdown, INI, Diff

(function (root) {
	'use strict';
	var Synhigh = root.Synhigh, u = Synhigh.util, W = u.W;

	// Python

	Synhigh.define('python', {
		aliases: ['py', 'py3', 'python3', 'pyw'],
		rules: [
			{ r: /#.*/, t: 'comment' },
			{ r: /[rRbBuUfF]{0,2}(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$))/, t: 'string' },
			{ r: /[rRbBuUfF]{0,2}"(?:\\.|[^"\\\n])*"/, t: 'string' },
			{ r: /[rRbBuUfF]{0,2}'(?:\\.|[^'\\\n])*'/, t: 'string' },
			{ r: /@[A-Za-z_][\w.]*/, t: 'meta' },
			{ r: W('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case'), t: 'keyword' },
			{ r: W('True False None self cls'), t: 'const' },
			{ r: W('print len range int str float list dict set tuple bool open input type isinstance super enumerate zip map filter sorted sum min max abs any all repr object Exception ValueError TypeError KeyError'), t: 'builtin' },
			{ r: u.num, t: 'number' },
			{ r: /[A-Za-z_]\w*(?=\s*\()/, t: 'fn' },
			{ r: /\b[A-Z][A-Za-z0-9_]*\b/, t: 'type' },
			{ r: /[-+*\/%=<>!&|^~:@]+/, t: 'op' },
			{ r: /[{}()[\];,.]/, t: 'punct' }
		]
	});

	// Bash / Shell

	Synhigh.define('bash', {
		aliases: ['sh', 'shell', 'zsh', 'console', 'shellscript', 'terminal', 'fish'],
		rules: [
			{ r: /^#!.*/, t: 'meta' },
			{ r: /(?:^|\s)#.*/, t: 'comment' },
			{ r: /<<-?\s*["']?[A-Za-z_]\w*["']?\n[\s\S]*?\n[A-Z_a-z]\w*$/, t: 'string' },
			{ r: u.dq, t: 'string' },
			{ r: /'[^'\n]*'/, t: 'string' },
			{ r: /\$\{[^}\n]*\}|\$\([^)\n]*\)|\$[A-Za-z_]\w*|\$[0-9@#?$!*-]/, t: 'var' },
			{ r: /(?:^|\s)--?[A-Za-z][\w-]*/, t: 'attr' },
			{ r: W('if then else elif fi for while until do done case esac in function select time return break continue exit local export readonly declare unset source alias'), t: 'keyword' },
			{ r: W('echo cd ls cat grep sed awk find chmod chown mkdir rm cp mv curl wget git sudo apt apt-get yum npm npx yarn pip python python3 php composer docker make tar ssh scp kill ps test printf read eval exec set shift trap'), t: 'builtin' },
			{ r: /[A-Za-z_]\w*(?==)/, t: 'var' },
			{ r: u.num, t: 'number' },
			{ r: /[|&;<>(){}[\]=!]+/, t: 'op' }
		]
	});

	// C-family helper

	function cFamily(extra) {
		return [
			{ r: u.lc, t: 'comment' },
			{ r: u.bc, t: 'comment' },
			{ r: /^[ \t]*#[ \t]*(?:include|define|undef|ifn?def|if|elif|else|endif|pragma|error|warning|line)\b.*/, t: 'meta' },
			{ r: /(?:L|u8|u|U)?"(?:\\.|[^"\\\n])*"/, t: 'string' },
			{ r: /'(?:\\.|[^'\\\n])+'/, t: 'string' }
		].concat(extra, [
			{ r: u.num, t: 'number' },
			{ r: u.fn, t: 'fn' },
			{ r: /\b[A-Z][A-Za-z0-9_]*\b/, t: 'type' },
			{ r: /->|::|[-+*\/%=<>!&|^~?:]+/, t: 'op' },
			{ r: /[{}()[\];,.]/, t: 'punct' }
		]);
	}

	var cTypes = 'int char short long float double void signed unsigned size_t ssize_t uint8_t uint16_t uint32_t uint64_t int8_t int16_t int32_t int64_t bool FILE wchar_t ptrdiff_t';
	var cKw = 'auto break case const continue default do else enum extern for goto if inline register restrict return sizeof static struct switch typedef union volatile while';

	Synhigh.define('c', {
		aliases: ['h', 'ansic', 'objc', 'cuda', 'arduino', 'ino'],
		rules: cFamily([
			{ r: W(cKw), t: 'keyword' },
			{ r: W(cTypes), t: 'type' },
			{ r: /\b(?:NULL|true|false|EOF|stdin|stdout|stderr)\b/, t: 'const' }
		])
	});

	Synhigh.define('cpp', {
		aliases: ['c++', 'cc', 'cxx', 'hpp', 'hxx', 'h++'],
		rules: cFamily([
			{ r: /R"[^(\s]*\([\s\S]*?\)[^"\s]*"/, t: 'string' },
			{ r: W(cKw + ' alignas alignof and bitand bitor catch class compl concept consteval constexpr constinit const_cast co_await co_return co_yield decltype delete dynamic_cast explicit export final friend mutable namespace new noexcept not operator or override private protected public reinterpret_cast requires static_assert static_cast template this throw try typeid typename using virtual xor'), t: 'keyword' },
			{ r: W(cTypes + ' string wstring vector map set list array deque unordered_map unordered_set pair tuple unique_ptr shared_ptr weak_ptr optional variant nullptr_t'), t: 'type' },
			{ r: /\b(?:NULL|nullptr|true|false)\b/, t: 'const' },
			{ r: /\bstd(?=::)/, t: 'builtin' }
		])
	});

	// Java

	Synhigh.define('java', {
		aliases: ['kotlin', 'kt', 'groovy', 'scala'],
		rules: [
			{ r: u.lc, t: 'comment' },
			{ r: u.bc, t: 'comment' },
			{ r: /"""[\s\S]*?(?:"""|$)/, t: 'string' },
			{ r: u.dq, t: 'string' },
			{ r: /'(?:\\.|[^'\\\n])+'/, t: 'string' },
			{ r: /@[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*/, t: 'meta' },
			{ r: W('abstract assert break case catch class const continue default do else enum extends final finally for goto if implements import instanceof interface native new package private protected public record return sealed permits static strictfp super switch synchronized this throw throws transient try var volatile while yield fun val when object companion override open data lateinit suspend'), t: 'keyword' },
			{ r: W('boolean byte char double float int long short void String Integer Long Double Float Boolean Object List Map Set ArrayList HashMap Optional Exception'), t: 'type' },
			{ r: /\b(?:true|false|null)\b/, t: 'const' },
			{ r: u.num, t: 'number' },
			{ r: u.fn, t: 'fn' },
			{ r: /\b[A-Z][A-Za-z0-9_]*\b/, t: 'type' },
			{ r: /->|::|[-+*\/%=<>!&|^~?:]+/, t: 'op' },
			{ r: /[{}()[\];,.]/, t: 'punct' }
		]
	});

	Synhigh.define('csharp', {
		aliases: ['cs', 'c#', 'dotnet', 'dart', 'swift'],
		rules: [
			{ r: u.lc, t: 'comment' },
			{ r: u.bc, t: 'comment' },
			{ r: /@"(?:[^"]|"")*"|\$@?"(?:\\.|[^"\\\n])*"/, t: 'string' },
			{ r: u.dq, t: 'string' },
			{ r: /'(?:\\.|[^'\\\n])+'/, t: 'string' },
			{ r: /^[ \t]*#\w+.*/, t: 'meta' },
			{ r: W('abstract as async await base break case catch checked class const continue default delegate do else enum event explicit extern finally fixed for foreach goto if implicit in interface internal is lock namespace new operator out override params private protected public readonly ref return sealed sizeof stackalloc static struct switch this throw try typeof unchecked unsafe using var virtual volatile while yield record init get set where let func guard'), t: 'keyword' },
			{ r: W('bool byte char decimal double float int long object sbyte short string uint ulong ushort void dynamic String Int Double Bool List Dictionary Task'), t: 'type' },
			{ r: /\b(?:true|false|null|nil)\b/, t: 'const' },
			{ r: u.num, t: 'number' },
			{ r: u.fn, t: 'fn' },
			{ r: /\b[A-Z][A-Za-z0-9_]*\b/, t: 'type' },
			{ r: /=>|\?\?|::|[-+*\/%=<>!&|^~?:]+/, t: 'op' },
			{ r: /[{}()[\];,.]/, t: 'punct' }
		]
	});

	// Go

	Synhigh.define('go', {
		aliases: ['golang'],
		rules: [
			{ r: u.lc, t: 'comment' },
			{ r: u.bc, t: 'comment' },
			{ r: /`[^`]*(?:`|$)/, t: 'string' },
			{ r: u.dq, t: 'string' },
			{ r: /'(?:\\.|[^'\\\n])+'/, t: 'string' },
			{ r: W('break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var'), t: 'keyword' },
			{ r: W('bool byte complex64 complex128 error float32 float64 int int8 int16 int32 int64 rune string uint uint8 uint16 uint32 uint64 uintptr any comparable'), t: 'type' },
			{ r: /\b(?:true|false|nil|iota)\b/, t: 'const' },
			{ r: W('append cap close complex copy delete imag len make new panic print println real recover fmt'), t: 'builtin' },
			{ r: u.num, t: 'number' },
			{ r: u.fn, t: 'fn' },
			{ r: /\b[A-Z][A-Za-z0-9_]*\b/, t: 'type' },
			{ r: /:=|<-|\.\.\.|[-+*\/%=<>!&|^~]+/, t: 'op' },
			{ r: /[{}()[\];,.:]/, t: 'punct' }
		]
	});

	// Rust

	Synhigh.define('rust', {
		aliases: ['rs'],
		rules: [
			{ r: /\/\/.*/, t: 'comment' },
			{ r: u.bc, t: 'comment' },
			{ r: /b?r#*"[\s\S]*?"#*/, t: 'string' },
			{ r: /b?"(?:\\[\s\S]|[^"\\])*(?:"|$)/, t: 'string' },
			{ r: /b?'(?:\\.[^']*|[^'\\\n])'/, t: 'string' },
			{ r: /'[A-Za-z_]\w*\b(?!')/, t: 'var' },
			{ r: /#!?\[[^\]]*\]/, t: 'meta' },
			{ r: /\b[A-Za-z_]\w*!(?=\s*[({[])/, t: 'builtin' },
			{ r: W('as async await break const continue crate dyn else enum extern fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait type union unsafe use where while'), t: 'keyword' },
			{ r: W('bool char str i8 i16 i32 i64 i128 isize u8 u16 u32 u64 u128 usize f32 f64 String Vec Option Result Box Rc Arc HashMap HashSet BTreeMap'), t: 'type' },
			{ r: /\b(?:true|false|None|Some|Ok|Err)\b/, t: 'const' },
			{ r: u.num, t: 'number' },
			{ r: u.fn, t: 'fn' },
			{ r: /\b[A-Z][A-Za-z0-9_]*\b/, t: 'type' },
			{ r: /->|=>|::|\.\.=?|[-+*\/%=<>!&|^~?]+/, t: 'op' },
			{ r: /[{}()[\];,.:]/, t: 'punct' }
		]
	});

	// YAML / TOML / INI

	Synhigh.define('yaml', {
		aliases: ['yml', 'toml', 'ini', 'conf', 'cfg', 'properties', 'env', 'dotenv', 'editorconfig'],
		rules: [
			{ r: /(?:^|\s)#.*|^;.*/, t: 'comment' },
			{ r: /^---.*$|^\.\.\.$/, t: 'meta' },
			{ r: /^\s*\[[^\]\n]+\]\s*$/, t: 'keyword' },
			{ r: /^\s*-?\s*(?:"[^"\n]*"|'[^'\n]*'|[\w.\/ $@-]+?)(?=\s*[:=](?:\s|$))/, t: 'attr' },
			{ r: u.dq, t: 'string' },
			{ r: u.sq, t: 'string' },
			{ r: /[&*!][\w-]+/, t: 'var' },
			{ r: /\b(?:true|false|null|yes|no|on|off|~)\b/i, t: 'const' },
			{ r: /-?\b\d+(?:\.\d+)?\b/, t: 'number' },
			{ r: /[|>][+-]?(?=\s*$)|^\s*-(?=\s)|[[\]{},:=]/, t: 'punct' }
		]
	});

	// Ruby

	Synhigh.define('ruby', {
		aliases: ['rb', 'rake', 'gemfile'],
		rules: [
			{ r: /#.*/, t: 'comment' },
			{ r: /^=begin[\s\S]*?^=end/, t: 'comment' },
			{ r: u.dq, t: 'string' },
			{ r: u.sq, t: 'string' },
			{ r: /:[A-Za-z_]\w*[?!]?|:"[^"]*"/, t: 'const' },
			{ r: /@@?[A-Za-z_]\w*|\$\w+/, t: 'var' },
			{ r: W('alias and begin break case class def defined do else elsif end ensure for if in module next not or redo rescue retry return self super then undef unless until when while yield require require_relative include extend attr_accessor attr_reader attr_writer puts print'), t: 'keyword' },
			{ r: /\b(?:true|false|nil)\b/, t: 'const' },
			{ r: u.num, t: 'number' },
			{ r: /[A-Za-z_]\w*[?!]?(?=\s*\()/, t: 'fn' },
			{ r: /\b[A-Z][A-Za-z0-9_]*\b/, t: 'type' },
			{ r: /=>|<<|[-+*\/%=<>!&|^~?:]+/, t: 'op' },
			{ r: /[{}()[\];,.]/, t: 'punct' }
		]
	});

	// Diff / Markdown

	Synhigh.define('diff', {
		aliases: ['patch'],
		rules: [
			{ r: /^(?:diff |index |---|\+\+\+).*/, t: 'meta' },
			{ r: /^@@.*@@.*/, t: 'keyword' },
			{ r: /^\+.*/, t: 'inserted' },
			{ r: /^-.*/, t: 'deleted' }
		]
	});

	Synhigh.define('markdown', {
		aliases: ['md', 'mdx'],
		rules: [
			{ r: /^```.*$/, t: 'meta' },
			{ r: /^#{1,6}\s.*/, t: 'keyword' },
			{ r: /^\s*(?:[-*+]|\d+\.)\s/, t: 'punct' },
			{ r: /`[^`\n]+`/, t: 'string' },
			{ r: /\*\*[^*\n]+\*\*|__[^_\n]+__/, t: 'builtin' },
			{ r: /\[[^\]\n]*\]\([^)\n]*\)/, t: 'fn' },
			{ r: /^>.*/, t: 'comment' }
		]
	});
}(typeof window !== 'undefined' ? window : globalThis));

// Synhigh - automatic language detection (signature scoring)

(function (root) {
	'use strict';
	var Synhigh = root.Synhigh;

	// [regex, weight]. A rule counts once; strong, language-unique constructs carry high weights.
	var SIG = {
		php: [[/<\?php\b|<\?=/, 25], [/\$\w+\s*(?:=[^=]|->|\[|;|\))/, 4], [/->\w+\s*\(/, 2], [/\b(?:echo|isset|array|foreach|namespace)\b/, 3],
		[/\bfunction\s+\w+\s*\([^)]*\$/, 6], [/\b(?:public|private|protected)\s+(?:static\s+)?(?:function|\$)/, 6], [/\buse\s+[A-Z]\w*(?:\\\w+)+;/, 8], [/\b(?:add_action|add_filter|wp_enqueue_\w+|get_option|esc_html|esc_attr)\s*\(/, 8]],
		html: [[/<!DOCTYPE\s+html/i, 25], [/<(?:html|head|body)\b[^>]*>/i, 10], [/<\/?(?:div|span|p|a|ul|ol|li|h[1-6]|img|table|tr|td|form|input|button|section|nav|header|footer|main|label|svg|path|script|style|link|meta)\b[^>]*>/i, 9],
		[/<\/\w+>/, 3], [/<\?xml\b/, 15], [/<[A-Za-z][\w:-]*(?:\s+[\w:-]+="[^"]*")+\s*\/?>/, 6]],
		css: [[/(?:^|\})\s*[.#]?[A-Za-z][\w\s.#:>+~,\[\]="'*-]*\{\s*[\w-]+\s*:[^}]*\}/, 14], [/@(?:media|import|font-face|keyframes|supports|charset|tailwind|apply)\b/, 10],
		[/^\s*[a-z-]+\s*:\s*[^;{}\n]+;\s*$/m, 4], [/\b(?:px|rem|em|vh|vw)\b|#[\da-f]{3,8}\b/i, 2], [/\b(?:margin|padding|display|color|background|font-size|border|flex|grid)\s*:/, 6]],
		javascript: [[/\b(?:const|let|var)\s+[\w${}\[\],\s]+\s*=/, 6], [/=>/, 3], [/\bfunction\b\s*\w*\s*\(/, 4], [/\bconsole\.\w+\(/, 8], [/\b(?:document|window)\.\w+/, 6],
		[/\b(?:require\(['"]|import\s+[\w{}*\s,]+\s+from\s+['"]|export\s+(?:default|const|function|class))/, 8], [/[!=]==/, 3], [/\b(?:addEventListener|querySelector\w*|getElementById|JSON\.(?:parse|stringify)|Promise|async|await)\b/, 5],
		[/:\s*(?:string|number|boolean|any)\b|\binterface\s+\w+\s*\{|<\w+>\(/, 4]],
		json: [[/^\s*[\[{][\s\S]*[\]}]\s*$/, 3], [/"[^"\n]*"\s*:\s*(?:"|\d|true|false|null|\{|\[)/, 9], [/,\s*"[^"\n]*"\s*:/, 4]],
		python: [[/^\s*def\s+\w+\s*\([^)]*\)\s*(?:->\s*[\w\[\], .]+)?:\s*$/m, 12], [/^\s*class\s+\w+(?:\([^)]*\))?:\s*$/m, 10], [/^\s*(?:from\s+[\w.]+\s+import|import\s+\w+)/m, 5], [/\b(?:self|elif|None|True|False)\b/, 4],
		[/\bprint\s*\(/, 2], [/^\s*(?:if|for|while|else|try|except|with)\b[^\n{;]*:\s*$/m, 6], [/\blambda\b|\bdef\b|__\w+__/, 4], [/^\s*#(?!include|!)/m, 1]],
		bash: [[/^#!.*\b(?:ba|z|k)?sh\b/m, 30], [/^\s*(?:\$|#)\s+\w+/m, 5], [/^\s*(?:sudo|apt(?:-get)?|yum|npm|npx|yarn|pip3?|git|cd|ls|echo|curl|wget|chmod|chown|mkdir|rm|cp|mv|cat|grep|export|docker|composer|systemctl|tar)\b/m, 9],
		[/\$\{?\w+\}?|\$\(/, 3], [/\b(?:fi|done|esac)\b|\bthen\s*$/m, 6], [/\s--?[a-z][\w-]*(?:[= ]|$)/, 3], [/\s(?:&&|\|\||\|)\s/, 2]],
		c: [[/#include\s*<[\w\/]+\.h>/, 16], [/\bint\s+main\s*\(/, 10], [/\b(?:printf|scanf|malloc|free|sizeof|memcpy|strlen)\s*\(/, 6], [/\b(?:struct|typedef|enum|unsigned|uint\d+_t|size_t)\b/, 4], [/\b(?:int|char|void|float|double)\s+\*?\w+\s*[(=;\[]/, 4], [/#define\s+\w+/, 5]],
		cpp: [[/#include\s*<(?:iostream|vector|string|map|set|memory|algorithm|cstdio|cstdlib|sstream|fstream)>/, 22], [/\bstd::\w+/, 12], [/\b(?:cout|cin|endl)\b/, 8], [/\btemplate\s*<[^>]*>/, 9], [/\b(?:namespace|nullptr|constexpr|auto|virtual|override|using\s+namespace)\b/, 5], [/\bclass\s+\w+[^;{]*\{/, 4], [/\w+::\w+\s*\(/, 4]],
		java: [[/\bpublic\s+(?:static\s+)?(?:final\s+)?(?:class|interface|enum|void|[A-Z]\w*)\b/, 8], [/System\.(?:out|err)\.\w+/, 16], [/\bimport\s+java(?:x)?\.[\w.*]+;/, 16], [/@(?:Override|Autowired|Test|Entity|Service|Component)\b/, 8], [/\b(?:String|Integer|ArrayList|HashMap|List<)/, 3], [/\bpackage\s+[\w.]+;/, 8], [/\bthrows\s+\w+|\bnew\s+\w+<?[\w<>,\s]*>?\(/, 4]],
		csharp: [[/\busing\s+System[\w.]*;/, 18], [/\bConsole\.Write(?:Line)?\(/, 14], [/\bnamespace\s+[\w.]+\s*[{;]/, 6], [/\b(?:public|private|internal)\s+(?:static\s+)?(?:async\s+)?(?:Task|void|string|int|bool)\b/, 5], [/\b(?:var|string|List<)\b[^;]*;|\{\s*get;\s*(?:set;)?\s*\}/, 4], [/\bforeach\s*\(\s*var\b/, 6]],
		go: [[/^package\s+\w+\s*$/m, 18], [/\bfunc\s+(?:\(\s*\w+\s+\*?\w+\s*\)\s*)?\w+\s*\(/, 12], [/:=/, 6], [/\bfmt\.\w+\(/, 12], [/\b(?:defer|chan|goroutine|go\s+func|interface\s*\{|make\(|nil)\b/, 6], [/\bimport\s*\(\s*\n?\s*"/, 10], [/\bvar\s+\w+\s+(?:int|string|bool|float64|\[\]\w+|map\[)/, 8]],
		rust: [[/\bfn\s+\w+\s*(?:<[^>]*>)?\s*\(/, 9], [/\blet\s+(?:mut\s+)?\w+/, 6], [/\b(?:println|print|vec|format|panic|assert(?:_eq)?|macro_rules|write(?:ln)?)!/, 12], [/\buse\s+(?:std|crate|self|super)::/, 12], [/\b(?:impl|trait|pub\s+(?:fn|struct|enum|mod)|match|mut|Option<|Result<|&mut|&str|unwrap\(\))\b/, 5], [/->\s*[\w<>&]+\s*\{/, 3], [/#\[derive\(/, 12]],
		sql: [[/\bSELECT\b[\s\S]+?\bFROM\b/i, 16], [/\b(?:INSERT\s+INTO|UPDATE\s+[\w`."]+\s+SET|CREATE\s+(?:TABLE|INDEX|VIEW|DATABASE)|DELETE\s+FROM|ALTER\s+TABLE|DROP\s+TABLE|TRUNCATE\s+TABLE)\b/i, 18], [/\b(?:WHERE|JOIN|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|VALUES)\b/i, 4], [/\b(?:VARCHAR|BIGINT|PRIMARY\s+KEY|AUTO_INCREMENT|NOT\s+NULL)\b/i, 6]],
		yaml: [[/^---\s*$/m, 6], [/^(?:[ \t]*-[ \t]+)?[\w.\-"']+:(?:[ \t]+\S.*)?$/m, 3], [/^\s*-\s+[\w.-]+:\s+\S/m, 5], [/^[ \t]+[\w.-]+:\s*$/m, 4], [/^\s*(?:version|services|name|on|jobs|steps|image|apiVersion|kind|metadata|spec):/m, 8]],
		ruby: [[/\bdef\s+\w+[?!]?(?:\([^)]*\))?\s*$/m, 7], [/^\s*end\s*$/m, 6], [/\b(?:puts|attr_accessor|require_relative|elsif|unless|do\s*\|\w+\|)\b/, 7], [/\brequire\s+['"]/, 4], [/@\w+\s*=|:\w+\s*=>|\bnil\b/, 3], [/\bclass\s+[A-Z]\w*(?:\s*<\s*[A-Z]\w*)?\s*$/m, 6]],
		diff: [[/^diff --git /m, 30], [/^@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@/m, 30], [/^(?:---|\+\+\+) \S/m, 8]],
		markdown: [[/^#{1,6}\s+\S/m, 5], [/^\s*[-*]\s+\S/m, 2], [/\[[^\]]+\]\([^)]+\)/, 5], [/^```/m, 10], [/\*\*[^*]+\*\*/, 4]]
	};

	var ORDER = ['php', 'html', 'css', 'javascript', 'json', 'python', 'bash', 'c', 'cpp', 'java', 'csharp', 'go', 'rust', 'sql', 'yaml', 'ruby', 'diff', 'markdown'];

	function isJSON(s) {
		var t = s.trim();
		if (!/^[\[{]/.test(t) || !/[\]}]$/.test(t)) { return false; }
		try { JSON.parse(t); return true; } catch (e) { return false; }
	}

	// Returns {scores, best, confidence} so callers can inspect how sure the guess is.

	Synhigh.analyze = function (code) {
		var scores = {}, best = null, top = 0, second = 0;
		var sample = code.length > 20000 ? code.slice(0, 20000) : code;
		ORDER.forEach(function (lang) {
			var s = 0;
			SIG[lang].forEach(function (sig) { if (sig[0].test(sample)) { s += sig[1]; } });
			scores[lang] = s;
		});
		if (isJSON(sample)) { scores.json += 40; }
		/* PHP wins only when the file really starts in PHP; otherwise HTML with embedded PHP. */
		if (/^\s*<\?(?:php|=)/.test(sample)) { scores.php += 25; scores.html = Math.max(0, scores.html - 20); }
		else if (scores.html >= 9) { scores.php = Math.max(0, scores.php - 25); } /* markup that merely embeds PHP tags is an HTML template */
		/* C++ superset of C: prefer C++ when its own signals appear. */
		if (scores.cpp > 0 && scores.c > 0 && scores.cpp >= scores.c * 0.6) { scores.c = Math.max(0, scores.c - 10); }
		/* Markdown and YAML are weak signals: demote when a stronger language scored. */
		['markdown', 'yaml'].forEach(function (weak) {
			ORDER.forEach(function (o) { if (o !== weak && o !== 'diff' && scores[o] >= 18) { scores[weak] = Math.floor(scores[weak] / 2); } });
		});
		ORDER.forEach(function (lang) {
			var s = scores[lang];
			if (s > top) { second = top; top = s; best = lang; } else if (s > second) { second = s; }
		});
		return { scores: scores, best: top >= 8 ? best : null, confidence: top ? (top - second) / top : 0 };
	};

	Synhigh.detect = function (code) { return Synhigh.analyze(code).best; };
}(typeof window !== 'undefined' ? window : globalThis));

// Synhigh - DOM layer: block discovery, line numbers, copy button, themes

(function (root) {
	'use strict';
	var Synhigh = root.Synhigh;
	if (typeof document === 'undefined') { return; }

	var DEFAULTS = {
		selector: 'pre code, pre.wp-block-code, pre.wp-block-preformatted.synhigh',
		theme: 'auto',            // auto | dark | light | any registered theme
		lineNumbers: true,
		copyButton: true,
		showLabel: true,
		autoDetect: true,
		observe: false,           // re-run on DOM changes (infinite scroll, AJAX themes)
		minLinesForNumbers: 2,
		i18n: { copy: 'Copy', copied: 'Copied!', failed: 'Failed', copyAria: 'Copy code to clipboard' }
	};

	var LABELS = {
		html: 'HTML', css: 'CSS', javascript: 'JavaScript', json: 'JSON', php: 'PHP', sql: 'SQL', python: 'Python', bash: 'Bash',
		c: 'C', cpp: 'C++', java: 'Java', csharp: 'C#', go: 'Go', rust: 'Rust', yaml: 'YAML', ruby: 'Ruby', diff: 'Diff', markdown: 'Markdown', plain: 'Text'
	};

	// Only explicit opt-out classes skip a block; a bare "text" class is too common in themes to trust.

	var SKIP = /^(?:nohighlight|no-highlight|synhigh-off|language-(?:none|text|plain|plaintext|txt)|lang-(?:none|text|plain|plaintext|txt)|plaintext)$/i;

	function cfg() {
		var c = {}, user = root.SynhighConfig || {}, k;
		for (k in DEFAULTS) { c[k] = DEFAULTS[k]; }
		for (k in user) { if (k !== 'i18n') { c[k] = user[k]; } }
		c.i18n = {};
		for (k in DEFAULTS.i18n) { c.i18n[k] = (user.i18n && user.i18n[k]) || DEFAULTS.i18n[k]; }
		return c;
	}

	// Language from class names ("language-php", "lang-php", "brush: php", "php"), then data attributes.

	function readHint(el) {
		var attr = el.getAttribute('data-synhigh-lang') || el.getAttribute('data-lang') || el.getAttribute('data-language');
		var list = (el.className && el.className.baseVal === undefined ? String(el.className) : '').split(/\s+/);
		var found = { off: false, lang: null }, i, c, m;
		for (i = 0; i < list.length; i++) {
			c = list[i];
			if (!c) { continue; }
			if (SKIP.test(c)) { found.off = true; continue; }
			m = /^(?:language|lang|highlight-source|brush:?)[-_:]?(.+)$/i.exec(c);
			if (m && Synhigh.resolve(m[1])) { found.lang = Synhigh.resolve(m[1]); break; }
			if (Synhigh.resolve(c) && !/^synhigh|^wp-/.test(c)) { found.lang = Synhigh.resolve(c); }
		}
		if (!found.lang && attr && Synhigh.resolve(attr)) { found.lang = Synhigh.resolve(attr); }
		return found;
	}

	function hint(code, pre) {
		var a = readHint(code), b = pre && pre !== code ? readHint(pre) : { off: false, lang: null };
		return { off: a.off || b.off, lang: a.lang || b.lang };
	}

	function inEditor(el) {
		return !!(el.closest && el.closest('.editor-styles-wrapper, .block-editor-block-list__layout, .wp-block-editor, #editor, .mce-content-body'));
	}

	function copyText(text, done) {
		function legacy() {
			var ta = document.createElement('textarea'), ok = false;
			ta.value = text; ta.setAttribute('readonly', '');
			ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
			document.body.appendChild(ta); ta.select();
			try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
			document.body.removeChild(ta); done(ok);
		}
		if (navigator.clipboard && navigator.clipboard.writeText && root.isSecureContext !== false) {
			navigator.clipboard.writeText(text).then(function () { done(true); }, legacy);
		} else { legacy(); }
	}

	function el(tag, cls, text) {
		var n = document.createElement(tag);
		if (cls) { n.className = cls; }
		if (text) { n.textContent = text; }
		return n;
	}

	function enhance(node, c) {
		var pre, code;
		if (node.tagName === 'PRE') { pre = node; code = node.querySelector('code') || node; } else { code = node; pre = node.closest('pre'); }
		if (!pre || pre.getAttribute('data-synhigh') || inEditor(pre)) { return; }
		if (pre.closest('.synhigh')) { return; }

		var h = hint(code, pre);
		pre.setAttribute('data-synhigh', '1');
		if (h.off) { return; }

		var source = code.textContent.replace(/\r\n?/g, '\n').replace(/\n$/, '');
		var res = Synhigh.highlight(source, h.lang, { auto: c.autoDetect });
		var wrap = el('div', 'synhigh synhigh-theme-' + c.theme);
		wrap.setAttribute('data-lang', res.lang);
		var numbered = c.lineNumbers && res.lines >= c.minLinesForNumbers &&
			pre.getAttribute('data-line-numbers') !== 'false' && code.getAttribute('data-line-numbers') !== 'false';
		if (numbered) {
			wrap.classList.add('synhigh-numbered');
			var start = parseInt(pre.getAttribute('data-start') || code.getAttribute('data-start') || '1', 10);
			if (start > 1) { code.style.setProperty('--synhigh-start', String(start - 1)); }
		}

		var bar = el('div', 'synhigh-bar');
		if (c.showLabel) { bar.appendChild(el('span', 'synhigh-label', LABELS[res.lang] || res.lang)); }
		var btn = null;
		if (c.copyButton) {
			btn = el('button', 'synhigh-copy', c.i18n.copy);
			btn.type = 'button';
			btn.setAttribute('aria-label', c.i18n.copyAria);
			var timer;
			btn.addEventListener('click', function () {
				copyText(source, function (ok) {
					btn.textContent = ok ? c.i18n.copied : c.i18n.failed;
					btn.classList.toggle('is-done', ok);
					clearTimeout(timer);
					timer = setTimeout(function () { btn.textContent = c.i18n.copy; btn.classList.remove('is-done'); }, 1800);
				});
			});
			bar.appendChild(btn);
		}

		code.innerHTML = res.html;
		code.classList.add('synhigh-code');
		pre.classList.add('synhigh-pre');
		if (pre.parentNode) { pre.parentNode.insertBefore(wrap, pre); }
		if (c.showLabel || c.copyButton) { wrap.appendChild(bar); }
		wrap.appendChild(pre);
	}

	// Public API

	Synhigh.highlightAll = function (scope) {
		var c = cfg(), list = (scope || document).querySelectorAll(c.selector), i;
		for (i = 0; i < list.length; i++) { enhance(list[i], c); }
	};

	Synhigh.highlightElement = function (node) { enhance(node, cfg()); };

	// Register a custom theme: Synhigh.registerTheme('ocean', { bg:'#0b1d2a', fg:'#d6e4f0', keyword:'#ff9e64', ... })
	
	var THEME_KEYS = ['bg', 'fg', 'muted', 'border', 'comment', 'keyword', 'string', 'number', 'fn', 'var', 'type', 'const', 'op', 'punct', 'tag', 'attr', 'builtin', 'meta', 'regex', 'inserted', 'deleted', 'lineno', 'selection'];
	Synhigh.registerTheme = function (name, colors) {
		if (!/^[a-z0-9_-]+$/i.test(name)) { return false; }
		var css = '.synhigh-theme-' + name + '{', k, i;
		for (i = 0; i < THEME_KEYS.length; i++) {
			k = THEME_KEYS[i];
			if (colors[k] && /^[#\w\s(),.%\/-]+$/.test(colors[k])) { css += '--synhigh-' + k + ':' + colors[k] + ';'; }
		}
		css += '}';
		var s = document.getElementById('synhigh-themes');
		if (!s) { s = document.createElement('style'); s.id = 'synhigh-themes'; document.head.appendChild(s); }
		s.appendChild(document.createTextNode(css));
		return true;
	};

	function boot() {
		var user = root.SynhighConfig || {}, t = user.themes, n;
		if (t) { for (n in t) { if (Object.prototype.hasOwnProperty.call(t, n)) { Synhigh.registerTheme(n, t[n]); } } }
		Synhigh.highlightAll();
		if (cfg().observe && root.MutationObserver) {
			var pending = false;
			new MutationObserver(function () {
				if (pending) { return; }
				pending = true;
				(root.requestAnimationFrame || root.setTimeout)(function () { pending = false; Synhigh.highlightAll(); });
			}).observe(document.body, { childList: true, subtree: true });
		}
	}

	if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', boot); } else { boot(); }
}(window));
