//spa.shell.js

/*jslint           browser : true, continue : true,
  devel    : true, indent  : 2,    laxbreak : true,
  maxerr   : 50,   newcap  : true, nomen    : true,
  plusplus : true,  regexp : true,  sloppy  : true,
  vars     : false,
  white    : true
*/
/*global $, spa */

spa.shell = (function () {
  var
    configMap = {
      anchor_schema_map : {
        chat : {opened: true, closed: true}
      },
      resize_interval : 2000,
      main_html : String()
        + '<div class="spa-shell-head">'
          + '<div class="spa-shell-head-logo"></div>'
          + '<div class="spa-shell-head-acct"></div>'
          + '<div class="spa-shell-head-search"></div>'
        + '</div>'
        + '<div class="spa-shell-main">'
          + '<div class="spa-shell-main-nav"></div>'
          + '<div class="spa-shell-main-content"></div>'
        + '</div>'
        + '<div class="spa-shell-foot"></div>'
        + '<div class="spa-shell-modal"></div>'
    },
    stateMap  = {
      $container : null,
      anchor_map: {},
      resize_idto : undefined
    },
    jqueryMap = {},
    copyAnchorMap,
    setJqueryMap,
    changeAnchorPart,
    onHashChange,
    onResize,
    initModule,
    setChatAnchor;

//-------------------- BEGIN UTILITY METHODS -----------------
  copyAnchorMap = function() {
    return $.extend(true, {}, stateMap.anchor_map);
  };

//--------------------- BEGIN DOM METHODS --------------------
  setJqueryMap = function(){
    var $container = stateMap.$container;
    jqueryMap = {$container : $container};
  };

  /* DOM method /changeAnchorPart/
  // Purpose : Changes part of the URI anchor component
  // Arguments:
  // * arg_map - The map describing what part of the URI anchor
  // we want changed.
  // Returns : boolean
  // * true - the Anchor portion of the URI was update
  // * false - the Anchor portion of the URI could not be updated
  // Action :
  // The current anchor rep stored in stateMap.anchor_map.
  // See uriAnchor for a discussion of encoding.
  // This method
  // * Creates a copy of this map using copyAnchorMap().
  // * Modifies the key-values using arg_map.
  // * Manages the distinction between independent
  // and dependent values in the encoding.
  // * Attempts to change the URI using uriAnchor.
  */
  changeAnchorPart = function (arg_map) {
    var
      anchor_map_revise = copyAnchorMap(),
      bool_return = true,
      key_name, key_name_dep;

    KEYVAL:
    for ( key_name in arg_map ) {
      if ( arg_map.hasOwnProperty(key_name) ) {
        //skip dependent keys during iteration
        if ( key_name.indexOf('_') === 0 ) { continue KEYVAL; }
        //update independent key value
        anchor_map_revise[key_name] = arg_map[key_name];
        //update matching dependent key
        key_name_dep = '_' + key_name;
        if ( arg_map[key_name_dep] ) {
          anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
        }
        else {
          delete anchor_map_revise[key_name_dep];
          delete anchor_map_revise['_s' + key_name_dep];
        }
      }
    }

    // Attempt to update URI; revert if not successful
    try {
      $.uriAnchor.setAnchor(anchor_map_revise);
    }
    catch(error) {
      // replace URI with existing state
      $.uriAnchor.setAnchor(stateMap.anchor_map, null, true);
      bool_return = false;
    }
    return bool_return;
  }; //end changeAnchorPart()

//------------------- BEGIN EVENT HANDLERS -------------------
  /* Begin Event handler /onHashchange/
  // Purpose : Handles the hashchange event
  // Arguments:
  // * event - jQuery event object.
  // Settings : none
  // Returns : false
  // Action :
  // * Parses the URI anchor component
  // * Compares proposed application state with current
  // * Adjust the application only where proposed state
  // differs from existing
  */
  onHashchange = function (event) {
    var
      _s_chat_previous, _s_chat_proposed, s_chat_proposed,
      anchor_map_proposed,
      is_ok = true,
      anchor_map_previous = copyAnchorMap();

    //attempt to parse anchor
    try { anchor_map_proposed = $.uriAnchor.makeAnchorMap(); }
    catch(error) {
      $.uriAnchor.setAnchor(anchor_map_previous, null, true);
    }
    stateMap.anchor_map = anchor_map_proposed;

    // convenience vars
    _s_chat_previous = anchor_map_previous._s_chat;
    _s_chat_proposed = anchor_map_proposed._s_chat;

    // Adjust chat component if changed
    if ( ! anchor_map_previous || _s_chat_previous !== _s_chat_proposed ) {
      s_chat_proposed = anchor_map_proposed.chat;
      switch ( s_chat_proposed ) {
        case 'opened' :
          is_ok = spa.chat.setSliderPosition('opened');
          break;
        case 'closed' :
          is_ok = spa.chat.setSliderPosition('closed');
          break;
        default :
          spa.chat.setSliderPosition('closed');
          delete anchor_map_proposed.chat;
          $.uriAnchor.setAnchor( anchor_map_proposed, null, true);
      }
    }

    //revert anchor if slider change denied
    if ( ! is_ok ) {
      if ( anchor_map_previous ) {
        $.uriAnchor.setAnchor(anchor_map_previous, null, true);
        stateMap.anchor_map = anchor_map_previous;
      } else {
        delete anchor_map_proposed.chat;
        $.uriAnchor.setAnchor(anchor_map_proposed, null, true);
      }
    }
    return false;
  }; //end onHashChange()

  onResize = function() {
    console.log('x');
    //run only if no other element is being resized
    if ( stateMap.resize_idto ) { return true; }
    console.log('xxxxxxx');
    spa.chat.handleResize();
    stateMap.resize_idto = setTimeout(
      function() { stateMap.resize_idto = undefined; },
      configMap.resize_interval
    );
    return true;
  };

//---------------------- BEGIN CALLBACKS ---------------------
  /* callback method /setChatAnchor/
  // Example  : setChatAnchor('closed');
  // Purpose  : Change the chat component of the anchor
  // Arguments:
  //   * position_type - may be 'closed' or 'opened'
  // Action   :
  //   Changes the URI anchor parameter 'chat' to the requested
  //   value if possible.
  // Returns  :
  //   * true  - requested anchor part was updated
  //   * false - requested anchor part was not updated
  // Throws   : none
  */
  setChatAnchor = function(position_type){
    return changeAnchorPart({chat : position_type });
  };

//------------------- BEGIN PUBLIC METHODS -------------------
  /* Public method /initModule/
  // Example   : spa.shell.initModule( $('#app_div_id') );
  // Purpose   : Directs the Shell to offer its capability to the user
  // Arguments : * $container (example: $('#app_div_id')).
  // Action    :
  //   Populates $container with the shell of the UI
  //   and then configures and initializes feature modules.
  //   The Shell is also responsible for browser-wide issues
  //   such as URI anchor and cookie management
  */
  initModule = function($container){
     // load HTML and map jQuery collections
    stateMap.$container = $container;
    $container.html(configMap.main_html);
    setJqueryMap();

    // configure uriAnchor to use our schema
    $.uriAnchor.configModule({
      schema_map : configMap.anchor_schema_map
    });

    //configure and initialize feature modules
    spa.chat.configModule({
      set_chat_anchor : setChatAnchor,
      chat_model : spa.model.chat,
      people_model : spa.model.people
    });
    spa.chat.initModule(jqueryMap.$container);

    /* Handle URI anchor change events.
    // This is done /after/ all feature modules are configured
    // and initialized, otherwise they will not be ready to handle
    // the trigger event, which is used to ensure the anchor
    // is considered on-load
    */
    $(window)
      .bind('resize', onResize)
      .bind('hashchange', onHashchange)
      .trigger('hashchange');
  };

  return { initModule : initModule };
}());
