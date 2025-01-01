<?php

/**
 * Author : DeipGroup
 * Date: 8/11/2016
 * Time: 4:15 PM
 *
 * @package dflip
 *
 * @since   dflip 1.2
 */
class DFlip_Settings {
  
  /**
   * Holds the singleton class object.
   *
   * @since 1.2.0
   *
   * @var object
   */
  public static $instance;
  
  public $hook;
  
  /**
   * Holds the base DFlip class object.
   *
   * @since 1.2.0
   *
   * @var object
   */
  public $base;
  
  /**
   * Holds the base DFlip class fields.
   *
   * @since 1.2.0
   *
   * @var object
   */
  public $fields;
  
  /**
   * Primary class constructor.
   *
   * @since 1.2.0
   */
  public function __construct() {
    
    // Load the base class object.
    $this->base = DFlip::get_instance();
    
    add_action( 'admin_menu', array( $this, 'settings_menu' ) );
    
    $this->fields = array_merge( array(), $this->base->defaults );
    
    foreach ( $this->fields as $key => $value ) {
      
      if ( isset( $value['choices'] ) && is_array( $value['choices'] ) && isset( $value['choices']['global'] ) ) {
        unset( $this->fields[ $key ]['choices']['global'] );
      }
      
    }
    
    // Load the metabox hooks and filters.
    //		add_action('add_meta_boxes', array($this, 'add_meta_boxes'), 100);
    
    // Add action to save metabox config options.
    //		add_action('save_post', array($this, 'save_meta_boxes'), 10, 2);
  }
  
  /**
   * Creates menu for the settings page
   *
   * @since 1.2
   */
  public function settings_menu() {
      global $submenu;
   
    $this->hook = add_submenu_page( 'edit.php?post_type=dflip', __( 'dFlip Global Settings', '3d-flipbook-dflip-lite' ), __( 'Global Settings', '3d-flipbook-dflip-lite' ), 'manage_options', $this->base->plugin_slug . '-settings',
        array( $this, 'settings_page' ) );
    
    //The resulting page's hook_suffix, or false if the user does not have the capability required.
    if ( $this->hook ) {
      add_action( 'load-' . $this->hook, array( $this, 'update_settings' ) );
    }
    
    $submenu['edit.php?post_type=dflip'][] = array('Upgrade DearFlip', 'manage_options', 'https://dearflip.com/go/wp-lite-upgrade-menu');
    
  }
  
  /**
   * Callback to create the settings page
   *
   * @since 1.2
   */
  public function settings_page() {
    
    $tabs = array(
        'general'  => __( 'General', '3d-flipbook-dflip-lite' ),
        'advanced'  => __( 'Advanced', '3d-flipbook-dflip-lite' )

    );
    
    //create tabs and content
    ?>

      <h2><?php echo esc_html( get_admin_page_title() ); ?></h2>
      <form id="dflip-settings" method="post" class="dflip-settings postbox">
        
        <?php
        wp_nonce_field( 'dflip_settings_nonce', 'dflip_settings_nonce' );
        submit_button( __( 'Update Settings', '3d-flipbook-dflip-lite' ), 'primary', 'dflip_settings_submit', false );
        ?>

          <div class="dflip-tabs">
              <ul class="dflip-tabs-list">
                <?php
                //create tabs
                $active_set = false;
                foreach ( (array) $tabs as $id => $title ) {
                  ?>
                    <li class="dflip-update-hash dflip-tab <?php echo( $active_set == false ? 'dflip-active' : '' ) ?>">
                        <a href="#dflip-tab-content-<?php echo $id ?>"><?php echo $title ?></a></li>
                  <?php $active_set = true;
                }
                ?>
              </ul>
            <?php
            
            $active_set = false;
            foreach ( (array) $tabs as $id => $title ) {
              ?>
                <div id="dflip-tab-content-<?php echo $id ?>"
                     class="dflip-tab-content <?php echo( $active_set == false ? "dflip-active" : "" ) ?>">
                  
                  <?php
                  $active_set = true;
                  
                  //create content for tab
                  $function = $id . "_tab";
                  if ( method_exists( $this, $function ) ) {
                    call_user_func( array( $this, $function ) );
                  };
                  
                  ?>
                </div>
            <?php } ?>
          </div>
      </form>
    <?php
    
  }
  
