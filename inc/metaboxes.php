<?php

/**
 * dFlip Metaboxes
 *
 * creates, displays and saves metaboxes and their values
 *
 * @since   1.0.0
 *
 * @package dFlip
 * @author  Deepak Ghimire
 */
class DFlip_Meta_boxes {

  /**
   * Holds the singleton class object.
   *
   * @since 1.0.0
   *
   * @var object
   */
  public static $instance;

  /**
   * Holds the base DFlip class object.
   *
   * @since 1.0.0
   *
   * @var object
   */
  public $base;

  /**
   * Holds the base DFlip class fields.
   *
   * @since 1.0.0
   *
   * @var object
   */
  public $fields;

  /**
   * Primary class constructor.
   *
   * @since 1.0.0
   */
  public function __construct() {

    // Load the base class object.
    $this->base = DFlip::get_instance();

    $this->fields = $this->base->defaults;

    // Load metabox assets.
    add_action( 'admin_enqueue_scripts', array( $this, 'meta_box_styles_scripts' ) );

    // Load the metabox hooks and filters.
    add_action( 'add_meta_boxes', array( $this, 'add_meta_boxes' ), 100 );

    // Add action to save metabox config options.
    add_action( 'save_post', array( $this, 'save_meta_boxes' ), 10, 2 );
  }

  /**
   * Loads styles and scripts for our metaboxes.
   *
   * @return null Bail out if not on the proper screen.
   * @since 1.0.0
   *
   */
  public function meta_box_styles_scripts() {

    global $id, $post;

    if ( isset( get_current_screen()->post_type )
         && $this->base->plugin_slug !== get_current_screen()->post_type ) {
      return;
    }

    // Load necessary metabox styles.
    wp_register_style( $this->base->plugin_slug . '-metabox-style', plugins_url( '../assets/css/metaboxes.css', __FILE__ ), array(), $this->base->version );
    wp_enqueue_style( $this->base->plugin_slug . '-metabox-style' );
    wp_enqueue_style( 'wp-color-picker' );

    // Load necessary metabox scripts.
    wp_register_script( $this->base->plugin_slug . '-metabox-script', plugins_url( '../assets/js/metaboxes.js', __FILE__ ),
      array( 'jquery-ui-sortable', 'jquery-ui-draggable', 'jquery-ui-resizable', 'wp-color-picker' ), $this->base->version );
    wp_enqueue_script( $this->base->plugin_slug . '-metabox-script' );

    if(isset( $post->ID ) || isset($id)){
//       Set the post_id for localization.
      $post_id = isset( $post->ID ) ? $post->ID : (int) $id;
      wp_enqueue_media( array( 'post' => $post_id ) );
    }

  }

  /**
   * Adds metaboxes for handling settings
   *
   * @since 1.0.0
   */
  public function add_meta_boxes() {
    add_meta_box( 'dflip_post_meta_box_support_us', __( 'More Features in FULL VERSION!', '3d-flipbook-dflip-lite' ), array( $this, 'create_meta_boxes_support_us' ), 'dflip', 'normal', 'high' );

    add_meta_box( 'dflip_post_meta_box', __( 'dFlip Settings', '3d-flipbook-dflip-lite' ), array( $this, 'create_meta_boxes' ), 'dflip', 'normal', 'high' );

    add_meta_box( 'dflip_post_meta_box_shortcode', __( 'Shortcode', '3d-flipbook-dflip-lite' ), array( $this, 'create_meta_boxes_shortcode' ), 'dflip', 'side', 'high' );

    add_meta_box( 'dflip_post_meta_box_video', __( 'Useful Links', '3d-flipbook-dflip-lite' ), array( $this, 'create_meta_boxes_video' ), 'dflip', 'side', 'low' );

  }

