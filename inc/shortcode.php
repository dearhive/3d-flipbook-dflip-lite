<?php

/**
 * Created by PhpStorm.
 * User: Deepak
 * Date: 5/3/2016
 * Time: 2:27 PM
 */
class DFlip_ShortCode {

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
   * Primary class constructor.
   *
   * @since 1.0.0
   */
  public function __construct() {

    // Load the base class object.
    $this->base = DFlip::get_instance();

    // Load shortcode hooks and filters.
    add_shortcode( 'dflip', array( $this, 'shortcode' ) );

  }

  /**
   * Builds the dFlip Shortcode for the plugin
   *
   * @param array  $attr    Attributes of the shortcode.
   * @param string $content Content of the button or thumb
   *
   * @return string HTML content to display image-text.
   * @since 1.0.0
   *
   */
  public function shortcode( $attr, $content = '' ) {

    if ( $this->base->selective_script_loading == true ) {
      //enqueue script
      wp_enqueue_script( $this->base->plugin_slug . '-script' );

      //enqueue styles
      wp_enqueue_style( $this->base->plugin_slug . '-style' );
    }

    $ismulti = isset( $attr['books'] ) && trim( $attr['books'] ) !== '';
    $atts_default = array(
        'class' => '',
        'id'    => '',
        'books' => ''
    );
    //atts or post defaults
    $atts = shortcode_atts( $atts_default, $attr, 'dflip' );

    if ( $ismulti ) {
      $limit = isset( $attr['limit'] ) ? (int) $attr['limit'] : 5;
      $ids = array();
      $books = explode( ',', $atts['books'] );
      foreach ( (array) $books as $query ) {
        $query = trim( $query );
        if ( is_numeric( $query ) ) {
          array_push( $ids, $query );
        } else {
          if ( $query == 'all' || $query == '*' ) {
            $postslist = get_posts( array(
                'post_type'      => 'dflip',
                'posts_per_page' => - 1,
                'numberposts'    => $limit,
                'nopaging'       => true,
                'exclude'        => $ids
            ) );
            foreach ( $postslist as $post ) {
              array_push( $ids, $post->ID );
            }
          } else {
            $postslist = get_posts( array(
                'tax_query'      => array(
                    array(
                        'taxonomy' => 'dflip_category',
                        'field'    => 'slug',
                        'terms'    => $query,
                    )
                ),
                'post_type'      => 'dflip',
                'posts_per_page' => - 1,
                'numberposts'    => $limit,
                'nopaging'       => true,
                'exclude'        => $ids
            ) );
            foreach ( $postslist as $post ) {
              array_push( $ids, $post->ID );
            }
          }
        }
      }
      $html = '<div class="dflip-books">';
      $limitMax = $limit == '-1' ? 999 : (int) $limit;
      $limit = 0;
      foreach ( $ids as $id ) {
        if ( $limit >= $limitMax ) {
          break;
        }
        $attr['id'] = esc_attr( $id );
        $html .= $this->book( $attr, $content, true );
        $limit ++;

      }

      return $html . '</div>';

    } else {
      return $this->book( $attr, $content );
    }
  }

