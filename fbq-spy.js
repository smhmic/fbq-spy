/**
 * Listens for data passed to Facebook's fbevents.js' `fbq()` API ("pixels").
 * Allows one to piggyback on, modify, and/or block Facebook web pixels without 
 *   modifying the source tracking directly. 
 *   
 *  Example use cases:
 *   - Use TMS to make interim enhancements to hardcoded/third-party tracking.
 *   - Upgrade all FB web pixels at once to support CAPI
 *
 * @author Stephen M Harris <smhmic@gmail.com>
 * @version 1.0
 */

/**
 * @callback fbqSpyCb 
 * Function to call whenever `fbq()` is called.
 * @param {Object} data  - Provides original and parsed command arguments.
 *   @param {Array}  data.args - Arguments passed to `fbq()`.
 *   @param {Object} data.the  - Object listing all passed fields by name.
 *     @param   {string}           data.the.command    - the first argument (init, track, etc)
 *     @param   {string|undefined} data.the.eventName  - only for track and trackCustom commands
 *     @param   {Object}           data.the.parameters - merge of all passed objects
 *     @param   {string|undefined} data.the.parameters.* 
 * @return {boolean|*} - Return false to prevent command from being passed to fbevents.js.
 */

/** 
 * @function fbqSpy - Listener for commands passed to fbevents.js.
 * @param {Object|function} listenerCallback_or_configObj - If function, will be treated as `callback` of 
 *                                                          listener config, otherwise listener config object.
 *     @property {fbqSpyCb}  callback  - Function to call whenever `fbq()` is called.
 *     @property {string}   fbqObjName - The name of the global fbq object. Default: "fbq".
 * 	   @property {boolean}  debug     - Set true to activate logging and avoid try/catch protection. Default: false.
 *     @property {boolean}  debugLogPrefix - String with which to prefix log messages. Default: "fbqSpy".
 */
;window.fbqSpy = window.fbqSpy || function fbqSpy( listenerCallback_or_configObj ){
  
  /** Listener configuration. **/
  var config = (function( config ){
    listenerCallback_or_configObj = null;
    config.debugLogPrefix = config.debugLogPrefix || 'fbqSpy';
    config.debug = !!config.debug;
    if( !config.callback || 'function' !== typeof config.callback ){
      if( config.debug )
        throw new Error( '[' + config.debugLogPrefix + '] Aborting; No listener callback provided.' );
      config.callback = function(){};
    }
    config.fbqObjName = config.fbqObjName || 'fbq';
    return config;
  })('function' === typeof listenerCallback_or_configObj
    ? { 'callback' : listenerCallback_or_configObj }
    : listenerCallback_or_configObj ),
   
  /** The name of the global fbq object. */
  fbqObjName = config.fbqObjName,
  
  /** The global fbq object. */
  fbq = window[fbqObjName],

  /** Log to `console` (if supported by browser). */
  log = window.console && config.debug
    ? function(){var a=[].slice.call(arguments);a.unshift('['+config.debugLogPrefix+']');console.log.apply(console,a)} 
    : function(){},

  /**
   * @function processArgs
   * Processes each set of arguments passed to `fbq()`.
   * @param   {Array} a - Array of arguments passed to `fbq()`.
   * @returns {boolean} - Returns false to indicate this command should be blocked.
   */
  processArgs = function( a ){
    var _commandParts, i, k, ev = { args:a, the:{} }, the = ev.the, 
        argFields = 'object' === typeof a[a.length-1] ? a[a.length-1] : {};
    config.debug && (function(l,i){
      for( l='Intercepted: fbq(',i=0; i<a.length; i++ ){
        l += 'string' === typeof a[i] ? '"'+a[i]+'"' : a[i];
        if( i+1<a.length ) l += ', ';
      }
      l += ')';
      log(l);
    })();
    
    // No known documentation, but 
    // init addPixelId set track trackCustom send on loadPlugin endpoint releaseSegment proxy autoConfig experiments
    the.command = a[0];
    
    if( 'track'=== the.command || 'trackCustom'=== the.command )
      the.eventName = a[0];
    
    the.parameters = {};
    for( i=0; i<a.length; i++ )
      if( a[i] && typeof a[i] === 'object' )
        for( k in a[i] )
          if( a[i].hasOwnProperty(k) )
            the.parameters[k] = a[i][k];
      
    
    log( 'Run listener callback', the );
    if( false === config.callback( ev ) )
      return false;
    else return true;
  },
      
  /**
   * @function proxy
   * The function that will replace `fbq()`.  Passes arguments to processArgs; if
   *   processArgs returns false also passes arguments to `fbq()`.
   * @member  {Object} fbqOrig - The original `fbq()` object.
   */
  proxy = function(){
    var a = [].slice.call( arguments );
    if( config.debug ){ 
      if( ! processArgs( a ) ) return log( 'Command blocked.' ); 
    }else{ try{ 
      if( ! processArgs( a ) ) return; 
    }catch(ex){}}
    log( 'Command allowed:', a );
    return proxy._fbqOrig.apply( proxy._fbqOrig, a );
  },
      
  /** 
   * @function hijack
   * Replaces global FB command queue with a proxy. Assumes global object exists.
   */
  hijack = function(){
    // The current global FB queue. Could be the command queue or the loaded FB queue.
    // TODO: should we always preserve fbqOrig to be actual orig, not just previous? (i.e. if fbqSpy was loaded twice)
    var k, fbqOrig = proxy._fbqOrig = window[fbqObjName];
    log( 'Hijack', fbqOrig._fbqOrig ? '(already hijacked)' : '' );
    // Replace FB queue with a proxy.
    window[fbqObjName] = proxy;
    // Maintain references to FB's public interface. 
    for( k in fbqOrig )
      if( fbqOrig.hasOwnProperty( k ) )
        window[fbqObjName][k] = fbqOrig[k] === fbqOrig ? proxy : fbqOrig[k];
  },
      
  /** Presence of this method on `fbq` indicates the library is loaded (the same 
    * check used in Facebook's standard pixel embed code). */
  hintFbqMethod = 'callMethod',
      
  q, i;
    
  log( 'Config:', config );
    
  if( !fbq ){ // Instantiate FB command queue a la UA snippet.
    log( 'Instantiating FB command queue' );
    fbq = window[fbqObjName] = window._fbq = function(){ 
      fbq[hintFbqMethod] ? fbq[hintFbqMethod].apply( fbq, arguments ) : fbq.queue.push( arguments )
    };
    fbq.push = fbq;
    fbq.loaded = !0;
    fbq.version = '2.0';
    fbq.queue = [];
  }

  if( fbq[hintFbqMethod] ){
    log( 'Loaded after fbevents.js; cannot see previous commands' );
    hijack();
  } else if( fbq.queue ){
    log( 'Command queue instantiated, but library not yet loaded' );
    if( fbq.queue.length ){
      log( 'Applying listener to',fbq.queue.length,' queued commands' );
      for( q = [], i = 0; i < fbq.queue.length; i++ )
        if( processArgs( [].slice.call( fbq.queue[i] ) ) )
          q.push( fbq.queue[i] );
      fbq.queue = q;
    } else { fbq.queue = []; }
    
    // If fbevents.js updates to replace the`fbq` object, we'd put a the trap to re-hijack here.
    //fbq_loaded_callback( hijack ); 
    
    hijack(); // Hijack the command queue.
    
  } else if( config.debug ) {
    throw new Error( '['+config.debugLogPrefix+'] Aborting; `'+fbqObjName+'` is not the FB command queue.' );
  }

};



