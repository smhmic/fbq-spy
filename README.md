# Facebook Pixel Spy

_a.k.a. fbqSpy or FB Queue Spy_

This lightweight library listens for data tracked through Facebook's pixels, 
including the ability to block or modify data collection. 
  
This works specifically with that follow Facebook's reccomendations, using the [fbevents.js](https://connect.facebook.net/en_US/fbevents.js) library abd `fbq` command queue API.

The methodology is little more than a proxy pattern. The logic is highly similar to [GA Spy](https://github.com/smhmic/ga-spy); see that page for more details.


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


### Examples

#### Log Facebook tracking to console
```javascript
fbqSpy( function(data){
	console.debug.apply( console, ['fbq():'].concat(data.args) );
})
```

#### Block non-"authenticated" tracking
```javascript
fbqSpy( function(data){
	return ( data.the.parameters.dataSource !== '{{Container ID}}' );
})
```

#### Populate data layer from non-GTM tracking
```javascript
fbqSpy( function(data){
  var namespace = 'fbq.' + data.the.command,
      frame = {event:namespace+(data.the.eventName?':'+data.the.eventName:'')};
  frame[namespace] = data.the;
  dataLayer.push(frame);
})
```

    
## Contributing

Open-source under the MIT license.

