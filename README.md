# crop
## Simple fronend image cropping tool
Cropping tool with polyfill to work with Cross-Origin Resource Sharing policy restricted images.

- Returns cropped base64 line or url of the image with crop coordinated `{x,y,w,h}`.
- Canvas needed for setup
- Canvas is set to be responsive and fill parent element 100%
- Module API developing is in progress


##Planned API/deps
No dependencies, just a compatible with `querySelectorAll`, `FileReader` and `canvas.toDataURL`,
so the most close guess would be >ie8.

html code prereqs:

```html
<canvas id="canvas-live" class="noselect" width="400" height="400"></canvas>
```

Javascript initialisation and API:
```javascript
var cropModule = Crop('#canvas-live');
cropModule.set();
cropModule.get();
```

##Tested
- MacBook Pro (Retina, Mid 2012)
- OSX El Capitan 10.11.1
- Safari Version 9.0.1
- Google Chrome 47.0.2526.73 (64-bit)
- Mozilla Firefox 35.0.1

- Windows 8
- Google Chrome 47.0.2526.80 
- Internet Explorer 11.0.9600.17105 

##Known issues
- Not showing selection on load, but showing on resize
- Not showing corner squares in IE11