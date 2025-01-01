<?php
// @formatter:off
/**
 * Plugin Name: 3D FlipBook : Dflip Lite
 * Description: Realistic 3D Flip-books for WordPress <a href="https://dearflip.com/go/wp-lite-full-version" >Get Full Version Here</a><strong> NOTE : Deactivate this lite version before activating Full Version</strong>
 *
 * Version: 2.3.48
 *
 * Text Domain: 3d-flipbook-dflip-lite
 * Author: DearHive
 * Author URI: https://dearflip.com/go/wp-lite-author
 *
 */
// @formatter:on

// Exit if accessed directly.
if ( !defined( 'ABSPATH' ) ) {
  exit;
}

if ( !class_exists( 'DFlip' ) ) {
  /**
   * Main dFlip plugin class.
   *
   * @since   1.0.0
   *
   * @package DFlip
   * @author  Deepak Ghimire
   */
  class DFlip {

    /**
     * Holds the singleton class object.
     *
     * @since 1.0.0
     *
     * @var object
     */
    public static $instance;

    /**
     * Plugin version
     *
     * @since 1.0.0
     *
     * @var string
     */
    public $version = '2.3.48';

    /**
     * The name of the plugin.
     *
     * @since 1.0.0
     *
     * @var string
     */
    public $plugin_name = 'dFlip';

    /**
     * Unique plugin slug identifier.
     *
     * @since 1.0.0
     *
     * @var string
     */
    public $plugin_slug = 'dflip';
    public $settings_help_page = 'https://dearflip.com/docs/dearflip-wordpress/features/settings/';
    public $plugin_url = "https://wordpress.org/plugins/3d-flipbook-dflip-lite/";
    /**
     * Plugin file.
     *
     * @since 1.0.0
     *
     * @var string
     */
    public $file = __FILE__;

    /**
     * Default values.
     *
     * @since 1.2.6
     *
     * @var string
     */
    public $defaults;

    /**
     * Primary class constructor.
     *
     * @since 1.0.0
     */
    public $settings_text;
    public $external_translate;
    public $selective_script_loading;
    public function __construct() {

      $this->settings_text = array();
      $this->external_translate = false;
      // Load the plugin.
      add_action( 'init', array( $this, 'init' ), 0 );

    }

    /**
     * Loads the plugin into WordPress.
     *
     * @since 1.0.0
     */
    public function init() {

      $this->defaults = array(

          'text_toggle_sound'      => __( "Turn on/off Sound", '3d-flipbook-dflip-lite' ),
          'text_toggle_thumbnails' => __( "Toggle Thumbnails", '3d-flipbook-dflip-lite' ),
          'text_toggle_outline'    => __( "Toggle Outline/Bookmark", '3d-flipbook-dflip-lite' ),
          'text_previous_page'     => __( "Previous Page", '3d-flipbook-dflip-lite' ),
          'text_next_page'         => __( "Next Page", '3d-flipbook-dflip-lite' ),
          'text_toggle_fullscreen' => __( "Toggle Fullscreen", '3d-flipbook-dflip-lite' ),
          'text_zoom_in'           => __( "Zoom In", '3d-flipbook-dflip-lite' ),
          'text_zoom_out'          => __( "Zoom Out", '3d-flipbook-dflip-lite' ),
          'text_toggle_help'       => __( "Toggle Help", '3d-flipbook-dflip-lite' ),
          'text_single_page_mode'  => __( "Single Page Mode", '3d-flipbook-dflip-lite' ),
          'text_double_page_mode'  => __( "Double Page Mode", '3d-flipbook-dflip-lite' ),
          'text_download_PDF_file' => __( "Download PDF File", '3d-flipbook-dflip-lite' ),
          'text_goto_first_page'   => __( "Goto First Page", '3d-flipbook-dflip-lite' ),
          'text_goto_last_page'    => __( "Goto Last Page", '3d-flipbook-dflip-lite' ),
          'text_share'             => __( "Share", '3d-flipbook-dflip-lite' ),
          'text_mail_subject'      => __( "I wanted you to see this FlipBook", '3d-flipbook-dflip-lite' ),
          'text_mail_body'         => __( "Check out this site {{url}}", '3d-flipbook-dflip-lite' ),
          'text_loading'           => __( "DearFlip: Loading ", '3d-flipbook-dflip-lite' ),

          'external_translate' => array(
              'std'     => 'false',
          ),
          'more_controls'      => array(
              'std'         => "download,pageMode,startPage,endPage,sound",
          ),
          'hide_controls'      => array(
              'std'         => "",
          ),
          'scroll_wheel'       => array(
              'std'     => 'false',
          ),
          'bg_color'           => array(
              'std'         => "#777",
              'title'       => __( 'Background Color', '3d-flipbook-dflip-lite' ),
              'desc'        => __( 'Background color in hexadecimal format eg:<code>#FFF</code> or <code>#666666</code>', '3d-flipbook-dflip-lite' ),
              'placeholder' => 'Example: #ffffff',
              'type'        => 'text'
          ),
          'bg_image'           => array(
              'std'            => "",
              'class'          => '',
              'title'          => __( 'Background Image', '3d-flipbook-dflip-lite' ),
              'desc'           => __( 'Background image JPEG or PNG format:', '3d-flipbook-dflip-lite' ),
              'placeholder'    => __( 'Select an image', '3d-flipbook-dflip-lite' ),
              'type'           => 'upload',
              'button-tooltip' => __( 'Select Background Image', '3d-flipbook-dflip-lite' ),
              'button-text'    => __( 'Select Image', '3d-flipbook-dflip-lite' ),
          ),
          'height'             => array(
              'std'         => "auto",
              'title'       => __( 'Container Height', '3d-flipbook-dflip-lite' ),
              'desc'        => __( 'Height of the flipbook container when in embed mode.', '3d-flipbook-dflip-lite' ),
              'placeholder' => 'Example: 500',
              'type'        => 'text'
          ),
          'padding_left'       => array(
              'std'         => "20",
          ),
          'padding_right'      => array(
              'std'         => "20",
          ),
          'duration'           => array(
              'std'         => 800,
              'class'       => '',
              'title'       => __( 'Flip Duration', '3d-flipbook-dflip-lite' ),
              'desc'        => __( 'Time in milliseconds eg:<code>1000</code>for 1second', '3d-flipbook-dflip-lite' ),
              'placeholder' => 'Example: 1000',
              'type'        => 'number'
          ),
          'zoom_ratio'         => array(
              'std'         => 1.5,
          ),
          'stiffness'          => array(
              'std'         => 3,
          ),
          'auto_sound'         => array(
              'std'     => 'true',
              'choices' => array(
                  'global' => __( 'Global Setting', '3d-flipbook-dflip-lite' ),
                  'true'   => __( 'True', '3d-flipbook-dflip-lite' ),
                  'false'  => __( 'False', '3d-flipbook-dflip-lite' )
              ),
              'class'   => '',
              'title'   => __( 'Auto Enable Sound', '3d-flipbook-dflip-lite' ),
              'desc'    => __( 'Sound will play from the start.', '3d-flipbook-dflip-lite' ),
          ),
          'enable_download'    => array(
              'std'     => 'true',
              'choices' => array(
                  'global' => __( 'Global Setting', '3d-flipbook-dflip-lite' ),
                  'true'   => __( 'True', '3d-flipbook-dflip-lite' ),
                  'false'  => __( 'False', '3d-flipbook-dflip-lite' )
              ),
              'class'   => '',
              'title'   => __( 'Enable Download', '3d-flipbook-dflip-lite' ),
              'desc'    => __( 'Enable PDF download', '3d-flipbook-dflip-lite' ),
          ),
        'enable_search'              => array(
          'std'       => 'false',
        ),
        'enable_print'               => array(
          'std'       => 'false',
        ),
          'enable_annotation'  => array(
              'std'     => 'false',
          ),
          'enable_analytics'   => array(
              'std'     => 'false',
          ),
          'webgl'              => array(
              'std'     => 'true',
              'choices' => array(
                  'global' => __( 'Global Setting', '3d-flipbook-dflip-lite' ),
                  'true'   => __( 'WebGL 3D', '3d-flipbook-dflip-lite' ),
                  'false'  => __( 'CSS 3D/2D', '3d-flipbook-dflip-lite' )
              ),
              'title'   =>  __( '3D or 2D', '3d-flipbook-dflip-lite' ),
              'desc'    =>  __( 'Choose the mode of display. WebGL for realistic 3d', '3d-flipbook-dflip-lite' ),
          ),
          'hard'               => array(
              'std'     => 'none',
              'choices' => array(
                  'global' => __( 'Global Setting', '3d-flipbook-dflip-lite' ),
                  'cover'  => __( 'Cover Pages', '3d-flipbook-dflip-lite' ),
                  'all'    => __( 'All Pages', '3d-flipbook-dflip-lite' ),
                  'none'   => __( 'None', '3d-flipbook-dflip-lite' )
              ),
              'class'   => '',
              'title'   => __( 'Hard Pages', '3d-flipbook-dflip-lite' ),
              'desc'    => __( 'Choose which pages to act as hard.(Only in CSS mode)', '3d-flipbook-dflip-lite' ),
          ),
          'direction'          => array(
              'std'     => 1,
              'choices' => array(
                  1 => __( 'Left to Right', '3d-flipbook-dflip-lite' ),
                  2 => __( 'Right to Left', '3d-flipbook-dflip-lite' )
              ),
              'title'   => __( 'Direction', '3d-flipbook-dflip-lite' ),
              'desc'    => __( 'Left to Right or Right to Left.', '3d-flipbook-dflip-lite' ),
          ),
          'source_type'        => array(
              'std'     => 'pdf',
              'choices' => array(
                  'pdf'   => __( 'PDF File', '3d-flipbook-dflip-lite' ),
                  'image' => __( 'Images', '3d-flipbook-dflip-lite' )
              ),
              'title'   => __( 'Book Source Type', '3d-flipbook-dflip-lite' ),
              'desc'    => __( 'Choose the source of this book. "PDF" for pdf files. "Images" for image files.', '3d-flipbook-dflip-lite' ),
          ),
          'pdf_source'         => array(
              'std'            => "",
              'title'          => __( 'PDF File', '3d-flipbook-dflip-lite' ),
              'desc'           => __( 'Choose a PDF File to use as source for the book.', '3d-flipbook-dflip-lite' ),
              'placeholder'    => __( 'Select a PDF File', '3d-flipbook-dflip-lite' ),
              'type'           => 'upload',
              'button-tooltip' => __( 'Select a PDF File', '3d-flipbook-dflip-lite' ),
              'button-text'    => __( 'Select PDF', '3d-flipbook-dflip-lite' ),
              'condition'      => 'dflip_source_type:is(pdf)',
              'class'          => 'hide-on-fail'
          ),
          'pdf_thumb'          => array(
              'std'            => "",
              'title'          => __( 'PDF Thumbnail Image', '3d-flipbook-dflip-lite' ),
              'desc'           => __( 'Choose an image file for PDF thumb.', '3d-flipbook-dflip-lite' ),
              'placeholder'    => __( 'Select an image', '3d-flipbook-dflip-lite' ),
              'type'           => 'upload',
              'button-tooltip' => __( 'Select PDF Thumb Image', '3d-flipbook-dflip-lite' ),
              'button-text'    => __( 'Select Thumb', '3d-flipbook-dflip-lite' ),
              'condition'      => 'dflip_source_type:is(pdf)',
              'class'          => 'hide-on-fail'
          ),
          'overwrite_outline'  => array(
              'std'       => 'false', //isset mis-interprets 0 and false differently than expected
              'choices'   => array(
                  'true'  => __( 'True', '3d-flipbook-dflip-lite' ),
                  'false' => __( 'False', '3d-flipbook-dflip-lite' )
              ),
              'class'     => '',
              'title'     => __( 'Overwrite PDF Outline', '3d-flipbook-dflip-lite' ),
              'desc'      => __( 'Choose if PDF Outline will overwritten.', '3d-flipbook-dflip-lite' ),
              'condition' => 'dflip_source_type:is(pdf)'
          ),
          'auto_outline'       => array(
              'std'     => 'false', //isset mis-interprets 0 and false differently than expected
              'choices' => array(
                  'true'  => __( 'True', '3d-flipbook-dflip-lite' ),
                  'false' => __( 'False', '3d-flipbook-dflip-lite' )
              ),
              'class'   => '',
              'title'   => __( 'Auto Enable Outline', '3d-flipbook-dflip-lite' ),
              'desc'    => __( 'Choose if outline will be auto enabled on start.', '3d-flipbook-dflip-lite' ),
          ),
          'auto_thumbnail'     => array(
              'std'     => 'false', //isset mis-interprets 0 and false differently than expected
              'choices' => array(
                  'true'  => __( 'True', '3d-flipbook-dflip-lite' ),
                  'false' => __( 'False', '3d-flipbook-dflip-lite' )
              ),
              'class'   => '',
              'title'   => __( 'Auto Enable Thumbnail', '3d-flipbook-dflip-lite' ),
              'desc'    => __( 'Choose if thumbnail will be auto enabled on start.Note : Either thumbnail or outline will be active at a time.)', '3d-flipbook-dflip-lite' ),
          ),
          'page_mode'          => array(
              'std'     => '0',
              'choices' => array(
                  'global' => __( 'Global Setting', '3d-flipbook-dflip-lite' ),
                  '0'      => __( 'Auto', '3d-flipbook-dflip-lite' ),
                  '1'      => __( 'Single Page', '3d-flipbook-dflip-lite' ),
                  '2'      => __( 'Double Page', '3d-flipbook-dflip-lite' ),
              ),
              'class'   => '',
              'title'   => __( 'Page Mode', '3d-flipbook-dflip-lite' ),
              'desc'    => __( 'Choose whether you want single mode or double page mode. Recommended Auto', '3d-flipbook-dflip-lite' ),
          ),

          'page_size'         => array(
              'std'     => '0',
              'choices' => array(
                  '0' => __( 'Auto', '3d-flipbook-dflip-lite' ),
                  '1' => __( 'Single Page', '3d-flipbook-dflip-lite' ),
                  '2' => __( 'Double Internal Page', '3d-flipbook-dflip-lite' ),
              ),
              'class'   => '',
              'title'   => __( 'Page Size', '3d-flipbook-dflip-lite' ),
              'desc'    => __( 'Choose whether Layout is single page mode or double internal. Recommended Auto if PDF file', '3d-flipbook-dflip-lite' ),
          ),
          'single_page_mode'  => array(
              'std'     => '0',
              'choices' => array(
                  'global' => __( 'Global Setting', '3d-flipbook-dflip-lite' ),
                  '0'      => __( 'Auto', '3d-flipbook-dflip-lite' ),
                  '1'      => __( 'Normal Zoom', '3d-flipbook-dflip-lite' ),
                  '2'      => __( 'Booklet Mode', '3d-flipbook-dflip-lite' ),
              ),
              'class'   => '',
              'title'   => __( 'Single Page Mode', '3d-flipbook-dflip-lite' ),
              'desc'    => __( 'Choose how the single page will behave. If set to Auto, then in mobiles single page mode will be in Booklet mode.', '3d-flipbook-dflip-lite' ),
          ),
          'controls_position' => array(
              'std'     => 'bottom',
              'choices' => array(
                  'global' => __( 'Global Setting', '3d-flipbook-dflip-lite' ),
                  'bottom' => __( 'Bottom', '3d-flipbook-dflip-lite' ),
                  'top'    => __( 'Top', '3d-flipbook-dflip-lite' ),
                  'hide'   => __( 'Hidden', '3d-flipbook-dflip-lite' ),
              ),
              'class'   => '',
              'title'   => __( 'Controls Position', '3d-flipbook-dflip-lite' ),
              'desc'    => __( 'Choose where you want to display the controls bar or not display at all.', '3d-flipbook-dflip-lite' ),
          ),
          'texture_size'      => array(
              'std'     => '1600',
              'choices' => array(
                'global' => __( 'Global Setting', '3d-flipbook-dflip-lite' ),
                '1024'   => '1024 px',
                '1400'   => '1400 px',
                '1600'   => '1600 px',
                '1800'   => '1800 px',
                '2048'   => '2048 px',
              ),
              'class'   => '',
              'title'   => __( 'Page Render Size', '3d-flipbook-dflip-lite' ),
              'desc'    => __( 'Choose the size of image to be generated.', '3d-flipbook-dflip-lite' ),
          ),
          'link_target'       => array(
              'std'     => '2',
          ),
          'share_prefix'      => array(
              'std'         => "flipbook-",
          ),

          'share_slug' => array(
              'std'     => 'false',
          ),

          'attachment_lightbox' => array(
              'std'     => 'false',
          ),

          'range_size' => array(
              'std'     => '524288',
          ),
          'autoplay'   => array(
              'std'     => 'false',
              'choices' => array(
                  'global' => __( 'Global Setting', '3d-flipbook-dflip-lite' ),
                  'true'   => __( 'True', '3d-flipbook-dflip-lite' ),
                  'false'  => __( 'False', '3d-flipbook-dflip-lite' )
              ),
              'class'   => '',
              'title'   => __( 'Enable AutoPlay', '3d-flipbook-dflip-lite' ),
              'desc'    => __( 'Enable AutoPlay in Flipbook', '3d-flipbook-dflip-lite' ),
          ),

          'autoplay_start'    => array(
              'std'     => 'false',
              'choices' => array(
                  'global' => __( 'Global Setting', '3d-flipbook-dflip-lite' ),
                  'true'   => __( 'True', '3d-flipbook-dflip-lite' ),
                  'false'  => __( 'False', '3d-flipbook-dflip-lite' )
              ),
              'class'   => '',
              'title'   => __( 'Enable AutoPlay Automatically', '3d-flipbook-dflip-lite' ),
              'desc'    => __( 'Enable AutoPlay automatically when flipbook loads', '3d-flipbook-dflip-lite' ),
          ),
          'autoplay_duration' => array(
              'std'         => 5000,
              'class'       => '',
              'title'       => __( 'Autoplay Duration', '3d-flipbook-dflip-lite' ),
              'desc'        => __( 'Time in milliseconds eg:<code>1000</code>for 1second', '3d-flipbook-dflip-lite' ),
              'placeholder' => 'Example: 5000',
              'type'        => 'number'
          ),
          'pages'             => array()
      );
      $this->defaults['viewerType']                = array(
        'std'     => 'flipbook',
        'choices' => array(
          'global'   => __( 'Global Setting', 'DFLIP' ),
          'reader'   => __( 'Vertical Reader', 'DFLIP' ),
          'flipbook' => __( 'Flipbook', 'DFLIP' ),
          'slider'   => __( 'Slider', 'DFLIP' )
        ),
        'title'   => __( 'Viewer Type', 'DFLIP' ),
        'desc'    => __( 'Choose the Viewer Type. Flipbook or normal viewer', 'DFLIP' )
      );

      $this->defaults['selectiveScriptLoading'] = array(
        'std'     => 'false',
        'choices' => array(
          'true'  => 'True (Enable)',
          'false' => 'False (Disable)',
        ),
        'title'   => 'Selective Script Loading',
        'desc'    => 'Load Scripts only on pages where shortcodes are added. May not work properly in AJAX based themes. Also clear your CACHE PLUGIN CACHE!',
      );

      $this->selective_script_loading = $this->get_config( 'selectiveScriptLoading' ) == "true";
      $external_translate = $this->get_config( 'external_translate' );
      $this->external_translate = $external_translate == "true";


      // Load admin only components.
      if ( is_admin() && !wp_doing_ajax() ) {
        $this->init_admin();
      } else { // Load frontend only components.
        $this->init_front();
      }

      // Load global components.
      $this->init_global();

    }

    /**
     * Loads all admin related files into scope.
     *
     * @since 1.0.0
     */
    public function init_admin() {

      include_once( dirname( __FILE__ ) . '/inc/settings.php' );

      //include the metaboxes file
      include_once dirname( __FILE__ ) . "/inc/metaboxes.php";

    }

    /**
     * Loads all frontend user related files
     *
     * @since 1.0.0
     */
    public function init_front() {

      //include the shortcode parser
      include_once dirname( __FILE__ ) . "/inc/shortcode.php";

      //include the scripts and styles for front end
      add_action( 'wp_enqueue_scripts', array( $this, 'init_front_scripts' ) );

      //some custom js that need to be passed
      add_action( 'wp_print_footer_scripts', array( $this, 'hook_script' ) );

    }

    /**
     * Loads all global files into scope.
     *
     * @since 1.0.0
     */
    public function init_global() {

      //include the post-type that manages the custom post
      include_once dirname( __FILE__ ) . '/inc/post-type.php';

    }

    /**
     * Loads all script and style sheets for frontend into scope.
     *
     * @since 1.0.0
     */
    public function init_front_scripts() {

      //register scripts and style
      wp_register_script( $this->plugin_slug . '-script', plugins_url( 'assets/js/dflip.min.js', __FILE__ ), array( "jquery" ), $this->version, true );
      wp_register_style( $this->plugin_slug . '-style', plugins_url( 'assets/css/dflip.min.css', __FILE__ ), array(), $this->version );

      if ( $this->selective_script_loading != true ) {
        //enqueue scripts and style
      wp_enqueue_script( $this->plugin_slug . '-script' );
      wp_enqueue_style( $this->plugin_slug . '-style' );
      }

    }

    public function add_defer_attribute( $tag, $handle ) {
      // add script handles to the array below
      //cache for plugin_slug
      $_slug = $this->plugin_slug;
      $scripts_to_defer = array( 'jquery-core', $_slug . '-script', $_slug . '-parse-script' );

      foreach ( $scripts_to_defer as $defer_script ) {
        if ( $defer_script === $handle ) {
          return str_replace( ' src', ' data-cfasync="false" src', $tag );
        }
      }

      return $tag;
    }

    /**
     * Registers a javascript variable into HTML DOM for url access
     *
     * @since 1.0.0
     */
    public function hook_script() {

      $data = array(
          'text'             => array(
              'toggleSound'      => $this->get_translate( 'text_toggle_sound' ),
              'toggleThumbnails' => $this->get_translate( 'text_toggle_thumbnails' ),
              'toggleOutline'    => $this->get_translate( 'text_toggle_outline' ),
              'previousPage'     => $this->get_translate( 'text_previous_page' ),
              'nextPage'         => $this->get_translate( 'text_next_page' ),
              'toggleFullscreen' => $this->get_translate( 'text_toggle_fullscreen' ),
              'zoomIn'           => $this->get_translate( 'text_zoom_in' ),
              'zoomOut'          => $this->get_translate( 'text_zoom_out' ),
              'toggleHelp'       => $this->get_translate( 'text_toggle_help' ),
              'singlePageMode'   => $this->get_translate( 'text_single_page_mode' ),
              'doublePageMode'   => $this->get_translate( 'text_double_page_mode' ),
              'downloadPDFFile'  => $this->get_translate( 'text_download_PDF_file' ),
              'gotoFirstPage'    => $this->get_translate( 'text_goto_first_page' ),
              'gotoLastPage'     => $this->get_translate( 'text_goto_last_page' ),
              'share'            => $this->get_translate( 'text_share' ),
              'mailSubject'      => $this->get_translate( 'text_mail_subject' ),
              'mailBody'         => $this->get_translate( 'text_mail_body' ),
              'loading'          => $this->get_translate( 'text_loading' )
          ),
          'viewerType'       => $this->get_config( 'viewerType' ),
          'moreControls'     => $this->get_config( 'more_controls' ),
          'hideControls'     => $this->get_config( 'hide_controls' ),
          'scrollWheel'      => $this->get_config( 'scroll_wheel' ),
          'backgroundColor'  => $this->get_config( 'bg_color' ),
          'backgroundImage'  => $this->get_config( 'bg_image' ),
          'height'           => $this->get_config( 'height' ),
          'paddingLeft'      => $this->get_config( 'padding_left' ),
          'paddingRight'     => $this->get_config( 'padding_right' ),
          'controlsPosition' => $this->get_config( 'controls_position' ),
          'duration'         => $this->get_config( 'duration' ),
          'soundEnable'      => $this->get_config( 'auto_sound' ),
          'enableDownload'   => $this->get_config( 'enable_download' ),
          'showSearchControl'=> $this->get_config( 'enable_search' ),
          'showPrintControl' => $this->get_config( 'enable_print' ),
          'enableAnnotation' => $this->get_config( 'enable_annotation' ) == "true",
          'enableAnalytics'  => $this->get_config( 'enable_analytics' ),
          'webgl'            => $this->get_config( 'webgl' ),
          'hard'             => $this->get_config( 'hard' ),
          'maxTextureSize'   => $this->get_config( 'texture_size' ),
          'rangeChunkSize'   => $this->get_config( 'range_size' ),
          'zoomRatio'        => $this->get_config( 'zoom_ratio' ),
          'stiffness'        => $this->get_config( 'stiffness' ),
          'pageMode'         => $this->get_config( 'page_mode' ),
          'singlePageMode'   => $this->get_config( 'single_page_mode' ),
          'pageSize'         => $this->get_config( 'page_size' ),
          'autoPlay'         => $this->get_config( 'autoplay' ),
          'autoPlayDuration' => $this->get_config( 'autoplay_duration' ),
          'autoPlayStart'    => $this->get_config( 'autoplay_start' ),
          'linkTarget'       => $this->get_config( 'link_target' ),
          'sharePrefix'      => $this->get_config( 'share_prefix' )
      );

      //registers a variable that stores the location of plugin
      $output = '<script data-cfasync="false"> var dFlipLocation = "' . plugins_url( 'assets/', __FILE__ ) . '"; var dFlipWPGlobal = ' . json_encode( $data ) . ';</script>';
      echo $output;

    }

    /**
     * Helper method for retrieving config values.
     *
     * @param string $key The config key to retrieve.
     *
     * @return string Key value on success, empty string on failure.
     * @since 1.2.6
     *
     */
    public function get_config( $key ) {

      $values = is_multisite() ? get_blog_option( null, '_dflip_settings', true ) : get_option( '_dflip_settings', true );
      $value = isset( $values[ $key ] ) ? $values[ $key ] : '';

      $default = $this->get_default( $key );

      /* set standard value */
      if ( $default !== null ) {
        $value = $this->filter_std_value( $value, $default );
      }

      return $value;

    }

    public function get_global_config( $key ) {
      return $this->get_config( $key );
    }


    /**
     * Helper method for retrieving global check values.
     *
     * @param string $key  The config key to retrieve.
     *
     * @return string Key value on success, empty string on failure.
     * @since 1.0.0
     *
     */
    public function global_config( $key ) {//todo name is not proper

      $global_value = $this->get_global_config( $key );
      $value = isset( $this->defaults[ $key ] ) ? is_array( $this->defaults[ $key ] ) ? isset( $this->defaults[ $key ]['choices'][ $global_value ] )
          ? $this->defaults[ $key ]['choices'][ $global_value ] : $global_value : $global_value : $global_value;

      return $value;

    }

    public function get_translate( $key ) {
      if ( $this->external_translate == true ) {
        return $this->get_default( $key );
      } else {
        return $this->get_config( $key );
      }
    }

    /**
     * Helper method for retrieving default values.
     *
     * @param string $key The config key to retrieve.
     *
     * @return string Key value on success, empty string on failure.
     * @since 1.0.0
     *
     */
    public function get_default( $key ) {

      $default = isset( $this->defaults[ $key ] ) ? is_array( $this->defaults[ $key ] ) ? isset( $this->defaults[ $key ]['std'] ) ? $this->defaults[ $key ]['std'] : '' : $this->defaults[ $key ] : '';

      return $default;

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
     * Helper function to create settings boxes
     *
     * @access    public
     *
     * @param        $key
     * @param null   $setting
     * @param null   $value
     * @param null   $global_key
     * @param string $global_value
     *
     * @since     1.2.6
     *
     */
    public function create_setting( $key, $setting = null, $value = null, $global_key = null, $global_value = '' ) {

      $slug = $this->plugin_slug;
      $setting = is_null( $setting ) ? $this->defaults[ $key ] : $setting;
      if ( is_null( $setting ) ) {
        echo "<!--    " . esc_html( $key ) . " Not found   -->";

        return;
      }
      $type = isset( $setting['type'] ) ? $setting['type'] : '';
      $value = is_null( $value ) ? $this->get_global_config( $key ) : $value;
      $condition = isset( $setting['condition'] ) ? $setting['condition'] : '';
      $class = isset( $setting['class'] ) ? $setting['class'] : '';
      $placeholder = isset( $setting['placeholder'] ) ? $setting['placeholder'] : '';
      $desc = isset( $setting['desc'] ) ? $setting['desc'] : '';
      $title = isset( $setting['title'] ) ? $setting['title'] : '';
      if ( $title == 'std' ) {//useful in translate settings
        $title = $this->get_default( $key );
      }
      $global_attr = !is_null( $global_key ) ? $global_key : "";
      $global_face_value = $global_value;

      echo '<div id="' . $slug . '_' . esc_attr( $key ) . '_box" class="df-box ' . esc_attr( $class ) . '" data-condition="' . esc_attr( $condition ) . '">
      <div class="df-label"><label for="' . $slug . '_' . esc_attr( $key ) . '" >
				' . esc_attr( $title ) . '
			</label></div>';
      echo '<div class="df-option">';
      if ( isset( $setting['choices'] ) && is_array( $setting['choices'] ) ) {

        echo '<div class="df-select">
				<select name="_' . $slug . '[' . esc_attr( $key ) . ']" id="' . $slug . '_' . esc_attr( $key ) . '" class="" data-global="' . esc_attr( $global_attr ) . '">';

        /** @noinspection PhpCastIsUnnecessaryInspection */
        foreach ( (array) $setting['choices'] as $val => $label ) {

          if ( is_null( $global_key ) && $val === "global" ) {
            continue;
          }

          echo '<option value="' . esc_attr( $val ) . '" ' . selected( $value, $val, false ) . '>' . esc_attr( $label ) . '</option>';

          //				}
        }
        echo '</select>';
        $global_face_value = $this->global_config( $key );

      } else if ( $type == 'upload' ) {
        $tooltip = isset( $setting['button-tooltip'] ) ? $setting['button-tooltip'] : 'Select';
        $button_text = isset( $setting['button-text'] ) ? $setting['button-text'] : 'Select';
        echo '<div class="df-upload">
				<input placeholder="' . esc_attr( $placeholder ) . '" type="text" name="_' . $slug . '[' . esc_attr( $key ) . ']" id="' . $slug . '_' . esc_attr( $key ) . '"
				       value="' . esc_attr( $value ) . '"
				       class="widefat df-upload-input " data-global="' . esc_attr( $global_attr ) . '"/>
				<a href="javascript:void(0);" id="' . $slug . '_upload_' . esc_attr( $key ) . '"
				   class="df-upload-media df-button button button-primary light"
				   title="' . esc_attr( $tooltip ) . '">
					' . esc_attr( $button_text ) . '
				</a>';

      } else if ( $type == 'textarea' ) {
        echo '<div class="">
				<textarea rows="3" cols="40" name="_' . $slug . '[' . esc_attr( $key ) . ']" id="' . $slug . '_' . esc_attr( $key ) . '"
				          class="" data-global="' . esc_attr( $global_attr ) . '">' . esc_attr( $value ) . '</textarea>';
      } else {
        $attrHTML = ' ';

        if ( isset( $setting['attr'] ) ) {
          foreach ( $setting['attr'] as $attr_key => $attr_value ) {
            $attrHTML .= $attr_key . "=" . $attr_value . " ";
          }
        }

        echo '<div class="">
				<input  placeholder="' . esc_attr( $placeholder ) . '" value="' . esc_attr( $value ) . '" type="' . esc_attr( $type ) . '" ' . esc_attr( $attrHTML ) . ' name="_' . $slug . '[' . esc_attr( $key ) . ']" id="' . $slug . '_' . esc_attr( $key ) . '" class="" data-global="' . esc_attr( $global_attr ) . '"/>';
      }

      if ( !is_null( $global_key ) ) {
        echo '<div class="df-global-value" data-global-value="' . esc_attr( $global_value ) . '"><i>Default:</i>
					<code>' . esc_attr( $global_face_value ) . '</code></div>';
      }
      echo '</div>
			<div class="df-desc">
				' . $desc . '
				<a class="df-help-link" target="_blank" href="' . $this->settings_help_page . '#' . esc_attr( strtolower( $key ) ) . '">More Info >> </a>
			</div></div>
		</div>';

    }

    public function dflip_lite_check() {
      if ( is_admin() ) {
        if ( $this->is_plugin_active( 'dflip/dflip.php' ) ) {
          add_action( 'admin_notices', array( $this, 'dflip_lite_check_notice' ) );
        }
      }
    }

    public function dflip_lite_check_notice() {

      ?>
        <div class="update-nag notice">
            <p>dFlip Lite version is also active. Disable lite version to use dFlip Full Version.</p>
        </div>
      <?php

    }

    function is_plugin_active( $plugin ) {
      return in_array( $plugin, (array) get_option( 'active_plugins', array() ) );
    }

    public function create_separator( $title = '' ) {
      echo '<div class="df-box df-box-separator">' . $title . '</div>';
    }

    /**
     * Returns the singleton instance of the class.
     *
     * @return object DFlip object.
     * @since 1.0.0
     *
     */
    public static function get_instance() {

      if ( !isset( self::$instance ) && !( self::$instance instanceof DFlip ) ) {
        self::$instance = new DFlip();
      }

      return self::$instance;

    }

  }

  //Load the dFlip Plugin Class
  $dflip = DFlip::get_instance();
}




/*Avoid PHP closing tag to prevent "Headers already sent"*/
