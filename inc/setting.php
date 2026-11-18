<?php

defined( 'ABSPATH' ) || exit;

/**
 * Default option values.
 *
 * @return array<string,mixed>
 */
function synhigh_defaults() {
	return array(
		'theme'         => 'auto',
		'line_numbers'  => 1,
		'copy_button'   => 1,
		'show_label'    => 1,
		'auto_detect'   => 1,
		'observe'       => 0,
		'load_all'      => 0,
		'custom_css'    => '',
	);
}

// Setting Page
function synhigh_add_menu() {
	add_options_page(
		__( 'Code Highlighter', 'synhigh-code-highlighter' ),
		__( 'Code Highlighter', 'synhigh-code-highlighter' ),
		'manage_options',
		'synhigh-code-highlighter',
		'synhigh_render_settings'
	);
}
add_action( 'admin_menu', 'synhigh_add_menu' );

function synhigh_render_settings() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$o = synhigh_options();

	$checkbox = static function ( $key, $label, $help = '' ) use ( $o ) {
		printf(
			'<label><input type="checkbox" name="synhigh_options[%1$s]" value="1" %2$s> %3$s</label>%4$s',
			esc_attr( $key ),
			checked( ! empty( $o[ $key ] ), true, false ),
			esc_html( $label ),
			$help ? '<p class="description">' . esc_html( $help ) . '</p>' : ''
		);
	};
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Code Highlighter', 'synhigh-code-highlighter' ); ?></h1>
		<form method="post" action="options.php">
			<?php settings_fields( 'synhigh_group' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="synhigh-theme"><?php esc_html_e( 'Theme', 'synhigh-code-highlighter' ); ?></label></th>
					<td>
						<select id="synhigh-theme" name="synhigh_options[theme]">
							<?php foreach ( synhigh_themes() as $slug => $label ) : ?>
								<option value="<?php echo esc_attr( $slug ); ?>" <?php selected( $o['theme'], $slug ); ?>><?php echo esc_html( $label ); ?></option>
							<?php endforeach; ?>
						</select>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Features', 'synhigh-code-highlighter' ); ?></th>
					<td>
						<fieldset>
							<?php
							$checkbox( 'line_numbers', __( 'Show line numbers', 'synhigh-code-highlighter' ) );
							echo '<br>';
							$checkbox( 'copy_button', __( 'Show a copy button', 'synhigh-code-highlighter' ) );
							echo '<br>';
							$checkbox( 'show_label', __( 'Show the language label', 'synhigh-code-highlighter' ) );
							echo '<br>';
							$checkbox( 'auto_detect', __( 'Detect the language automatically when no class is set', 'synhigh-code-highlighter' ) );
							?>
						</fieldset>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Loading', 'synhigh-code-highlighter' ); ?></th>
					<td>
						<fieldset>
							<?php
							$checkbox( 'load_all', __( 'Load on every page', 'synhigh-code-highlighter' ), __( 'By default the scripts load only on pages whose content contains a code block.', 'synhigh-code-highlighter' ) );
							echo '<br>';
							$checkbox( 'observe', __( 'Watch for content added after page load', 'synhigh-code-highlighter' ), __( 'Needed for infinite scroll or AJAX page transitions.', 'synhigh-code-highlighter' ) );
							?>
						</fieldset>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="synhigh-css"><?php esc_html_e( 'Custom CSS', 'synhigh-code-highlighter' ); ?></label></th>
					<td>
						<textarea id="synhigh-css" name="synhigh_options[custom_css]" rows="9" class="large-text code" spellcheck="false"><?php echo esc_textarea( $o['custom_css'] ); ?></textarea>
						<p class="description">
							<?php esc_html_e( 'Override any color for every theme using CSS variables, for example:', 'synhigh-code-highlighter' ); ?>
							<code>.synhigh { --synhigh-bg: #0b1d2a; --synhigh-keyword: #ff9e64; }</code>
						</p>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>

		<h2><?php esc_html_e( 'Usage', 'synhigh-code-highlighter' ); ?></h2>
		<p><?php esc_html_e( 'Add a Code block, then enter a class such as language-php in the block\'s Advanced > Additional CSS class field. Without a class, the language is detected automatically. Use the class nohighlight to skip a block.', 'synhigh-code-highlighter' ); ?></p>
	</div>
	<?php
}

function synhigh_register_settings() {
	register_setting(
		'synhigh_group',
		'synhigh_options',
		array(
			'type'              => 'array',
			'sanitize_callback' => 'synhigh_sanitize',
			'default'           => synhigh_defaults(),
		)
	);
}
add_action( 'admin_init', 'synhigh_register_settings' );