  /**
   * Creates metaboxes for shortcode display
   *
   * @param object $post The current post object.
   *
   * @since 1.2.4
   *
   */
  public function create_meta_boxes_support_us( $post ) {
    ?>
    <div class="dflip-notice lite-limits" style="padding:10px;">

      <div>
        With DearFlip Full version you will have further more possibility of handling flipbooks.
        <ol>
          <li> Ability to change settings for all flipbooks</li>
          <li><strong>PDF LINKS</strong>, translate, analytics, custom share prefix, zoom settings, controls
            customization, etc.
          </li>
          <li><strong>Popup lightboxes for button and custom types</strong></li>
          <li> And more...</li>
        </ol>
        <strong style="text-transform: uppercase;"><a href="https://dearflip.com/go/wp-lite-vs-premium" target="_blank">See
            Full Comparision</a> | <a href="https://dearflip.com/go/wp-lite-full-version" target="_blank">
            Get Full Version</a></strong>
      </div>
    </div>

    <?php

  }

  /**
   * Creates metaboxes for shortcode display
   *
   * @param object $post The current post object.
   *
   * @since 1.2.4
   *
   */
  public function create_meta_boxes_shortcode( $post ) {
    global $current_screen;

    if ( $current_screen->post_type == 'dflip' ) {
      if ( $current_screen->action == 'add' ) {
        echo "Save Post to generate shortcode.";
      }
      else {
        ?>
          <strong>Embedded:</strong>
          <br>
          [dflip id="<?php echo $post->ID; ?>"][/dflip]
          <hr>
          <strong>Thumb - Lightbox(Popup):</strong>
          <br>
          [dflip id="<?php echo $post->ID; ?>" type="thumb"][/dflip]
          <hr>
          <a target="_blank" href="https://wordpress.dearflip.com/docs/shortcode-options/">More Shortcode Options</a>
          <hr>
          <a class="df-notice" href="https://wordpress.dearflip.com/docs/multiple-flipbooks-in-a-page/" target="_blank">Don't embed multiple viewers in a page!</a>
	    <?php
      }
    }
  }


  /**
   * Creates metaboxes for video
   *
   * @param object $post The current post object.
   *
   * @since 1.2.4
   *
   */
  public function create_meta_boxes_video( $post ) {
    global $current_screen;

    if ( $current_screen->post_type == 'dflip' ) {
      ?>
      <ul>
        <li>
          <a class="video-tutorial" href="https://dearflip.com/go/wp-lite-video-tutorial" target="_blank"><span
                    class="dashicons dashicons-video-alt3"></span>See Video Tutorial</a>
        </li>
        <li>
          <a class="video-tutorial" href="
      https://dearflip.com/go/wp-lite-docs" target="_blank"><span class="dashicons dashicons-book"></span>Live
            Documentation</a>
        </li>
        <li>
                <a class="video-tutorial df-chrome" href="https://chrome.google.com/webstore/detail/pdf-viewer-pdf-flipbook-d/bbbnbmpdkfkndckfmcndgabefnmdedfp/?page=post" target="_blank">FREE Flipbook
                    for Chrome</a>
        </li>
      </ul>
      <?php
    }

  }


