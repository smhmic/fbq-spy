# Facebook Pixel Spy

_a.k.a. fbq-spy or Facebook Queue Spy_

This lightweight library allows listening, modifying, and blocking data tracked through Facebook's pixels. 
  
This works with implementations that follow Facebook's reccomendations, using the [fbevents.js](https://connect.facebook.net/en_US/fbevents.js) library and `fbq` command queue API.  (While not officially supported by Facebook, this library was deemed a viable solution by Facebook engineers as of 2021-9-16 — specifically to [prepare web pixels for CAPI support](https://github.com/smhmic/fbq-spy/blob/master/README.md#upgrade-fb-pixels-for-capi-compatibility)).

The methodology is little more than a proxy pattern. For a detailed walkthrough, see [this walkthrough](https://www.simoahava.com/analytics/introducing-ga-spy-for-google-analytics/#1-spying-on-ga) of the highly similar logic of [GA Spy](https://github.com/smhmic/ga-spy).

## Usage

The listener is run by calling `fbqSpy`, which takes a configuration object as the sole argument.


### Configuration

```javascript
fbqSpy( {
  
  // Function fired whenever `fbq()` is called. 
  'callback' : function( data ){},
  
  // The name of the global `fbq` object. Default: "fbq".
  'fbqObjName' : 'fbq',
  
  // Set true to activate logging and avoid try/catch protection. Default: false.
  'debug' : false,
  
  // String with which to prefix log messages. Default: "fbqSpy".
  'debugLogPrefix' : 'fbqSpy',
  
} );
```

### Callback

The callback function gets called whenever `fbq` is called. 
The callback can be passed in the `callback` field of the configuration object, 
  or in place of the configuration object.
  

```javascript
fbqSpy( function( data ){
    /**
     * @var {Object}           data                - Provides original and parsed command arguments.
     * @var {Array}            data.args           - Arguments passed to `fbq()`.
     * @var {Object}           data.the            - Object listing all passed fields by name.
     * @var {string}           data.the.command    - the first argument (init, track, etc)
     * @var {string|undefined} data.the.eventName  - only for track and trackCustom commands
     * @var {Object}           data.the.parameters - merge of all passed objects
     * @var {string|undefined} data.the.parameters.* 
     */
} );
```

Any changes made in `data.args` will be passed through to `fbq`.

Return false to abort the call and prevent the command from firing.

Uncaught callback errors will be suppressed (unless `config.debug` is active). 
So if your integration breaks, default FB pixel behavior will be unaffected.

_Warning: Calling `fbq` in the callback will cause an infinite feedback loop._


## Examples

### Log Facebook tracking to console
```javascript
fbqSpy( function(data){
  console.debug.apply( console, ['fbq():'].concat(data.args) );
})
```

### Block non-"authenticated" tracking
```javascript
fbqSpy( function(data){
  return ( data.the.parameters.dataSource !== '{{Container ID}}' );
})
```

### Populate data layer from non-GTM tracking
```javascript
fbqSpy( function(data){
  var namespace = 'fbq.' + data.the.command,
      frame = {event:namespace+(data.the.eventName?':'+data.the.eventName:'')};
  frame[namespace] = data.the;
  dataLayer.push(frame);
})
```

### Upgrade FB pixels for CAPI compatibility

This adds `event_id` to FB pixels for redundant deduplicated CAPI tracking. 
This code is for Google Tag Manager, but would be trivial to modify code for use anywhere.

In GTM web container ...
1. Add 'Facebook Pixel CAPI Helper' as a tag; fire on All Pages.
2. Add 'Facebook Event ID' as a variable.
3. In GA4 config tag, set `event_id` = `{{Facebook Event ID}}`.
4. Validate using [FB Events Manager](https://www.facebook.com/events_manager2/list/pixel/test_events/overview). If you see 'Deduplicated' next to the event name, it's working!

**GTM Tag: 'Facebook Pixel CAPI Helper'** (fire on All Pages)
```javascript
(function(){
  var dL = google_tag_manager[{{Container ID}}].dataLayer,
      dLKey_counter = 'fw.fb.counter', 
      eventId = {{Facebook Event ID}};
  fbqSpy( function(data){ 
    if( 'track' !== data.the.command && 'trackCustom' !== data.the.command ) return;
    data.args.push({eventID:eventId});
    dL.set( dLKey_counter, (dL.get(dLKey_counter)||0)+1 );
  });
})()
```

**GTM Variable: 'Facebook Event ID'**
```javascript
function(){
  try{
    var dL = google_tag_manager[{{Container ID}}].dataLayer,
        dLKey_counter = 'fw.fb.counter',
        dLKey_pageloadId = 'fw.core.pageload_id', 
        pageloadId = {{Pageload ID}} || dL.get(dLKey_pageloadId),
        counter;
    if( ! pageloadId ) return "";
    ( counter = dL.get(dLKey_counter) ) || dL.set( dLKey_counter, counter=1 );
    return pageloadId+'.'+counter;
  }catch(ex){ {{Debug Mode}} && console.error("[GTM Variable: Facebook Event ID]",ex);}
}
```

    
## Contributing

Open-source under the MIT license.

