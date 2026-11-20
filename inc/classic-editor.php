<?php

defined( 'ABSPATH' ) || exit;

/**
 * Classic Editor integration.
 *
 * Adds an "Insert code block" button to the Visual (TinyMCE) toolbar and a
 * matching quicktag to the Text toolbar. Both open a dialog that inserts a
 * <pre><code class="language-..."> block the highlighter already understands.
 */

/**
 * Whether the Classic Editor button is enabled.
 *
 * @return bool
 */
function synhigh_classic_editor_enabled() {
	$opts = synhigh_options();
	return (bool) apply_filters( 'synhigh_classic_editor_button', ! empty( $opts['classic_editor_button'] ) );
}

/**
 * Languages offered in the insertion dialog (slug => label).
 * An empty slug means "let the highlighter auto-detect".
 *
 * @return array<string,string>
 */
function synhigh_editor_languages() {
	return apply_filters(
		'synhigh_editor_languages',
		array(
			''           => __( 'Auto-detect', 'synhigh-code-highlighter' ),
			'html'       => 'HTML',
			'css'        => 'CSS',
			'javascript' => 'JavaScript',
			'json'       => 'JSON',
			'php'        => 'PHP',
			'sql'        => 'SQL',
			'python'     => 'Python',
			'bash'       => 'Bash',
			'c'          => 'C',
			'cpp'        => 'C++',
			'java'       => 'Java',
			'csharp'     => 'C#',
			'go'         => 'Go',
			'rust'       => 'Rust',
		)
	);
}

/**
 * Load the dialog assets only on Classic Editor post screens.
 *
 * @param string $hook Current admin page hook.
 */
function synhigh_classic_editor_assets( $hook ) {
	if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) || ! synhigh_classic_editor_enabled() ) {
		return;
	}
	$screen = get_current_screen();
	if ( ! $screen || $screen->is_block_editor() ) {
		return;
	}

	wp_enqueue_style( 'synhigh_editor_css', SYNHIGH_URL . 'css/synhigh-editor.css', array( 'dashicons' ), SYNHIGH_VERSION );
	wp_enqueue_script( 'synhigh_editor_js', SYNHIGH_URL . 'js/synhigh-editor.js', array(), SYNHIGH_VERSION, true );
	wp_localize_script(
		'synhigh_editor_js',
		'SynhighEditorConfig',
		array(
			'languages' => synhigh_editor_languages(),
			'i18n'      => array(
				'title'       => __( 'Insert code block', 'synhigh-code-highlighter' ),
				'language'    => __( 'Language', 'synhigh-code-highlighter' ),
				'code'        => __( 'Code', 'synhigh-code-highlighter' ),
				'placeholder' => __( 'Paste or type your code here.', 'synhigh-code-highlighter' ),
				'insert'      => __( 'Insert', 'synhigh-code-highlighter' ),
				'cancel'      => __( 'Cancel', 'synhigh-code-highlighter' ),
				'quicktag'    => __( 'code', 'synhigh-code-highlighter' ),
			),
		)
	);
}
add_action( 'admin_enqueue_scripts', 'synhigh_classic_editor_assets' );

/**
 * Register the TinyMCE plugin that adds the toolbar button.
 *
 * @param array<string,string> $plugins External TinyMCE plugins.
 * @return array<string,string>
 */
function synhigh_mce_plugin( $plugins ) {
	if ( synhigh_classic_editor_enabled() ) {
		$plugins['synhigh_code'] = SYNHIGH_URL . 'js/synhigh-tinymce.js';
	}
	return $plugins;
}
add_filter( 'mce_external_plugins', 'synhigh_mce_plugin' );

/**
 * Place the button at the end of the first toolbar row.
 *
 * @param array<int,string> $buttons Toolbar buttons.
 * @return array<int,string>
 */
function synhigh_mce_button( $buttons ) {
	if ( synhigh_classic_editor_enabled() ) {
		$buttons[] = 'synhigh_code';
	}
	return $buttons;
}
add_filter( 'mce_buttons', 'synhigh_mce_button' );

/**
 * Pass the translated tooltip into the editor iframe.
 *
 * @param array<string,mixed> $init TinyMCE init settings.
 * @return array<string,mixed>
 */
function synhigh_tinymce_init( $init ) {
	if ( synhigh_classic_editor_enabled() ) {
		$init['synhigh_tooltip'] = __( 'Insert code block', 'synhigh-code-highlighter' );
	}
	return $init;
}
add_filter( 'tiny_mce_before_init', 'synhigh_tinymce_init' );

/**
 * Load dashicons and the button styling inside the editor iframe.
 *
 * @param string $css Comma-separated stylesheet URLs.
 * @return string
 */
function synhigh_mce_css( $css ) {
	if ( synhigh_classic_editor_enabled() ) {
		$css .= ',' . includes_url( 'css/dashicons.min.css' ) . ',' . SYNHIGH_URL . 'css/synhigh-editor.css';
	}
	return $css;
}
add_filter( 'mce_css', 'synhigh_mce_css' );