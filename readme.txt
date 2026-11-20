=== Synhigh : Code Highlighter ===
Contributors: authora
Tags: syntax highlighter, code, gutenberg, copy button, dark mode
Requires at least: 7.1
Tested up to: 7.1
Requires PHP: 8.0
Stable tag: 1.0.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Lightweight syntax highlighting with auto language detection, line numbers, and a copy button. No external libraries or CDN requests.

== Description ==

Synhigh highlights the code blocks you already write with the native **Code** and **Preformatted** blocks — zero configuration required. No external libraries, no CDN requests, no build step: a single small script and stylesheet, loaded only on pages that actually contain code.

= Features =

* **Automatic language detection** — signature-based scoring guesses the language when no class is set.
* **18 built-in languages** with common aliases: HTML, CSS, JavaScript/TypeScript, JSON, PHP, SQL, Python, Bash, C, C++, Java, C#, Go, Rust, YAML, Ruby, Diff, and Markdown.
* **Line numbers** with a custom starting line (`data-start`).
* **One-click copy button** with Clipboard API + legacy fallback and translated labels.
* **Language label** shown above each block.
* **4 themes**: Auto (follows the visitor's light/dark preference), Dark, Light, and Ember — plus custom themes via CSS variables.
* **Smart loading** — assets load only on pages whose content contains a code block.
* **MutationObserver support** for infinite scroll and AJAX page transitions (optional).
* **Editor-safe** — never touches blocks inside the Gutenberg or classic editor.
* **Clean uninstall** — removes its options when deleted.

= Usage =

Add a **Code** block (or Preformatted block) and paste your code. The language is detected automatically.

To set the language explicitly, open the block's **Advanced → Additional CSS class(es)** field and enter a class such as `language-php`. Accepted hint formats: `language-php`, `lang-php`, `brush: php`, or a bare `php`. Aliases work too (`js`, `ts`, `py`, `yml`, `sh`, …).

Skip a block by adding the class `nohighlight`. Per-block options: `data-line-numbers="false"` hides line numbers for one block, and `data-start="10"` starts numbering at line 10.

= Developer friendly =

Three PHP filters are available: `synhigh_themes` (register custom themes), `synhigh_should_load` (control per-page asset loading), and `synhigh_js_config` (adjust the front-end configuration). Every theme color can be overridden with CSS variables such as `--synhigh-bg`, `--synhigh-keyword`, and `--synhigh-string` from the Custom CSS settings tab.

Source code and contributions: [GitHub repository](https://github.com/Synhigh/synhigh-wordpress).

== Installation ==

1. Upload the `synhigh-wordpress` folder to the `/wp-content/plugins/` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate **Synhigh Code Highlighter** through the *Plugins* screen.
3. Done — code blocks are highlighted automatically. Adjust options under **Settings → Code Highlighter**.

== Frequently Asked Questions ==

= Do I need to configure anything? =

No. Activate the plugin and your existing Code and Preformatted blocks are highlighted automatically, with the language detected for you.

= How do I set the language manually? =

Add a class such as `language-php` to the block via **Advanced → Additional CSS class(es)**. Formats like `lang-php`, `brush: php`, a bare `php`, and aliases (`js`, `py`, `yml`, …) all work.

= How do I stop a block from being highlighted? =

Add the class `nohighlight` (or `language-plaintext`) to the block.

= Can I change the colors? =

Yes. Pick one of the four built-in themes under **Settings → Code Highlighter**, or override any color with CSS variables (e.g. `--synhigh-bg`, `--synhigh-keyword`) in the Custom CSS tab.

= Does it work with infinite scroll or AJAX themes? =

Enable **Watch for content added after page load** on the Loading tab. Synhigh then uses a MutationObserver to highlight code inserted after the initial page load.

= Does it load external scripts or fonts? =

No. Everything is bundled locally, and assets are only loaded on pages that contain a code block (unless you enable "Load on every page").

= Does it slow down the editor? =

No. Synhigh is editor-safe and never touches blocks inside the Gutenberg or classic editor.

= What happens when I delete the plugin? =

All plugin options are removed on uninstall. No leftover data.

== Screenshots ==

1. admin
2. code

== Changelog ==

= 1.0.0 =
* Initial release.
* Automatic language detection with 18 built-in languages and aliases.
* Line numbers with custom starting line, one-click copy button, and language labels.
* Four themes (Auto, Dark, Light, Ember) with CSS variable overrides.
* Smart per-page asset loading with optional MutationObserver support.
* Settings page with General, Loading, Custom CSS, and Usage tabs.
* Clean uninstall of plugin options.