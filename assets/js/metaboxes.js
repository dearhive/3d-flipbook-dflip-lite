/**!
 * wp-color-picker-alpha
 *
 * Overwrite Automattic Iris for enabled Alpha Channel in wpColorPicker
 * Only run in input and is defined data alpha in true
 *
 * Version: 3.0.2
 * https://github.com/kallookoo/wp-color-picker-alpha
 * Licensed under the GPLv2 license or later.
 */
(function (o, a) {
  var t = {version: 302};
  if ("wpColorPickerAlpha" in window && "version" in window.wpColorPickerAlpha) {
    var r = parseInt(window.wpColorPickerAlpha.version, 10);
    if (!isNaN(r) && r >= t.version) return
  }
  if (!Color.fn.hasOwnProperty("to_s")) {
    Color.fn.to_s = function (o) {
      o = o || "hex", "hex" === o && this._alpha < 1 && (o = "rgba");
      var a = "";
      return "hex" === o ? a = this.toString()
        : this.error || (a = this.toCSS(o).replace(/\(\s+/, "(").replace(/\s+\)/, ")")), a
    }, window.wpColorPickerAlpha = t;
    var i = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAAHnlligAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAHJJREFUeNpi+P///4EDBxiAGMgCCCAGFB5AADGCRBgYDh48CCRZIJS9vT2QBAggFBkmBiSAogxFBiCAoHogAKIKAlBUYTELAiAmEtABEECk20G6BOmuIl0CIMBQ/IEMkO0myiSSraaaBhZcbkUOs0HuBwDplz5uFJ3Z4gAAAABJRU5ErkJggg==";
    o.widget("a8c.iris", o.a8c.iris, {
      alphaOptions: {alphaEnabled: !1},
      _getColor: function (o) {
        return o === a && (o = this._color), this.alphaOptions.alphaEnabled
          ? (o = o.to_s(this.alphaOptions.alphaColorType), this.alphaOptions.alphaColorWithSpace || (o = o.replace(/\s+/g, "")), o)
          : o.toString()
      },
      _create: function () {
        try {this.alphaOptions = this.element.wpColorPicker("instance").alphaOptions} catch (o) {}
        o.extend({}, this.alphaOptions, {
          alphaEnabled: !1,
          alphaCustomWidth: 130,
          alphaReset: !1,
          alphaColorType: "hex",
          alphaColorWithSpace: !1
        }), this._super()
      },
      _addInputListeners: function (o) {
        var a = this, t = 100, r = function (t) {
          var r = o.val(), i = new Color(r), l = (r = r.replace(/^(#|(rgb|hsl)a?)/, ""), a.alphaOptions.alphaColorType);
          o.removeClass("iris-error"), i.error ? "" !== r && o.addClass("iris-error")
            : "hex" === l && "keyup" === t.type && r.match(/^[0-9a-fA-F]{3}$/) || i.toIEOctoHex() !== a._color.toIEOctoHex() && a._setOption("color", a._getColor(i))
        };
        o.on("change", r).on("keyup", a._debounce(r, t)), a.options.hide && o.one("focus", function () {a.show()})
      },
      _initControls: function () {
        if (this._super(), this.alphaOptions.alphaEnabled) {
          var a = this, t = a.controls.strip.clone(!1, !1), r = t.find(".iris-slider-offset"),
            i = {stripAlpha: t, stripAlphaSlider: r};
          t.addClass("iris-strip-alpha"), r.addClass("iris-slider-offset-alpha"), t.appendTo(a.picker.find(".iris-picker-inner")), o.each(i, function (o, t) {a.controls[o] = t}), a.controls.stripAlphaSlider.slider({
            orientation: "vertical",
            min: 0,
            max: 100,
            step: 1,
            value: parseInt(100 * a._color._alpha),
            slide: function (o, t) {a.active = "strip", a._color._alpha = parseFloat(t.value / 100), a._change.apply(a, arguments)}
          })
        }
      },
      _dimensions: function (o) {
        if (this._super(o), this.alphaOptions.alphaEnabled) {
          var a, t, r, i, l, e = this, s = e.options, n = e.controls, p = n.square, h = e.picker.find(".iris-strip");
          for (a = Math.round(e.picker.outerWidth(!0) - (s.border ? 22
            : 0)), t = Math.round(p.outerWidth()), r = Math.round((a - t) / 2), i = Math.round(r / 2), l = Math.round(t + 2 * r + 2 * i); l > a;) r = Math.round(r - 2), i = Math.round(i - 1), l = Math.round(t + 2 * r + 2 * i);
          p.css("margin", "0"), h.width(r).css("margin-left", i + "px")
        }
      },
      _change: function () {
        var a = this, t = a.active;
        if (a._super(), a.alphaOptions.alphaEnabled) {
          var r = a.controls, l = parseInt(100 * a._color._alpha), e = a._color.toRgb(),
            s = ["rgb(" + e.r + "," + e.g + "," + e.b + ") 0%", "rgba(" + e.r + "," + e.g + "," + e.b + ", 0) 100%"];
          a.picker.closest(".wp-picker-container").find(".wp-color-result");
          a.options.color = a._getColor(), r.stripAlpha.css({background: "linear-gradient(to bottom, " + s.join(", ") + "), url(" + i + ")"}), t && r.stripAlphaSlider.slider("value", l), a._color.error || a.element.removeClass("iris-error").val(a.options.color), a.picker.find(".iris-palette-container").on("click.palette", ".iris-palette", function () {
            var t = o(this).data("color");
            a.alphaOptions.alphaReset && (a._color._alpha = 1, t = a._getColor()), a._setOption("color", t)
          })
        }
      },
      _paintDimension: function (o, a) {
        var t = this, r = !1;
        t.alphaOptions.alphaEnabled && "strip" === a && (r = t._color, t._color = new Color(r.toString()), t.hue = t._color.h()), t._super(o, a), r && (t._color = r)
      },
      _setOption: function (o, a) {
        var t = this;
        if ("color" !== o || !t.alphaOptions.alphaEnabled) return t._super(o, a);
        a = "" + a, newColor = new Color(a).setHSpace(t.options.mode), newColor.error || t._getColor(newColor) === t._getColor() || (t._color = newColor, t.options.color = t._getColor(), t.active = "external", t._change())
      },
      color: function (o) {
        return !0 === o ? this._color.clone() : o === a ? this._getColor() : void this.option("color", o)
      }
    }), o.widget("wp.wpColorPicker", o.wp.wpColorPicker, {
      alphaOptions: {alphaEnabled: !1},
      _getAlphaOptions: function () {
        var a = this.element, t = a.data("type") || this.options.type, r = a.data("defaultColor") || a.val(), i = {
          alphaEnabled: a.data("alphaEnabled") || !1,
          alphaCustomWidth: 130,
          alphaReset: !1,
          alphaColorType: "rgb",
          alphaColorWithSpace: !1
        };
        return i.alphaEnabled && (i.alphaEnabled = a.is("input") && "full" === t), i.alphaEnabled
          ? (i.alphaColorWithSpace = r && r.match(/\s/), o.each(i, function (o, t) {
            var l = a.data(o) || t;
            switch (o) {
              case"alphaCustomWidth":
                l = l ? parseInt(l, 10) : 0, l = isNaN(l) ? t : l;
                break;
              case"alphaColorType":
                l.match(/^(hex|(rgb|hsl)a?)$/) || (l = r && r.match(/^#/) ? "hex" : r && r.match(/^hsla?/) ? "hsl" : t);
                break;
              default:
                l = !!l
            }
            i[o] = l
          }), i) : i
      },
      _create: function () {o.support.iris && (this.alphaOptions = this._getAlphaOptions(), this._super())},
      _addListeners: function () {
        if (!this.alphaOptions.alphaEnabled) return this._super();
        var a = this, t = a.element, r = a.toggler.is("a");
        this.alphaOptions.defaultWidth = t.width(), this.alphaOptions.alphaCustomWidth && t.width(parseInt(this.alphaOptions.defaultWidth + this.alphaOptions.alphaCustomWidth, 10)), a.toggler.css({
          position: "relative",
          "background-image": "url(" + i + ")"
        }), r ? a.toggler.html('<span class="color-alpha" />')
          : a.toggler.append('<span class="color-alpha" />'), a.colorAlpha = a.toggler.find("span.color-alpha").css({
          width: "30px",
          height: "100%",
          position: "absolute",
          top: 0,
          "background-color": t.val()
        }), "ltr" === a.colorAlpha.css("direction") ? a.colorAlpha.css({
          "border-bottom-left-radius": "2px",
          "border-top-left-radius": "2px",
          left: 0
        }) : a.colorAlpha.css({
          "border-bottom-right-radius": "2px",
          "border-top-right-radius": "2px",
          right: 0
        }), t.iris({change: function (o, t) {a.colorAlpha.css({"background-color": t.color.to_s(a.alphaOptions.alphaColorType)}), "function" == typeof a.options.change && a.options.change.call(this, o, t)}}), a.wrap.on("click.wpcolorpicker", function (o) {o.stopPropagation()}), a.toggler.on("click", function () {
          a.toggler.hasClass("wp-picker-open") ? a.close() : a.open()
        }), t.on("change", function (i) {
          var l = o(this).val();
          (t.hasClass("iris-error") || "" === l || l.match(/^(#|(rgb|hsl)a?)$/)) && (r && a.toggler.removeAttr("style"), a.colorAlpha.css("background-color", ""), "function" == typeof a.options.clear && a.options.clear.call(this, i))
        }), a.button.on("click", function (i) {
          o(this).hasClass("wp-picker-default") ? t.val(a.options.defaultColor).change()
            : o(this).hasClass("wp-picker-clear") && (t.val(""), r && a.toggler.removeAttr("style"), a.colorAlpha.css("background-color", ""), "function" == typeof a.options.clear && a.options.clear.call(this, i), t.trigger("change"))
        })
      }
    })
  }
})(jQuery);

/**
 * Created by Deepak on 5/9/2016.
 */

(function ($) {

  function initTabs(tabs) {

    $(document).on("click", "." + tabs.tabsListId + " a", function (event) {
      event.preventDefault();

      var parent = $(this).parent();

      if (parent.hasClass(tabs.activeClass)) return;

      var target_id = $(this).attr("href").replace("!", "");
      var target = $(this).closest("." + tabs.tabsId).find(target_id);

      var tab = (parent[0].nodeName == "LI") ? parent : $(this);
      var tabActiveClass = tabs.activeClass;
      if (tab.hasClass("nav-tab"))
        tabActiveClass += " nav-tab-active";

      tab.siblings().removeClass(tabActiveClass);
      tab.addClass(tabActiveClass);

      target.siblings().removeClass(tabActiveClass);
      target.addClass(tabActiveClass);

      if (parent.hasClass(tabs.hashUpdateClass)) {
        var hash = this.hash.split('#').join('#!');
        // window.location.hash = hash;
        history.replaceState(undefined, undefined, hash)
        updatePostHash(hash);
      }
    });

    function updatePostHash(value) {
      var post_link = $('#post').attr('action');
      if (post_link) {
        post_link = post_link.split('#')[0];
        $('#post').attr('action', post_link + value);
      }
    }

    if (window.location.hash && window.location.hash.indexOf('!') >= 0) {
      $('.' + tabs.tabsListId).find('a[href="' + window.location.hash.replace('!', '') + '"]').trigger("click");
      updatePostHash(window.location.hash);
    }
  }

  function match_condition(condition) {
    var match;
    var regex = /(.+?):(is|not|contains|notcontains|less_than|less_than_or_equal_to|greater_than|greater_than_or_equal_to)\((.*?)\),?/g;
    var conditions = [];

    while (match = regex.exec(condition)) {
      conditions.push({
        'check': match[1],
        'rule': match[2],
        'value': match[3] || ''
      });
    }

    return conditions;
  }

  function parse_condition() {
    $('[data-condition]').each(function () {

      var passed;
      var conditions = match_condition($(this).data('condition'));
      if (conditions.length > 0) {
        var operator = ($(this).data('operator') || 'and').toLowerCase();

        $.each(conditions, function (index, condition) {

          //var target   = $( '#setting_' + condition.check );
          var targetEl = $("#" + condition.check);// !! target.length && target.find( OT_UI.condition_objects() ).first();

          //if ( ! target.length || ( ! targetEl.length && condition.value.toString() != '' ) ) {
          //    return;
          //}
          if (!targetEl.length) {
            return;
          }

          var v1 = targetEl.length ? targetEl.val().toString() : '';

          if (targetEl.data("global") === v1) {//happens only with dropdown
            //skip global and take real global value
            var tmp = targetEl.siblings("[data-global-value]").data("global-value");
            if (tmp !== undefined) {
              v1 = tmp.toString();
            }
          }

          var v2 = condition.value.toString();
          var result;

          switch (condition.rule) {
            case 'less_than':
              result = (parseInt(v1) < parseInt(v2));
              break;
            case 'less_than_or_equal_to':
              result = (parseInt(v1) <= parseInt(v2));
              break;
            case 'greater_than':
              result = (parseInt(v1) > parseInt(v2));
              break;
            case 'greater_than_or_equal_to':
              result = (parseInt(v1) >= parseInt(v2));
              break;
            case 'contains':
              result = (v1.indexOf(v2) !== -1 ? true : false);
              break;
            case 'notcontains':
              result = (v1.indexOf(v2) === -1 ? true : false);
              break;
            case 'is':
              result = (v1 == v2);
              break;
            case 'not':
              result = (v1 != v2);
              break;
          }

          if ('undefined' == typeof passed) {
            passed = result;
          }

          switch (operator) {
            case 'or':
              passed = (passed || result);
              break;
            case 'and':
            default:
              passed = (passed && result);
              break;
          }

        });

        resultClass = "condition-fail";
        if (passed) {
          $(this).removeClass(resultClass);
        }
        else {
          $(this).addClass(resultClass);
        }

        delete passed;
      }
    });
  }

  function checkGlobal(_this) {
    var globalValue = _this.data("global");
    if (_this.val) {
      var value = _this.val().trim();
      if (value == globalValue || (globalValue == undefined && value == "")) {
        _this.addClass("df-global-active").removeClass("df-global-inactive");
      }
      else {
        _this.addClass("df-global-inactive").removeClass("df-global-active");
      }
    }
  }

  function initConditionals() {
    $(".df-box .df-option div>:input").on("change", function () {
      parse_condition();
      checkGlobal($(this));
    });
    parse_condition();
    $('.df-box .df-option div>:input[id^="dflip"][data-global]').each(function () {
      checkGlobal($(this));
    });

  }

  $(document).ready(function () {

    var pageItemClass = "dflip-page-item",
      pageEmptyItemClass = "dflip-empty-page",
      pageThumbClass = "dflip-page-thumb",
      activeClass = "dflip-active",
      hashUpdateClass = "dflip-update-hash",
      pageOptionsClass = "dflip-page-options",
      pageList = $("#dflip_page_list"),
      pageListBox = $("#dflip_pages_box"),
      outlineBox = $("#dflip_outline_box"),
      uploadMediaClass = "dflip_upload_media",
      tabsId = "dflip-tabs",
      tabsListId = "dflip-tabs-list";

    var thumbAutoButton = null,
      thumbSrcInput = null,
      thumbnailPreview = null;

    $('.df-color-alpha-input .df-option input').attr("data-alpha-enabled", true);
    $('.df-color-alpha-input .df-option input, .df-color-input .df-option input').wpColorPicker();

    $("#content").val($("#dflip_settings").val());

    initTabs({
      activeClass: "dflip-active",
      hashUpdateClass: "dflip-update-hash",
      tabsId: "dflip-tabs",
      tabsListId: "dflip-tabs-list"
    });

    // Enable page sort
    if (pageList.length > 0 && pageList.sortable) {
      pageList.sortable({
        containment: pageListBox,
        items: "> ." + pageItemClass
      });
      var newPageIndex = pageList.find("." + pageItemClass).length;
      pageList.find("." + pageItemClass).each(function (index) {
        $(this).attr("index", index);
      });
      pageList.append(newPageItem({}, newPageIndex));
    }
    newPageIndex++;

    function uploadMedia(options) {
      var title = options.title || 'Select File',
        text = options.text || 'Send to dFlip',
        urlInput = options.target;

      var multiple = options.multiple == true ? 'add' : false;
      var uploader = wp.media({
        multiple: multiple,
        title: title,
        button: {
          text: text
        },
        library: {
          type: options.type
        }

      })
        .on('select', function () {
          var files = uploader.state().get('selection');

          if (multiple == false) {
            var fileUrl = files.models[0].attributes.url;
            urlInput.val(fileUrl);
            if (options.callback) options.callback(fileUrl);
          }
          else {
            if (options.callback) options.callback(files);
          }


        })
        .open();
    }

    //upload doc
    $(document).on('click', '#dflip_upload_pdf_source', function (e) {
      e.preventDefault();
      uploadMedia({
        target: $(this).parent().find("input"),
        type: 'application/pdf',
        callback: function (url) {
          if (thumbAutoButton)
            thumbAutoButton.trigger("click");
          parse_condition();
          checkGlobal($("#dflip_upload_pdf_source"));
        }
      });
    });
    $(document).on('click', '#dflip_upload_pdf_thumb', function (e) {
      e.preventDefault();
      uploadMedia({
        type: 'image',
        target: $(this).parent().find("input"),
        callback: function (src) {
          updateThumb(src);
        }
      });
    });
    $(document).on('click', '#dflip_upload_bg_image,#dflip_upload_popupThumbPlaceholder,#dflip_upload_shelfImage', function (e) {
      e.preventDefault();
      uploadMedia({
        target: $(this).parent().find("input"),
        type: 'image',
        callback: function (src) {
          this.target.trigger("change");
        }
      });
    });
    jQuery(".df-upload-preview input").on("change", function () {
      let target = jQuery(this);
      let img = target.closest(".df-upload-preview").find(".df-upload-preview-thumb");
      // if (target.val().trim().length > 10) {
      if (img.length == 0) {
        img = jQuery("<div class='df-upload-preview-thumb'>").appendTo(target.closest(".df-upload-preview").find(".df-label"));
      }
      img.css({backgroundImage: "url(" + target.val() + ")"});
      // }
    });
    jQuery(".df-upload-preview input").each(function () {
      jQuery(this).trigger("change");
    });

    var thumbLoaded = false;

    function updateThumb(src) {
      if (thumbnailPreview)
        thumbnailPreview.find("img").attr("src", src);
      if (thumbnailPreview)
        thumbSrcInput.val(src);
      thumbnailPreview.toggleClass("df-empty-thumb", src == "");
      thumbLoaded = true;
      thumbAutoButton.removeClass("df-disabled");
      thumbAutoButton.html("Auto Generate PDF Thumb");
    }

    function updateThumbProgress(info) {
      if (!thumbLoaded)
        thumbAutoButton.html("Auto Generate PDF Thumb : " + info);
    }

    var getPDFThumb = void 0;
    if (window.DEARFLIP && window.DEARFLIP.getPDFThumb) getPDFThumb = window.DEARFLIP.getPDFThumb;
    if (getPDFThumb !== void 0) {
      thumbSrcInput = $("#dflip_pdf_thumb");
      var isAttachment = $("body").hasClass("post-type-attachment");
      var thumb_condition = isAttachment ? "" : " data-condition='dflip_pdf_source:contains(http)'";
      thumbAutoButton = $("<a href='#' class='df-button button button-secondary auto-thumb' "+thumb_condition+">Auto Generate PDF Thumb</a>").appendTo(thumbSrcInput.parent())
        .on("click", function (e) {
          e.preventDefault();
          var pdf_URL = isAttachment ? $("#attachment_url").val() : $("#dflip_pdf_source").val()
          getPDFThumb({
            pdfURL: pdf_URL,
            updateInfo: updateThumbProgress,
            callback: updateThumb
          });
          thumbLoaded = false;
          updateThumbProgress("Loading...");
          thumbAutoButton.addClass("df-disabled");
        });

      thumbnailPreview = $("<div id='thumb_preview'>")
        .data("option", DEARFLIP.openFileOptions)
        .on("click", function () {
          DEARFLIP.openFileOptions.source = $("#dflip_pdf_source").val();
          DEARFLIP.openFileOptions.viewerType = "flipbook";
        })
        .appendTo($("#dflip_pdf_thumb_box .df-upload"))
        .html("\n" +
          "        <div class='df-book-cover'>\n" +
          "            <img>\n" +
          "        </div>");

      updateThumb($("#dflip_pdf_thumb").val());
    }


    $(document).on('click', '.dflip-page-list-add', function (e) {
      e.preventDefault();
      var pageItem = pageList.find("." + pageEmptyItemClass);
      uploadMedia({
        target: pageItem.find("input"),
        type: 'image',
        multiple: true,
        callback: function (files) {
          for (var fileCount = 0; fileCount < files.length; fileCount++) {

            pageItem = pageList.find("." + pageEmptyItemClass).removeClass(pageEmptyItemClass).addClass(pageItemClass);
            var fileUrl = files.models[fileCount].attributes.url;
            pageItem.find("input").val(fileUrl);
            pageItem.find("." + pageThumbClass).attr("src", fileUrl);

            pageList.append(newPageItem({}, newPageIndex));
            newPageIndex++;
          }
        }
      });
    });


    function newPageItem(options, index) {

      var src = options.src || '',
        title = options.title || '',
        content = options.content || '',
        hotspot = options.hotspot || '';

      var li = $('<li class="' + pageEmptyItemClass + '" index="' + index + '">');
      var options = $('<div class="' + pageOptionsClass + '">');
      var img = $('<img class="' + pageThumbClass + '">');
      var url = $('<input type="text" name="_dflip[pages][' + index + '][url]" id="dflip-page-' + index + '-url"/>');

      li.append(img);
      li.append(options);
      options.append(url);

      createPageOptions(li);
      return li;
    }

    function createPageOptions(pageItem) {
      var
        container = $('<ul class="dflip-page-actions">'),
        image = $('<li class="dflip-page-image-action dashicons dashicons-format-image" title="Change Image">'),
        edit = $('<li class="dflip-page-edit-action dashicons dashicons-edit" title="Edit HotSpots">'),
        remove = $('<li class="dflip-page-remove-action dashicons dashicons-trash" title="Remove Page">');

      container.append(image);
      container.append(edit);
      container.append(remove);
      container.appendTo(pageItem);

    }

    $(document).on("click", ".dflip-page-remove-action", function () {
      var check = confirm("Delete the page!");
      if (check == true) {
        $(this).closest("." + pageItemClass).remove();
      }
    });
    $(document).on("click", ".dflip-page-edit-action", function () {
      var page = $(this).closest("." + pageItemClass);
      showPageModal(page);
    });

    $(document).on("click", ".dflip-outline-remove-action", function () {
      var check = confirm("Delete outline and its children!");
      if (check == true) {
        if ($(this).closest(".outline-node").siblings(".outline-node").length == 0) {
          $(this).closest(".outline-node").closest(".outline-node").removeClass("outline-haschild");
        }
        $(this).closest(".outline-node").remove();
      }
    });

    $(document).on("click", ".dflip-outline-add-action", function (event) {
      var node = $(this).closest(".outline-node");
      var container = node.find(">.outline-nodes");
      var prefix = node.data("prefix") + '[items]' + '[' + container.find(".outline-node").length + ']';

      addNode(container, prefix, {title: "", dest: ""});
      node.addClass("outline-haschild");
      event.stopPropagation();
    });

    $(document).on("click", ".outline-wrapper", function () {
      var current = $(".outline-active");
      var title = current.find(">.outline-wrapper > input[dtype='title']").val();
      var dest = current.find(">.outline-wrapper > input[dtype='dest']").val();
      var label = current.find(">.outline-wrapper > label").html(title + " : (" + dest + ")");
      current.removeClass("outline-active");

      $(this).closest(".outline-node").addClass("outline-active");
    });

    $(document).on("click", ".outline-collapse", function () {
      $(this).closest(".outline-node").toggleClass("outline-collapsed");
    });

    $(document).on("click", ".dflip-page-image-action", function () {
      var pageItem = $(this).closest("." + pageItemClass);
      uploadMedia({
        target: pageItem.find("input"),
        type: 'image',
        callback: function (url) {
          pageItem.find("." + pageThumbClass).attr("src", url);
        }
      });
    });

    initConditionals();

    createPageOptions($("." + pageItemClass));

    //create Outline
    if (window.dflip_flipbook_post_outline) {
      var data = window.dflip_flipbook_post_outline;
      data = revalidateArray(data, 'items');

      if (data.length == void 0 || data.length == 0)
        data = [];

      maxIndex = data.length;
      var addNodeBtn = $('<div class="add-outline-btn button button-primary">Add New Outline</div>').appendTo(outlineBox).on("click", function () {
        addNode(outlineBox, "_dflip[outline]" + '[' + maxIndex + ']', {title: "", dest: ""});
        maxIndex++;
      });
      nodeTree(outlineBox, data, "_dflip[outline]");

      dragEnable(outlineBox, ".outline-wrapper");
    }

    jQuery('#menu-posts-dflip a[href="https://dearflip.com/go/wp-lite-upgrade-menu"]').addClass("df-upgrade-menu").attr("target","_blank");

  });

  function revalidateArray(array, scan) {
    if (array == void 0) return array;

    var data = array;
    //convert to array
    if (array.length == void 0) {
      data = [];
      for (var prop in array) {
        data.push(array[prop]);
      }
    }
    //convert scan element to array
    for (var i = 0; i < data.length; i++) {
      if (data[i] !== void 0 && data[i][scan] !== void 0)
        data[i][scan] = revalidateArray(data[i][scan], scan)
    }

    return data;
  }

  function addNode(container, prefix, option) {
    var node = $('<div class="outline-node">').data("prefix", prefix),
      wrapper = $('<div class="outline-wrapper">'),
      label = $('<label></label>').text(option.title + " : (" + option.dest + ")"),
      title = $('<input name=' + prefix + '[title]" dtype="title" placeholder="Name of outline"/>').val(option.title),
      dest = $('<input name=' + prefix + '[dest]" dtype="dest" placeholder="pagenumber or url"/>').val(option.dest),
      nodes = $('<div class="outline-nodes">'),
      collapse = $('<div class="outline-collapse dashicons dashicons-arrow-down-alt2">'),

      actions = $('<ul class="dflip-outline-actions">'),
      add = $('<li class="dflip-outline-add-action dashicons dashicons-plus" title="Add Outline">'),
      remove = $('<li class="dflip-outline-remove-action dashicons dashicons-trash" title="Remove Outline">');

    wrapper.append(label);
    wrapper.append(title);
    wrapper.append(dest);
    wrapper.appendTo(node);

    node.append(wrapper);
    node.append(nodes);
    node.append(collapse);
    node.appendTo(container);

    actions.append(add);
    actions.append(remove);
    actions.appendTo(wrapper);

    if (option.items !== void 0) {
      node.addClass("outline-haschild");
      nodeTree(nodes, option.items, prefix + "[items]");
    }

    return node;
  }

  function nodeTree(container, options, prefix) {

    //var container = $(this);
    if (options !== void 0 && options.length > 0) {
      for (var i = 0; i < options.length; i++) {
        var option = options[i];

        var node = addNode(container, prefix + '[' + i + ']', option)

      }
    }
    return this;

  }

  var maxIndex = 0;

  function dragEnable(container, selector) {
    //var container = $(this);
    var helper = $('<div class="drag-helper">').appendTo(container).hide();
    var x, y,
      dx, dy,
      initX, initY,
      state,
      node,
      drag_type = '',
      startNode,
      mousedown = false,
      dragging = false;

    function update(e) {
      if (node == void 0) return;
      var _y = e.pageY - node.offset().top;
      document.title = _y.toString();
      var _drag_type = _y < 5
        ? "before"
        : _y > 27 ? "after" : "over";

      if (_drag_type !== drag_type) {
        drag_type = _drag_type;
        node.removeClass("has-drag-over has-drag-before has-drag-after").addClass("has-drag-" + drag_type);
      }
      helper.html("Insert " + drag_type + " " + node.find("label").html());
    }

    function checkChilds(node) {
      if (node.find(".outline-node").length > 0) {
        node.addClass("outline-haschild");
      }
      else {
        node.removeClass("outline-haschild");
      }
    }

    function revalidate(node, prefix) {
      var target;
      if (prefix == void 0) {
        //first find the parent.
        target = node.parents(".outline-node").first();
        if (target.length == 0) {
          //node was dropped to top level
          //increase index by 1
          maxIndex++;

          target = node;
          prefix = "_dflip[outline][" + maxIndex + "]";
          target.data("prefix", prefix);
          //update its node and continue to child
        }
        else {
          prefix = target.data("prefix");
          //continue as normal
        }
      }
      else {
        target = node;
        target.data("prefix", prefix);
      }

      target.find(" >.outline-wrapper >input").each(function () {
        var input = $(this);
        var name = input.attr("name");
        var type = input.attr("dtype");

        input.attr("name", prefix + "[" + type + "]")
      });

      var index = 0;
      target.find(" >.outline-nodes > .outline-node").each(function () {
        revalidate($(this), prefix + "[items][" + index + "]");
        index++;
      });
    }

    function drop() {
      if (startNode !== void 0 && node !== void 0 && drag_type !== '') {
        var _source = startNode.closest(".outline-node");
        var _target = node.closest(".outline-node");
        var oldParent = _source.parents(".outline-node");
        if (_source.has(_target).length > 0 || _source.is(_target)) {
          alert("Can't drop into child");
          return;
        }
        if (drag_type == "before") {
          _source.insertBefore(_target);
        }
        else if (drag_type == "over") {
          node.siblings(".outline-nodes").append(_source);
        }
        else if (drag_type == "after") {
          _source.insertAfter(_target);
        }
        checkChilds(oldParent);
        checkChilds(_source);
        checkChilds(_target);
        revalidate(_source);
      }
    }

    container
      .on("mousedown", function (e) {
        if (e.target.nodeName == "INPUT") return;
        startNode = $(e.target).closest(selector);
        if (e.button !== 0) return;
        if (startNode.length == 0) return;

        initX = e.pageX - $(this).offset().left;
        initY = e.pageY - $(this).offset().top;
        mousedown = true;
      })
      .on("mousemove", function (e) {
        if (!dragging && mousedown == true) {
          dx = e.pageX - $(this).offset().left - initX;
          dy = e.pageY - $(this).offset().top - initY;

          if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            dragging = true;
            helper.show();
            container.addClass("has-dragging");
            startNode.addClass("is-drag-source");
          }
        }
        if (dragging) {
          x = e.pageX - $(this).offset().left;
          y = e.pageY - $(this).offset().top;
          helper.css({
            left: x - 20,
            top: y + 15
          });
          update(e);
        }
      });

    $(window)
      .on("mouseup", function (e) {
        container.removeClass("has-dragging");
        if (startNode) startNode.removeClass("is-drag-source");

        if (node && dragging == true) {
          node.removeClass("has-drag-over has-drag-before has-drag-after");
          drop();
        }
        dragging = false;
        mousedown = false;
        helper.hide();

        node = null;
        startNode = null;

      });

    container
      .on("mouseover", selector, function (e) {
        if (mousedown == true) {
          if (node)
            node.removeClass("has-drag-over has-drag-before has-drag-after");
          node = $(this);
        }
        if (dragging == true && node) {
          update(e);
          node.addClass("has-drag-over");
        }
      })
  }

  var pageModal;
  var activePage;
  var activeSpot;

  function showPageModal(page) {

    function createSpots(index) {
      var spot = $('<input class="dflip-hotspot-input" name="_dflip[pages][' + activePage.attr('index') + '][hotspots][' + index + ']" />');
      spot.val("[30,30,30,30,]");
      return spot;
    }

    if (pageModal == void 0) {

      pageModal = $('<div class="dflip-page-modal media-modal">');

      var modalContent = $('<div class="media-modal-content edit-attachment-frame ">'),
        frameContent = $('<div class="media-frame-content">'),
        header = $('<div class="edit-media-header">'),
        next = $('<div class="page-modal-next right dashicons">'),
        prev = $('<div class="page-modal-prev left dashicons">'),
        close = $('<div class="page-modal-close media-modal-close"><span class="media-modal-icon"></span></div>'),

        subHeader = $('<div class="dflip-hotspot-header">'),
        addHotspot = $('<div class="dflip-add-hotspot button button-primary">Add Hot-Spot</div>'),
        del = $('<div class="dflip-remove-hotspot button button-secondary">Remove Hot-Spot</div>'),
        dest = $('<input class="dflip-hotspot-dest" placeholder="Enter page number or url with http:\\\\"></div>'),
        divImage = $('<div class="page-modal-image-wrapper">'),
        image = $('<img class="page-modal-image">'),
        content = $('<input class="page-modal-html" >');

      pageModal.divImage = divImage;
      pageModal.image = image;
      pageModal.content = content;
      pageModal.dest = dest;

      next.on("click", function () {
        var next = activePage.next();
        if (next.length > 0 && next.hasClass("dflip-page-item")) {
          showPageModal(next);
        }
      });
      prev.on("click", function () {
        var prev = activePage.prev();
        if (prev.length > 0 && prev.hasClass("dflip-page-item")) {
          showPageModal(prev);
        }
      });
      close.on("click", function () {
        pageModal.hide();
      });
      dest.on("change", function () {
        if (spotHelper._hotspot !== void 0) {
          spotHelper._hotspot.dest = $(this).val();
          spotHelper._hotspot.update();
        }
      });
      del.on("click", function () {
        var _del = confirm("Delete hotspot?");
        if (_del == true) {
          spotHelper._hotspot.dispose(true);
          spotHelper.detach();
        }
        dest.val("");
      });
      addHotspot.on("click", function () {
        var spots = activePage.find(".dflip-hotspot-input");

        var spotindex = activePage.attr('hotspots');
        if (spotindex == void 0) {
          spotindex = activePage.find(".dflip-hotspot-input").length;
        }
        var _hotspotInput = createSpots(spotindex);
        spotindex++;
        activePage.attr('hotspots', spotindex);
        activePage.find(".dflip-page-options").append(_hotspotInput);
        var _hotspot = new HotSpot([40, 40, 20, 20, ''], pageModal.divImage);
        _hotspot.activate(spotHelper);
        _hotspot.target = _hotspotInput;
      });
      divImage.append(image);
      subHeader.append(addHotspot);
      subHeader.append(dest);
      subHeader.append(del);
      frameContent.append(subHeader);
      frameContent.append(divImage);
      header.append(prev);
      header.append(next);
      modalContent.append(header);
      modalContent.append(frameContent);
      pageModal.append(close);
      pageModal.append(modalContent);
      pageModal.appendTo($("#dflip_pages_box"));

    }
    pageModal.show();
    pageModal.dest.val("");
    var src = page.find(".dflip-page-thumb").attr("src");
    pageModal.image.attr("src", src);

    //clear old hotspots
    if (activePage != void 0 && activePage.hotspots != void 0) {
      for (var h = 0; h < activePage.hotspots.length; h++) {
        activePage.hotspots[h].dispose();
      }
    }

    activePage = page;

    if (page.hotspots == void 0)
      page.hotspots = [];
    //fallback clearance
    if (spotHelper !== void 0)
      spotHelper._el.hide();
    pageModal.find(".dflip-hotspot").remove();

    var hotspots = [];
    page.find(".dflip-hotspot-input").each(function (index) {
      hotspots[index] = $(this).val().substr(1).slice(0, -1).split(",");
      var spot = new HotSpot(hotspots[index], pageModal.divImage);
      spot.target = $(this);
      page.hotspots[index] = spot;
    });

  }

  //[160, 105, 250, 30, 2]
  var HotSpot = function (option, parent) {
    var _this = this;
    _this.left = option[0],
      _this.top = option[1],
      _this.width = option[2],
      _this.height = option[3],
      _this.dest = option[4],
      _this.ref = parent.find("img.page-modal-image");

    _this._el = $('<div class="dflip-hotspot">');

    parent.append(_this._el);
    _this.update();
    _this._el
      .on("click", function () {
        _this.activate(spotHelper);
      });
  };

  HotSpot.prototype.activate = function (helper) {
    helper.attach(this);
    pageModal.dest.val(this.dest);
  };
  HotSpot.prototype.deactivate = function (helper) {

  };
  HotSpot.prototype.dispose = function (removeTarget) {
    this._el.off();
    this._el.remove();
    if (removeTarget == true && this.target !== void 0) {
      this.target.remove();
    }
  };
  HotSpot.prototype.updateSize = function (size) {
    this.width = Math.round(10000 * size.width / this.ref.width()) / 100;
    this.height = Math.round(10000 * size.height / this.ref.height()) / 100;
  };
  HotSpot.prototype.updatePosition = function (position) {
    this.left = Math.round(10000 * position.left / this.ref.width()) / 100;
    this.top = Math.round(10000 * position.top / this.ref.height()) / 100;
    this.update();
  };
  HotSpot.prototype.update = function () {
    this._el.css({
      left: this.left + "%",
      top: this.top + "%",
      width: this.width + "%",
      height: this.height + "%"
    });
    if (this.target !== void 0) {
      this.target.val('[' + this.left + ',' + this.top + ',' + this.width + ',' + this.height + ',' + this.dest + ']');
    }
  };


  var SpotHelper = function () {
    var _this = this;
    _this.initialized = false;
    _this._hotspot = void 0;
    if ($.fn.draggable) {
      _this._el = $('<div class="dflip-hotspot-helper">')
        .draggable({
          containment: "parent",
          drag: function (event, ui) {
            _this._hotspot.updatePosition(ui.position);
          }
        });
    }
    else {
      _this._el = void 0;
      //console.log("Could not load jQuery draggable")
    }

  };
  SpotHelper.prototype.attach = function (hotspot) {
    var _this = this;
    if (_this._hotspot !== void 0)
      _this._hotspot.deactivate();


    _this._hotspot = hotspot;
    _this.container = hotspot._el.parent();
    _this.container.append(_this._el);

    if (_this.initialized != true) {
      _this._el.resizable({
        handles: 'ne, se, sw, nw',
        resize: function (event, ui) {
          _this._hotspot.updateSize(ui.size);
          _this._hotspot.updatePosition(ui.position);
        }
      });
      _this.initialized = true;
    }

    _this._el.css({
      left: hotspot._el[0].style.left,
      top: hotspot._el[0].style.top,
      width: hotspot._el[0].style.width,
      height: hotspot._el[0].style.height,
      display: "block"
    });
    //_this._hotspot.activate(this);
  };
  SpotHelper.prototype.detach = function (hotspot) {
    if (this._hotspot !== void 0)
      this._hotspot.deactivate();
    this._el.hide();
  };
  var spotHelper = new SpotHelper();

  /*({
   backgroundImage:"url(" + src+")"
   });*/
})(jQuery);