  /**
   * Creates the UI for General tab
   *
   * @since 1.0.0
   *
   */
  public function general_tab() {
    $this->base->create_setting( 'viewerType' );
    
    ?>

      <!--Clear-fix-->
      <div class="dflip-box"></div>
    
    <?php
  }
  
  public function layout_tab() {
    
    
    ?>

      <!--Clear-fix-->
      <div class="dflip-box"></div>
    
    <?php
  }
  
  public function post_tab() {
    
    ?>

      <!--Clear-fix-->
      <div class="dflip-box"></div>
    
    <?php
  }
  
  
  public function flipbook_tab() {
    

    ?>

      <!--Clear-fix-->
      <div class="dflip-box"></div>
    
    <?php
  }
  
  
  /**
   * Creates the UI for Popup tab
   *
   * @since 2.1.23
   *
   */
  public function popup_tab() {
    

    ?>

      <!--Clear-fix-->
      <div class="dflip-box"></div>
    
    <?php
  }
  
  
  /**
   * Creates the UI for Controls tab
   *
   * @since 2.1.40
   *
   */
  public function controls_tab() {
    
    
    ?>

      <!--Clear-fix-->
      <div class="dflip-box"></div>
    
    <?php
  }
  
  /**
   * Creates the UI for Advanced tab
   *
   * @since 2.1.23
   *
   */
  public function advanced_tab() {
    
    $this->base->create_setting( 'selectiveScriptLoading' );

    
    ?>

      <!--Clear-fix-->
      <div class="dflip-box"></div>
    
    <?php
  }
  
  /**
   * Creates the UI for PDF tab
   *
   * @since 2.1.23
   *
   */
  public function pdf_tab() {
    

    ?>

      <!--Clear-fix-->
      <div class="dflip-box"></div>
    
    <?php
  }
  
  /**
   * Creates the UI for Translate tab
   *
   * @since 1.0.0
   *
   */
  public function translate_tab() {
    

    ?>

      <!--Clear-fix-->
      <div class="dflip-box"></div>
    <?php
    
  }
  
  /**
   * Update settings
   *
   * @return null Invalid nonce / no need to save
   * @since 1.2.0.1
   *
   */
  public function update_settings() {
    
    // Check form was submitted
    if ( !isset( $_POST['dflip_settings_submit'] ) ) {
      return;
    }
    
    // Check nonce is valid
    if ( !wp_verify_nonce( $_POST['dflip_settings_nonce'], 'dflip_settings_nonce' ) ) {
      return;
    }
    
    // Sanitize all user inputs.
    
    $sanitized_data = array();
    $sanitized_data['viewerType'] = sanitize_text_field( $_POST['_dflip']['viewerType'] );
    $sanitized_data['selectiveScriptLoading'] = sanitize_text_field( $_POST['_dflip']['selectiveScriptLoading'] );
    
    $settings = is_multisite() ? get_blog_option( null, '_dflip_settings', array() ) : get_option( '_dflip_settings', array() );
    if ( empty( $settings ) || !is_array($settings)) {
      $settings = array();
    }
    $settings = array_merge( $settings, $sanitized_data );
    
    if ( is_multisite() ) {
      // Update options
      update_blog_option( null, '_dflip_settings', $settings );
    } else {
      // Update options
      update_option( '_dflip_settings', $settings );
    }
    // Show confirmation
    add_action( 'admin_notices', array( $this, 'updated_settings' ) );
    
  }
  
  /**
   * display a saved notice
   *
   * @since 1.2.0.1
   */
  public function updated_settings() {
    ?>
      <div class="updated">
          <p><?php _e( 'Settings updated.', '3d-flipbook-dflip-lite' ); ?></p>
      </div>
    <?php
    
  }
  
  /**
   * Returns the singleton instance of the class.
   *
   * @return object DFlip_Settings object.
   * @since 1.2.0
   *
   */
  public static function get_instance() {
    
    if ( !isset( self::$instance )
        && !( self::$instance instanceof DFlip_Settings ) ) {
      self::$instance = new DFlip_Settings();
    }
    
    return self::$instance;
    
  }
}

// Load the DFlip_Settings class.
$dflip_settings = DFlip_Settings::get_instance();