  /**
   * Helper function for dFlip Shortcode
   *
   * @param        $attr
   * @param string $content Content of the button or thumb
   *
   * @param bool   $multi   checks if this is a part of multiple books request
   *
   * @return string HTML content to display image-text.
   * @since    1.0.0
   *
   * @internal param array $attr Attributes of the shortcode.
   */
  public function book( $attr, $content = '', $multi = false ) {
    $base = $this->base;

    $atts_default = array(
        'class' => '',
        'id'    => '',
        'type'  => $multi ? 'thumb' : 'book'
    );

    //atts or post defaults
    $atts = shortcode_atts( $atts_default, $attr, 'dflip' );
    if($atts["type"] === "hidden"){
      return "";
    }
    //in PHP7 if $attr is not an array it causes issue
    if ( is_array( $attr ) == false ) {
      $attr = array();
    }
    $html_attr = array();

    //default data
    $id = $atts['id'] === '' ? 'df_rand' . rand() : $atts['id'];
    $id = sanitize_title($id);
    $type = $atts['type'];
    $class = $atts['class'];
    $title = do_shortcode( $content );

    //get Id
    $post_id = $id;
    $hasId = false;
    $thumb_url = '';
    $thumb_tag_type = $base->get_config( 'thumb_tag_type' );
    $share_slug = $base->get_config( 'share_slug' );

    $post_data = array();

    $help_info = '';
    //pull post data if available for the script part only
    if ( !empty( $post_id ) && is_numeric( $post_id ) ) {

      /*			$post = get_post( $post_id );
            if ( $post == null ) {
              return '';
            }*/

      $id = 'df_' . $post_id;

      $post_meta = get_post_meta( $post_id, '_dflip_data' );

      if ( $title === '' ) {
        $title = get_the_title( $post_id );
      }


      if ( is_array( $post_meta ) && count( $post_meta ) > 0 ) {
        $post_data = $post_meta[0];
      }

      //conversion
      $post_data['enableDownload'] = isset( $post_data['enable_download'] ) ? $post_data['enable_download'] : null;
      $post_data['backgroundColor'] = isset( $post_data['bg_color'] ) ? $post_data['bg_color'] : null;
      $post_data['backgroundImage'] = isset( $post_data['bg_image'] ) ? $post_data['bg_image'] : null;
      $post_data['autoEnableOutline'] = isset( $post_data['auto_outline'] ) ? $post_data['auto_outline'] : null;
      $post_data['autoEnableThumbnail'] = isset( $post_data['auto_thumbnail'] ) ? $post_data['auto_thumbnail'] : null;
      $post_data['overwritePDFOutline'] = isset( $post_data['overwrite_outline'] ) ? $post_data['overwrite_outline'] : null;
      $post_data['soundEnable'] = isset( $post_data['auto_sound'] ) ? $post_data['auto_sound'] : null;
      $post_data['maxTextureSize'] = isset( $post_data['texture_size'] ) ? $post_data['texture_size'] : null;
      $post_data['pageMode'] = isset( $post_data['page_mode'] ) ? $post_data['page_mode'] : null;
      $post_data['singlePageMode'] = isset( $post_data['single_page_mode'] ) ? $post_data['single_page_mode'] : null;
      $post_data['pageSize'] = isset( $post_data['page_size'] ) ? $post_data['page_size'] : null;
      $post_data['controlsPosition'] = isset( $post_data['controls_position'] ) ? $post_data['controls_position'] : null;
      $post_data['viewerType'] = isset( $post_data['viewerType'] ) ? $post_data['viewerType'] : null;
      $post_data['autoPlay'] = isset( $post_data['autoplay'] ) ? $post_data['autoplay'] : null;
      $post_data['autoPlayDuration'] = isset( $post_data['autoplay_duration'] ) ? $post_data['autoplay_duration'] : null;
      $post_data['autoPlayStart'] = isset( $post_data['autoplay_start'] ) ? $post_data['autoplay_start'] : null;


      $post_defaults = array(
          'webgl'               => $base->get_default( 'webgl' ),
          'class'               => '',
          'id'                  => '',
          //internal
          'source_type'         => $base->get_default( 'source_type' ),
          'pdf_source'          => '',
          'pdf_thumb'           => '',
          'pages'               => array(),
          'outline'             => '',
          'backgroundColor'     => $base->get_default( 'bg_color' ),
          'height'              => $base->get_default( 'height' ),
          'duration'            => $base->get_default( 'duration' ),
          'hard'                => $base->get_default( 'hard' ),
          'viewerType'          => $base->get_default( 'viewerType' ),
          'autoEnableOutline'   => $base->get_default( 'auto_outline' ),
          'autoEnableThumbnail' => $base->get_default( 'auto_thumbnail' ),
          'overwritePDFOutline' => $base->get_default( 'overwrite_outline' ),
          'enableDownload'      => $base->get_default( 'enable_download' ),
          'backgroundImage'     => $base->get_default( 'bg_image' ),
          'direction'           => $base->get_default( 'direction' ),
          'pageSize'            => $base->get_default( 'page_size' ),
          'pageMode'            => $base->get_default( 'page_mode' ),
          'singlePageMode'      => $base->get_default( 'single_page_mode' ),
          'controlsPosition'    => $base->get_default( 'controls_position' ),
          'soundEnable'         => $base->get_default( 'auto_sound' ),
          'maxTextureSize'      => $base->get_default( 'texture_size' ),
          'autoPlay'            => $base->get_default( 'autoplay' ),
          'autoPlayDuration'    => $base->get_default( 'autoplay_duration' ),
          'autoPlayStart'       => $base->get_default( 'autoplay_start' ),
          'thumb'               => '',
          'source'              => '',
          'wpOptions'           => 'true'
      );

      $post_data = shortcode_atts( $post_defaults, $post_data, 'dflip' );
      //			$data      = shortcode_atts( $post_data, $attr, 'dflip' );

      $source_type = $post_data['source_type'];
      $pdf_source = $post_data['pdf_source'];

      $post_data['source'] = '';

      if ( $source_type == 'pdf' ) {
        $post_data['source'] = $pdf_source;
        $thumb_url = empty( $post_data['pdf_thumb'] ) ? '' : $post_data['pdf_thumb'];
      }

      if ( $source_type == 'image' ) {
        $pages = array_map( 'maybe_unserialize', $post_data['pages'] );
        $source_list = array();
        $links = array();
        $index = 0;
        foreach ( $pages as $image ) {
          if ( $thumb_url === '' ) {
            $thumb_url = $image['url'];
          }
          if ( $image['url'] !== '' ) {
            array_push( $source_list, $image['url'] );
          }
          if ( isset( $image['hotspots'] ) && $image['hotspots'] !== '' ) {
            $links[ $index ] = $image['hotspots'];
          }
          $index ++;
        }
        $post_data['links'] = $links;
        $post_data['source'] = $source_list;
      }

      unset( $post_data['pages'] );
      unset( $post_data['pdf_source'] );
      unset( $post_data['pdf_thumb'] );
      unset( $post_data['thumb'] );
      unset( $post_data['source_type'] );
      unset( $post_data['class'] );
      unset( $post_data['id'] );

      foreach ( $post_data as $key => $value ) {
        if ( $value === "" || $value === null || $value == "global" ) {//newly added will be null in old post
          unset( $post_data[ $key ] );
        }
      }
      //			$attr['slug'] = $post->post_name;

      $help_tip = ""; //todo remove
      $help_info = ''; //todo remove
      $html_attr['_slug'] = get_post( $post_id )->post_name;
    } else {
      /*handled by new attribute support*/
    }

    //deep-link
    $html_attr['data-title'] = sanitize_title( $title );
    if ( !$multi && isset( $attr['slug'] ) && !empty( $attr['slug'] ) ) {
      $html_attr['slug'] = sanitize_title( $attr['slug'] );
    } else if ( $share_slug == 'true' ) {
      $html_attr['slug'] = get_post( $post_id )->post_name;
    }


    if ( empty( $title ) ) {
      $title = "Open Book";
    }

    //		if (0 === strpos($data['source'], '/wp-content/')) {
    //			$data['source'] = get_site_url() . $data['source'];
    //		}

    /*Attribute overrides*/
    $attrHTML = ' ';

    $html_attr['wpoptions'] = 'true';

    if ( !isset( $attr['thumb'] ) && $thumb_url !== '' ) {
      $html_attr['thumb'] = esc_attr( $thumb_url );
    }
    if ( isset( $attr['thumb'] ) ) {
      $html_attr['thumb'] = $attr['thumb'];
    }

    if ( !isset( $attr['thumbtype'] ) ) {
      $html_attr['thumbtype'] = esc_attr( $thumb_tag_type );
    } else {
      $html_attr['thumbtype'] = $attr['thumbtype'];
    }

    //$attr is removed since it can contain insecure and malicious data, atts hold only required keys and sanitized values
    if ( isset( $attr['data-page'] ) ) {
      $html_attr['data-page'] = esc_attr( $attr['data-page'] );
    }
    if ( isset( $attr['source'] ) ) {
      $html_attr['source'] = esc_attr( $attr['source'] );
    }
    if ( isset( $attr["height"] ) ) {
      $html_attr["height"] = $attr["height"];
    }
    if ( isset( $attr["webgl"] ) ) {
      $html_attr["webgl"] = $attr["webgl"];
    }
    foreach ( $html_attr as $key => $value ) {
      $attrHTML .= esc_attr( $key ) . '="' . esc_attr( $value ) . '" ';
    }

    $html = "";


    if ( $type == 'thumb' || $type == 'button' ) {
      $html = '<div class="_df_' . $type . ' ' . esc_attr( $class ) . '" id="' . esc_attr( $id ) . '" ' . $attrHTML . '>' . esc_attr( $title ) . '</div>';
    }
    //
    //
    else {

      $html = '<div class="_df_book df-lite' . esc_attr( $class ) . '" id="' . esc_attr( $id ) . '" ' . $attrHTML . '></div>';
    }

    if ( count( $post_data ) > 0 ) {

      /*Normally this occurs only when a valid post id is added*/

      $code = 'window.option_' . $id . ' = ' . json_encode( $post_data ) . '; if(window.DFLIP && window.DFLIP.parseBooks){window.DFLIP.parseBooks();}';

      $html .= '<script class="df-shortcode-script" type="application/javascript">' . $code . '</script>';

    }

    return $html;
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
         && !( self::$instance instanceof DFlip_ShortCode ) ) {
      self::$instance = new DFlip_ShortCode();
    }

    return self::$instance;

  }

}

//Load the dFlip Plugin Class
$dflip_shortcode = DFlip_ShortCode::get_instance();