  /**
   * Creates metaboxes for handling settings
   *
   * @param object $post The current post object.
   *
   * @since 1.0.0
   *
   */
  public function create_meta_boxes( $post ) {

    // Keep security first.
    wp_nonce_field( $this->base->plugin_slug, $this->base->plugin_slug );

    $tabs = array(
        'source'  => __( 'Source', '3d-flipbook-dflip-lite' ),
        'layout'   => __( 'General/Layout', '3d-flipbook-dflip-lite' ),
        'flipbook' => __( 'Flipbook', '3d-flipbook-dflip-lite' ),
        'outline' => __( 'Outline', '3d-flipbook-dflip-lite' )
    );

    if ( $error = get_transient( "my_save_post_errors_{$post->ID}" ) ) { ?>
      <div class="info hidden">
      <p><?php echo esc_attr( $error ); ?></p>
      </div><?php

      delete_transient( "my_save_post_errors_{$post->ID}" );
    }

    //create tabs and content
    ?>
    <div class="dflip-tabs">
      <ul class="dflip-tabs-list">
        <?php
        //create tabs
        $active_set = false;
        foreach ( (array) $tabs as $id => $title ) {
          ?>
          <li class="dflip-update-hash dflip-tab <?php echo( $active_set == false ? 'dflip-active' : '' ) ?>">
            <a href="#dflip-tab-content-<?php echo esc_attr( $id ) ?>"><?php echo esc_attr( $title ) ?></a></li>
          <?php $active_set = true;
        }
        ?>
      </ul>
      <?php

      $active_set = false;
      foreach ( (array) $tabs as $id => $title ) {
        ?>
        <div id="dflip-tab-content-<?php echo esc_attr( $id ) ?>"
                class="dflip-tab-content <?php echo( $active_set == false ? "dflip-active" : "" ) ?>">

          <?php
          $active_set = true;

          //create content for tab
          $function = $id . "_tab";
          call_user_func( array( $this, $function ), $post );

          ?>
        </div>
      <?php } ?>
    </div>
    <?php

  }

  /**
   * Creates the UI for Source tab
   *
   * @param object $post The current post object.
   *
   * @since 1.0.0
   *
   */
  public function source_tab( $post ) {

    $this->create_normal_setting( 'source_type', $post );
    $this->create_normal_setting( 'pdf_source', $post );
    $this->create_normal_setting( 'pdf_thumb', $post );

    ?>

    <!--Pages for the book-->
      <div id="dflip_pages_box" class="df-box hide-on-fail " data-condition="dflip_source_type:is(image)" data-operator="and">

      <label for="dflip_pages" class="dflip-label">
        <?php echo __( 'Custom Pages', '3d-flipbook-dflip-lite' ); ?>
      </label>

      <div class="dflip-desc">
        <?php echo __( 'Add or remove pages as per your requirement. Plus reorder them in the order needed.', '3d-flipbook-dflip-lite' ); ?>
      </div>
      <div class="dflip-option dflip-page-list">
        <a href="javascript:void(0);" class="dflip-page-list-add button button-primary"
                title="Add New Page">
          <?php echo __( 'Add New Page', '3d-flipbook-dflip-lite' ); ?>
        </a>
        <ul id="dflip_page_list">
          <?php
          $page_list = $this->get_config( 'pages', $post );
          $index = 0;
          foreach ( (array) $page_list as $page ) {

            /* build the arguments*/
            $title = isset( $page['title'] ) ? $page['title'] : '';
            $url = isset( $page['url'] ) ? $page['url'] : '';
            $content = isset( $page['content'] ) ? $page['content'] : '';

            if ( $url != '' ) {
              ?>
              <li class="dflip-page-item">
                <img class="dflip-page-thumb" src="<?php echo esc_attr( $url ); ?>" alt=""/>

                <div class="dflip-page-options">

                  <label for="dflip-page-<?php echo esc_attr( $index ); ?>-title">
                    <?php echo __( 'Title', '3d-flipbook-dflip-lite' ); ?>
                  </label>
                  <input type="text"
                          name="_dflip[pages][<?php echo esc_attr( $index ); ?>][url]"
                          id="dflip-page-<?php echo esc_attr( $index ); ?>-url"
                          value="<?php echo esc_attr( $url ); ?>"
                          class="widefat">

                  <label for="dflip-page-<?php echo esc_attr( $index ); ?>-content">
                    <?php echo __( 'Content', '3d-flipbook-dflip-lite' ); ?>
                  </label>
                  <textarea rows="10" cols="40"
                          name="_dflip[pages][<?php echo esc_attr( $index ); ?>][content]"
                          id="dflip-page-<?php echo esc_attr( $index ); ?>-content">
										<?php echo esc_textarea( $content ); ?>
									</textarea>
                  <?php
                  if ( isset( $page['hotspots'] ) ) {
                    $spotindex = 0;
                    foreach (
                        (array) $page['hotspots'] as $spot
                    ) {
                      ?>
                      <input class="dflip-hotspot-input"
                              name="_dflip[pages][<?php echo esc_attr( $index ); ?>][hotspots][<?php echo esc_attr( $spotindex ); ?>]"
                              value="<?php echo htmlspecialchars( $spot ); ?>">
                      <?php
                      $spotindex ++;
                    }
                  }
                  ?>
                </div>
              </li>
              <?php
            }
            $index ++;
          } ?>
        </ul>
      </div>
    </div>

    <!--Clear-fix-->
    <div class="dflip-box"></div>
    <div class="dflip-support-box" style="padding:10px;line-height:1.7em;">
      Thank you for using our little flipbook plugin :) We hope it has been useful for you and keeps helping you with
      your cause.
      <br>We love supporting and improving our plugin. <strong>You too can <a
                href="https://wordpress.org/support/plugin/3d-flipbook-dflip-lite/reviews/?filter=5#new-post"
                target="_blank">SHARE <span
                  style="color:#ffa000; font-size:1.2em;">&#9733;&#9733;&#9733;&#9733;&#9733;</span> REVIEW SUPPORT</a> on
        WordPress.org!</strong> It would mean a lot to us!
    </div>

