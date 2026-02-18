/**
 * @file
 * Contains views_ajax_history.js.
 */

(function ($) {

  // Need to keep this to check if there are extra parameters in the original URL.
  var original = {
    path: window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '') + window.location.pathname,
    // @TODO integrate #1359798 without breaking history.js
    query: window.location.search || ''
  };

  window.onpageshow = function (event) {
    if (event.persisted) {
      window.location.reload()
    }
  };

  Backdrop.viewsAjaxHistory = Backdrop.viewsAjaxHistory || {};

  /**
   * Keep the original beforeSubmit method to use it later.
   */
  Backdrop.viewsAjaxHistory.beforeSubmit = Backdrop.ajax.prototype.beforeSubmit;

  /**
   * Keep the original beforeSerialize method to use it later.
   */
  Backdrop.viewsAjaxHistory.beforeSerialize = Backdrop.ajax.prototype.beforeSerialize;

  /**
   * Keep the original beforeSend method to use it later.
   */
  Backdrop.viewsAjaxHistory.beforeSend = Backdrop.ajax.prototype.beforeSend;

  Backdrop.behaviors.viewsAjaxHistory = {
    attach: function (context, settings) {
      // Init the current page too, because the first loaded pager element do
      // not have loadable history and will not work the back button.
      var $body = $('body').once('views-ajax-history-first-page-load');
      if ($body.length) {
        settings.viewsAjaxHistory.onloadPageItem = settings.viewsAjaxHistory.renderPageItem;
      }
    }
  };

  /**
   * Modification of Backdrop.Views.parseQueryString() to allow extracting multi-values fields.
   *
   * @param query
   *   String, either a full url or just the query string.
   */
  var parseQueryString = function (query) {
    var args = {};
    var pos = query.indexOf('?');
    if (pos != -1) {
      query = query.substring(pos + 1);
    }
    var pairs = query.split('&');
    var pair, key, value;
    for (var i in pairs) {
      if (typeof(pairs[i]) == 'string') {
        pair = pairs[i].split('=');
        // Ignore the 'q' path argument, if present.
        if (pair[0] != 'q' && pair[1]) {
          key = decodeURIComponent(pair[0].replace(/\+/g, ' '));
          value = decodeURIComponent(pair[1].replace(/\+/g, ' '));
          // Field name ends with [], it's multi-values.
          if (/\[\]$/.test(key)) {
            if (!(key in args)) {
              args[key] = [value];
            }
            // Don't duplicate values.
            else if (!$.inArray(value, args[key]) !== -1) {
              args[key].push(value);
            }
          }
          else {
            args[key] = value;
          }
        }
      }
    }
    return args;
  };

  /**
   * Strip views values and duplicates from URL.
   *
   * @param url
   *   String with the full URL to clean up.
   * @param viewArgs
   *   Object containing field values from views.
   *
   * @return url
   *   String URL with views values and reduced duplicates.
   */
  var cleanURL = function (url, viewArgs) {
    var args = ('reset' in viewArgs) ? {} : parseQueryString(url);
    var query = [];

    // With clean urls off we need to add the 'q' parameter.
    if (/\?/.test(Backdrop.settings.views.ajax_path)) {
      query.push('q=' + Backdrop.Views.getPath(url));
    }

    $.each(args, function (name, value) {
      // Use values from viewArgs if they exists.
      if (name in viewArgs) {
        value = viewArgs[name];
      }
      if (Array.isArray(value)) {
         $.merge(query, $.map($.uniqueSort(value), function (sub) {
           return encodeURIComponent(name) + '=' + encodeURIComponent(sub);
         }));
      }
      else {
        query.push(encodeURIComponent(name) + '=' + encodeURIComponent(value));
      }
    });

    url = window.location.href.split('?');
    return url[0] + (query.length ? '?' + query.join('&') : '');
  };

  /**
   * Remove the functions from the state. They can't be pushed into the history.
   *
   * @param state
   *  Object containing the state to be cleaned.
   *
   * @return state
   *  Object that has been cleaned up.
   */
  var cleanStateForHistory = function (state) {
    var stateWithNoFunctions = {};
    for (var key in state) {
      if (typeof state[key] !== "function") {
        stateWithNoFunctions[key] = state[key];
      }
    }
    return stateWithNoFunctions;
  };

  /**
   * Parse a URL query string.
   *
   * @param queryString
   *   String containing the query to parse.
   */
  var parseQuery = function (queryString) {
    var query = {};
    $.map(queryString.split('&'), function (val) {
      var s = val.split('=');
      query[s[0]] = s[1];
    });
    return query;
  };

  /**
   * Unbind 'popstate' when adding a new state to avoid an infinite loop.
   *
   * We only use the 'popstate' event to trigger refresh on back or forward click.
   *
   * @param options
   *   Object containing the values from views' AJAX call.
   * @param url
   *   String with the current URL to be cleaned up.
   */
  var addState = function (options, url) {
    // The data in the history state must be serializable.
    var historyOptions = $.extend({}, options);

    // Store the actual view's dom id.
    Backdrop.settings.viewsAjaxHistory.lastViewDomID = options.data.view_dom_id;
    $(window).unbind('popstate', loadView);
    history.pushState(cleanStateForHistory(historyOptions), document.title, cleanURL(url, options.data));
    $(window).bind('popstate', loadView);
  };

  /**
   * Make an AJAX request to update the view when navigating back and forth.
   */
  var loadView = function () {
    var options;

    // This should be the first loaded page, so init the options object.
    if (history.state === null) {
      var viewsAjaxSettingsKey = 'views_dom_id:' + Backdrop.settings.viewsAjaxHistory.lastViewDomID;
      if (Backdrop.settings.views.ajaxViews.hasOwnProperty(viewsAjaxSettingsKey)) {
        var viewsAjaxSettings = Backdrop.settings.views.ajaxViews[viewsAjaxSettingsKey];
        var initialExposedInput = Backdrop.settings.viewsAjaxHistory.initialExposedInput[viewsAjaxSettingsKey];
        $.extend(viewsAjaxSettings,initialExposedInput);
        viewsAjaxSettings.page = Backdrop.settings.viewsAjaxHistory.onloadPageItem;
        options = {
          data: viewsAjaxSettings,
          url: Backdrop.settings.views.ajax_path
        };
      }
    }
    else {
      options = history.state;
    }

    // Need a dummy element to trigger Backdrop's AJAX call.
    var $dummy = $('<div class="ajaxHistoryDummy"/>');

    // Backdrop's AJAX options.
    var settings = $.extend({
      submit: options.data,
      setClick: true,
      event: 'click',
      selector: '.view-dom-id-' + options.data.view_dom_id,
      progress: { type: 'throbber' },
      httpMethod: 'GET',
    }, options);

    new Backdrop.ajax(false, $dummy[0], settings);
    // Trigger ajax call.
    // @todo check there is no leak, $dummy is never destroyed.
    $dummy.trigger('click');
  };

  /**
   * Override beforeSerialize to handle click on pager links.
   *
   * @param $element
   *   jQuery DOM element
   * @param options
   */
  Backdrop.ajax.prototype.beforeSerialize = function (element, options) {
    if (options.data.view_name) {
      // If restoring a previous state the dummy element will have this class,
      // don't need to go through all this processing.
      if ($(element).hasClass('ajaxHistoryDummy')) {
        return;
      }
    }

    // Check that we handle a click on a link, not a form submission.
    if (options.data.view_name && element && $(element).is('a')) {
      let params = new URLSearchParams($(element).attr('href'));
      if (!$.isEmptyObject(Backdrop.settings.viewsAjaxHistory.excludeArgs)) {
        var keysToRemove = [];
        $.each(Backdrop.settings.viewsAjaxHistory.excludeArgs, function (index, pathToExclude) {
          params.forEach(function (value, key, parent) {
            if (key.startsWith(pathToExclude)) {
              keysToRemove.push(key);
            }
          });
        });
        keysToRemove.forEach(function (key) {
          params.delete(key)
        });
      }
      addState(options, '?' + params.toString());
    }

    // Call the original Backdrop method with the right context.
    Backdrop.viewsAjaxHistory.beforeSerialize.apply(this, arguments);
  };

  /**
   * Override beforeSubmit to handle exposed form submissions.
   *
   * @param form_values
   *   Object with all field values.
   * @param element
   *   jQuery DOM form element.
   * @param options
   *   Object containing AJAX options.
   */
  Backdrop.ajax.prototype.beforeSubmit = function (form_values, element, options) {
    if (options && options.data && options.data.view_name) {
      var url = original.path + '?' + new URLSearchParams(new FormData(element.get(0))).toString();
      var currentQuery = parseQueryString(window.location.href);

      // Prepare ajax url
      var ajaxUrl = options.url.split('?')[0];
      var ajaxQuery = parseQueryString(options.url);

      // Remove the page number from the query string, as a new filter has been
      // applied and should return new results.
      if ($.inArray("page", Object.keys(currentQuery)) !== -1) {
        delete currentQuery.page;
        delete ajaxQuery.page;
      }

      // Copy selected values in history state.
      $.each(form_values, function () {
        // Field name ending with [] is a multi value field.
        if (/\[\]$/.test(this.name)) {
          if (!options.data[this.name]) {
            options.data[this.name] = [];
          }
          options.data[this.name].push(this.value);
        }
        // Regular field.
        else {
          options.data[this.name] = this.value;
        }
      });
      // Remove exposed data from the current query to leave behind any
      // non exposed form related query vars.
      element.find('[name]').each(function () {
        let name = this.name ?? this.getAttribute('name');
        if (currentQuery[name]) {
          delete currentQuery[name];
          delete ajaxQuery[name];
        }
      });

      // If the exposed form has checkboxes, we need to check if these are
      // unchecked and if so, remove them from the url
      element.find('input[type="checkbox"]').each(function (key, value) {
        if (!form_values[this.name]) {
          if (currentQuery[this.name]) {
            delete currentQuery[this.name];
          }
          else if (options.data[this.name]) {
            delete options.data[this.name];
          }
          if (ajaxQuery[this.name]) {
            delete ajaxQuery[this.name];
          }
        }
      });

      // Helper function to remove multi-value query keys that match a given
      // name
      let removeMultiValueQueryKeys = function (multiValueParamToRemove, queryParams) {
        Object.getOwnPropertyNames(queryParams).forEach(function (queryKey) {
          let queryKeyWithoutBracket = queryKey.replace(/\[\d+]$/, '');
          if (multiValueParamToRemove === queryKeyWithoutBracket) {
            delete queryParams[queryKey];
          }
        });
        return queryParams;
      };

      // If the exposed form has a multiple select.
      element.find('select[multiple]').each(function (key, value) {
        if ($(value).val().length === 0) {
          delete options.data[this.name];
          delete currentQuery[this.name];
          delete ajaxQuery[this.name];
        }
        // Pagers creates query params that are indexed like this:
        // ?someparam[0]=123,someparam[1]=456
        // instead of this:
        // ?someparam[]=123&someparam[]=456
        // We need to clear them out. The submitted form values will use the
        // non-indexed versions, and we can't have the indexed versions creating
        // a conflict.
        let nameWithoutBracket = this.name.replace(/\[]$/, '');
        currentQuery = removeMultiValueQueryKeys(nameWithoutBracket, currentQuery);
        ajaxQuery = removeMultiValueQueryKeys(nameWithoutBracket, ajaxQuery);
      });

      url += (/\?/.test(url) ? '&' : '?') + $.param(currentQuery);
      // Update options with updated ajax url.
      options.url = ajaxUrl + '?' + $.param(ajaxQuery);
      addState(options, url);
    }
    // Call the original Backdrop method with the right context.
    Backdrop.viewsAjaxHistory.beforeSubmit.apply(this, arguments);
  };

  /**
   * Override beforeSend to clean up the Ajax submission URL.
   *
   * @param {XMLHttpRequest} xmlhttprequest
   *   Native Ajax object.
   * @param {object} options
   *   jQuery.ajax options.
   */
  Backdrop.ajax.prototype.beforeSend = function (xmlhttprequest, options) {
    var data = (typeof options.data === 'string') ? parseQuery(options.data) : {};

    if (data.view_name && options.type !== 'GET') {
      // Override the URL to not contain any fields that were submitted.
      options.url = Backdrop.settings.views.ajax_path;
    }
    // Call the original Backdrop method with the right context.
    Backdrop.viewsAjaxHistory.beforeSend.apply(this, arguments);
  }

})(jQuery);