    <?php

  }

  /**
   * Sanitizes an array value even if not existent
   *
   * @param object $arr     The array to lookup
   * @param mixed  $key     The key to look into array
   * @param mixed  $default Default value in-case value is not found in array
   *
   * @return mixed appropriate value if exists else default value
   * @since 1.0.0
   *
   */
  private function val( $arr, $key, $default = '' ) {
    return isset( $arr[ $key ] ) ? $arr[ $key ] : $default;
  }

  private function create_global_setting( $key, $post, $global_key ) {
    $this->base->create_setting( $key, null, $this->get_config( $key, $post, $global_key ), $global_key, $this->global_config( $key ) );

  }

  private function create_normal_setting( $key, $post ) {
    $this->base->create_setting( $key, null, $this->get_config( $key, $post ) );

  }

  /**
   * Creates the UI for layout tab
   *
   * @param object $post The current post object.
   *
   * @since 1.0.0
   *
   */
  public function layout_tab( $post ) {
    $this->create_global_setting( 'viewerType', $post, 'global' );
    $this->create_global_setting( 'texture_size', $post, 'global' );
    $this->base->create_separator( 'Layout' );
    $this->create_global_setting( 'height', $post, '' );
    $this->create_global_setting( 'bg_color', $post, '' );
    $this->create_global_setting( 'bg_image', $post, '' );
    $this->base->create_separator( 'Controls' );
    $this->create_global_setting( 'auto_sound', $post, 'global' );
    $this->create_global_setting( 'enable_download', $post, 'global' );
    $this->create_global_setting( 'controls_position', $post, 'global' );
    ?>

    <!--Clear-fix-->
    <div class="dflip-box"></div>
    <?php

  }

  public function flipbook_tab( $post ) {
    $this->create_global_setting( 'webgl', $post, 'global' );
    $this->create_global_setting( 'hard', $post, 'global' );
    $this->create_global_setting( 'duration', $post, '' );
    $this->create_global_setting( 'page_mode', $post, 'global' );
    $this->create_global_setting( 'single_page_mode', $post, 'global' );
    $this->create_normal_setting( 'page_size', $post );
    $this->create_global_setting( 'direction', $post, 'global' );

    $this->base->create_separator( 'Misc' );
    $this->create_global_setting( 'autoplay', $post, 'global' );
    $this->create_global_setting( 'autoplay_duration', $post, '' );
    $this->create_global_setting( 'autoplay_start', $post, 'global' );
    ?><!--Clear-fix-->
      <div class="dflip-box"></div>
    <?php
  }


  /**
   * Creates the UI for outline tab
   *
   * @param object $post The current post object.
   *
   * @since 1.0.0
   *
   */
  public function outline_tab( $post ) {

    $this->create_normal_setting( 'auto_outline', $post );
    $this->create_normal_setting( 'auto_thumbnail', $post );
    $this->create_normal_setting( 'overwrite_outline', $post );
    ?>

    <!--Outline/Bookmark-->
    <div id="dflip_outline_box" class="dflip-box dflip-js-code">

      <div class="dflip-desc">
        <p>
          <?php echo sprintf( __( 'Create a tree structure bookmark/outline of your book for easy access:<br>%s', '3d-flipbook-dflip-lite' ),
              '<code>	Outline Name : (destination as blank or link to url or page number)</code>' ); ?>
        </p>
      </div>

      <div class="dflip-option dflip-textarea-simple">
          <script class="df-post-script" type="application/javascript">window.dflip_flipbook_post_outline = <?php echo json_encode( $this->get_config( 'outline', $post ) ); ?></script>
      </div>
    </div>

    <!--Clear-fix-->
    <div class="dflip-box"></div>
    <?php
  }

  /**
   * Helper method for retrieving config values.
   *
   * @param string $key  The config key to retrieve.
   * @param object $post The current post object.
   *
   * @param null   $_default
   *
   * @return string Key value on success, empty string on failure.
   * @since 1.0.0
   *
   */
  public function get_config( $key, $post, $_default = null ) {

    $values = get_post_meta( $post->ID, '_dflip_data', true );
    $value = isset( $values[ $key ] ) ? $values[ $key ] : '';

    $default = $_default === null ? isset( $this->fields[ $key ] ) ? is_array( $this->fields[ $key ] ) ? isset( $this->fields[ $key ]['std'] ) ? $this->fields[ $key ]['std'] : ''
        : $this->fields[ $key ] : '' : $_default;

    /* set standard value */
    if ( $default !== null ) {
      $value = $this->filter_std_value( $value, $default );
    }

    return $value;

  }

  /**
   * Helper function to filter standard option values.
   *
   * @param mixed $value Saved string or array value
   * @param mixed $std   Standard string or array value
   *
   * @return    mixed     String or array
   *
   * @access    public
   * @since     1.0.0
   */
  public function filter_std_value( $value = '', $std = '' ) {

    $std = maybe_unserialize( $std );

    if ( is_array( $value ) && is_array( $std ) ) {

      foreach ( $value as $k => $v ) {

        if ( '' === $value[ $k ] && isset( $std[ $k ] ) ) {

          $value[ $k ] = $std[ $k ];

        }

      }

    } else {
      if ( '' === $value && $std !== null ) {

        $value = $std;

      }
    }

    return $value;

  }

  /**
   * Saves values from dFlip metaboxes.
   *
   * @param int    $post_id The current post ID.
   * @param object $post    The current post object.
   *
   * @since 1.0.0
   *
   */
  public function save_meta_boxes( $post_id, $post ) {

    // Bail out if we fail a security check.
    if ( !isset( $_POST['dflip'] )
         || !wp_verify_nonce( $_POST['dflip'], 'dflip' )
         || !isset( $_POST['_dflip'] ) ) {
      set_transient( "my_save_post_errors_{$post_id}", "Security Check Failed", 10 );

      return;
    }

    // Bail out if running an autosave, ajax, cron or revision.
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
      set_transient( "my_save_post_errors_{$post_id}", "Autosave", 10 );

      return;
    }
    if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
      set_transient( "my_save_post_errors_{$post_id}", "Ajax", 10 );

      return;
    }
    /*    if ( defined( 'DOING_CRON' ) && DOING_CRON ) {
          set_transient("my_save_post_errors_{$post_id}", "Cron", 10);
          return;
        }*/
    if ( wp_is_post_revision( $post_id ) ) {
      set_transient( "my_save_post_errors_{$post_id}", "revision", 10 );

      return;
    }

    // Bail if this is not the correct post type.
    if ( isset( $post->post_type )
         && $this->base->plugin_slug !== $post->post_type ) {
      set_transient( "my_save_post_errors_{$post_id}", "Incorrect Post Type", 10 );

      return;
    }

    // Bail out if user is not authorized
    if ( !current_user_can( 'edit_post', $post_id ) ) {
      set_transient( "my_save_post_errors_{$post_id}", "UnAuthorized User", 10 );

      return;
    }

    // Sanitize all user inputs.

    $sanitized_data = array();

    //Source Tab
    $sanitized_data['source_type'] = sanitize_text_field( $_POST['_dflip']['source_type'] );
    $sanitized_data['pdf_source'] = esc_url_raw( $_POST['_dflip']['pdf_source'] );
    $sanitized_data['pdf_thumb'] = esc_url_raw( $_POST['_dflip']['pdf_thumb'] );

    $page_list = array();
    if ( is_array( $_POST['_dflip']['pages'] ) ) {
      foreach ( (array) $_POST['_dflip']['pages'] as $page_key => $page_value ) {
        $page = array();
        $page['url'] = isset( $page_value['url'] ) ? esc_url_raw( $page_value['url'] ) : '';
        $page['hotspots'] = array();
        if ( isset( $page_value['hotspots'] ) ) {
          foreach ( (array) $page_value['hotspots'] as $spot_key => $spot_value ) {
            array_push( $page['hotspots'], sanitize_text_field( $spot_value ) );
          }
        }
        array_push( $page_list, $page );
      }
    }
    $sanitized_data['pages'] = $page_list;

    //Layout tab
    $sanitized_data['viewerType'] = sanitize_text_field( $_POST['_dflip']['viewerType'] );
    $sanitized_data['webgl'] = sanitize_text_field( $_POST['_dflip']['webgl'] );
    $sanitized_data['hard'] = sanitize_text_field( $_POST['_dflip']['hard'] );
    $sanitized_data['bg_color'] = sanitize_text_field( $_POST['_dflip']['bg_color'] );
    $sanitized_data['bg_image'] = esc_url_raw( $_POST['_dflip']['bg_image'] );
    $sanitized_data['duration'] = sanitize_text_field( $_POST['_dflip']['duration'] );
    $sanitized_data['height'] = sanitize_text_field( $_POST['_dflip']['height'] );
    $sanitized_data['texture_size'] = sanitize_text_field( $_POST['_dflip']['texture_size'] );
    $sanitized_data['auto_sound'] = sanitize_text_field( $_POST['_dflip']['auto_sound'] );
    $sanitized_data['enable_download'] = sanitize_text_field( $_POST['_dflip']['enable_download'] );
    $sanitized_data['page_mode'] = sanitize_text_field( $_POST['_dflip']['page_mode'] );
    $sanitized_data['single_page_mode'] = sanitize_text_field( $_POST['_dflip']['single_page_mode'] );
    $sanitized_data['controls_position'] = sanitize_text_field( $_POST['_dflip']['controls_position'] );
    $sanitized_data['direction'] = sanitize_text_field( $_POST['_dflip']['direction'] );
//    $sanitized_data['force_fit'] = sanitize_text_field( $_POST['_dflip']['force_fit'] );
    $sanitized_data['autoplay'] = sanitize_text_field( $_POST['_dflip']['autoplay'] );
    $sanitized_data['autoplay_duration'] = sanitize_text_field( $_POST['_dflip']['autoplay_duration'] );
    $sanitized_data['autoplay_start'] = sanitize_text_field( $_POST['_dflip']['autoplay_start'] );
    $sanitized_data['page_size'] = sanitize_text_field( $_POST['_dflip']['page_size'] );

    //Outline/sidemenu tab
    $sanitized_data['auto_outline'] = sanitize_text_field( $_POST['_dflip']['auto_outline'] );
    $sanitized_data['auto_thumbnail'] = sanitize_text_field( $_POST['_dflip']['auto_thumbnail'] );
    $sanitized_data['overwrite_outline'] = sanitize_text_field( $_POST['_dflip']['overwrite_outline'] );

    $sanitized_data['outline'] = isset( $_POST['_dflip']['outline'] ) ? $this->array_text_sanitize( $_POST['_dflip']['outline'] ) : array();
    $sanitized_data['outline'] = $this->array_val($sanitized_data['outline'],'items');

    $settings = get_post_meta( $post_id, '_dflip_data', true );
    if ( empty( $settings ) || !is_array($settings)) {
      $settings = array();
    }
    $settings = array_merge( $settings, $sanitized_data );

    //These values are from postObject
    if ( isset( $post->post_type ) && 'dflip' == $post->post_type ) {
      if ( empty( $settings['title'] ) ) {
        $settings['title'] = trim( strip_tags( $post->post_title ) );
      }

      if ( empty( $settings['slug'] ) ) {
        $settings['slug'] = sanitize_text_field( $post->post_name );
      }
    }

    // Get publish/draft status from Post
    $settings['status'] = $post->post_status;

    // Update the post meta.
    update_post_meta( $post_id, '_dflip_data', $settings );

  }

  /**
   * Sanitizes and returns values of an array. The values should be text only
   *
   * @param array Array to be sanitized
   *
   * @return array sanitized array
   * @since 1.0.0
   *
   */
  private function array_text_sanitize( $arr = array() ) {

    if ( is_null( $arr ) ) {
      return array();
    }

    foreach ( (array) $arr as $k => $val ) {
      if ( is_array( $val ) ) {
        $arr[ $k ] = $this->array_text_sanitize( $val );
      } else {
        $arr[ $k ] = sanitize_text_field( $val );
      }
    }

    return $arr;

  }

  /**
   * Removes index of array and returns only values array
   *
   * @param array Array to be de-ordered
   * @param string $scan key index that needs to be de-ordered
   *
   * @return array sanitized array
   * @since 1.0.0
   *
   */
  private function array_val( $arr = array(), $scan = '' ) {

    if ( is_null( $arr ) ) {
      return array();
    }

    $_arr = array_values( $arr );
    if ( $_arr != null && $scan !== '' ) {
      foreach ( $_arr as &$val ) {
        if ( is_array( $val ) ) {
          if ( isset( $val[ $scan ] ) ) {
            $val[ $scan ] = $this->array_val( $val[ $scan ], $scan );
          }
        }
      }
    }

    return $_arr;

  }

  /**
   * Helper method for retrieving global check values.
   *
   * @param string $key  The config key to retrieve.
   * @param object $post The current post object.
   *
   * @return string Key value on success, empty string on failure.
   * @since 1.0.0
   *
   */
  public function global_config( $key ) {

    $global_value = $this->base->get_config( $key );
    $value = isset( $this->fields[ $key ] ) ? is_array( $this->fields[ $key ] ) ? isset( $this->fields[ $key ]['choices'][ $global_value ] ) ? $this->fields[ $key ]['choices'][ $global_value ]
        : $global_value : $global_value : $global_value;

    return $value;

  }

  /**
   * Returns the singleton instance of the class.
   *
   * @return object dFlip_PostType object.
   * @since 1.0.0
   *
   */
  public static function get_instance() {

    if ( !isset( self::$instance )
         && !( self::$instance instanceof DFlip_Meta_Boxes ) ) {
      self::$instance = new DFlip_Meta_Boxes();
    }

    return self::$instance;

  }
}

// Load the DFlip_Metaboxes class.
$dflip_meta_boxes = DFlip_Meta_Boxes::get_instance();

