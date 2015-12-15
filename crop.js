
function Crop(canvasLiveSelector, options){


    // temp logging fn
    var log = console.log.bind(console);

    if ( typeof canvasLiveSelector === 'undefined') {
        throw new Error('cannot init the crop module wotthout preset canvas selector');
    }


    // necessary values
    var canvasLive = document.querySelectorAll(canvasLiveSelector)[0],
        ctxLive = canvasLive.getContext('2d'),

        // temp hidden canvas
        canvasCropped = document.createElement('canvas'),
        ctxCropped = canvasCropped.getContext('2d'),

        dragging = false, // dragging event flag
        tainted = false, // we may not need it
        imgSource = new Image(),
        imgToCrop = new Image(),
        outputFormat = 'image/jpeg',
        outputQuality = 1;


    // optional values
    var inpSrcTrigger, inpSrcTriggerEvent, // selectors for url trigger
        cropTrigger, cropTriggerEvent,

        inpSrc, // url image input
        inpFile; // file image input




    // predefined selection
    // center half-image by default
    var sel = {
        x: canvasLive.width / 4,
        y: canvasLive.height / 4,
        w: canvasLive.width / 2,
        h: canvasLive.height / 2,
        lineColor: '#fff',
        lineWidth: 1.5,
        dotted: [2, 2],
        squareSize: 12
    };


    // export values in relative units
    var temp = {
        // memorise to calculate relative
        // values for the selection
        source: {
            x: undefined,
            y: undefined,
            w: undefined,
            h: undefined
        },
        // what we send to server
        // in case we cannot crop
        // due to CORS or tainted canvas
        sel: {
            x: 0.25,
            y: 0.25,
            w: 0.5,
            h: 0.5
        }
    };




    // core events initalisation
    (function init(){
        /******************************************************************
        * EVENT LIST @TODO: put in init() fn
        ******************************************************************/


        // window events
        window.addEventListener('load', function() {
            resizeCanvasToParentEl(ctxLive, canvasLive);
            resetSelection(canvasLive);
        });

        window.addEventListener('resize', function() {
            resizeCanvasToParentEl(ctxLive, canvasLive);
            resetSelection(canvasLive);
            redrawCanvasLive();
        });


        // draw image if loaded
        imgSource.addEventListener('load', function() {
            clearCanvas(ctxLive, canvasLive);
            drawSourceImage(imgSource, ctxLive, canvasLive);
            drawSelection(ctxLive);
        });

        imgSource.addEventListener('error', function(e) {
            log(e);
        });


        // EDITING EVENTS
        // click
        canvasLive.addEventListener('click', function(e) {
            saveMouseCoordinates(e, canvasLive);
            redrawCanvasLive();
        });

        // pseudo-dragging events
        canvasLive.addEventListener('mousedown', function(e) {
            dragging = true;
        });

        canvasLive.addEventListener('mousemove', function(e) {
            if (dragging) {
                saveMouseCoordinates(e, canvasLive);
                redrawCanvasLive();
            }
        });

        canvasLive.addEventListener('mouseup', function() {
            dragging = false;
        });

        canvasLive.addEventListener('mouseleave', function() {
            dragging = false;
        });

    })();




    /******************************************************************
    * FUNCTIONS
    ******************************************************************/


    // init file input
    function setImageSourceFileInput(inpFileSelector) {
        inpFile = document.querySelectorAll(inpFileSelector)[0];

        //initalise
        inpFile.addEventListener('change', function() {
            var imageSourceFile  = new FileReader();

            imageSourceFile.addEventListener('loadend', function() {
                imgSource.src = imageSourceFile.result;
            });

            if (inpFile.files[0]) {
                imageSourceFile.readAsDataURL(inpFile.files[0]);
            }
        });
    }


    //
    function setImageSourceUrlInput(inpSrcSelector, inpSrcTriggerSelector, inpSrcTriggerEventVal) {

        if ( typeof inpSrcSelector === 'undefined' || typeof inpSrcTriggerSelector === 'undefined') {
            throw new Error('wrong values in setImageSourceUrlInput');
        }

        inpSrc = document.querySelectorAll(inpSrcSelector)[0];
        inpSrcTrigger = document.querySelectorAll(inpSrcTriggerSelector)[0];
        inpSrcTriggerEvent = inpSrcTriggerEventVal || 'click';

        inpSrcTrigger.addEventListener(inpSrcTriggerEvent, function() {
            // imgSource.setAttribute('crossOrigin', 'Anonymous');
            imgSource.src = inpSrc.value;
        });
    }


    function setUrl(url) {
        imgSource.src = url;
    }


    // set crop trigger dom elemnt
    function setCropTrigger(cropTriggerSelector, cropTriggerEventVal, callback) {

        if ( typeof cropTriggerSelector === 'undefined') {
            throw new Error('wrong values in setCropTrigger');
        }

        cropTrigger = document.querySelectorAll(cropTriggerSelector)[0];
        cropTriggerEvent = cropTriggerEventVal || 'click';

        // make a cropped image
        // or send crop coordinates with image link
        cropTrigger.addEventListener(cropTriggerEvent, function() {
            // draw source image without a selection
            drawSourceImage(imgSource, ctxLive, canvasLive);

            try {
                imgToCrop.src = canvasLive.toDataURL();
                resizeCanvasToSelection(sel, ctxCropped, canvasCropped);
            } catch(e) {
                tainted = true;
                callback({
                    url: inpSrc.value,
                    x: temp.sel.x,
                    y: temp.sel.y,
                    w: temp.sel.w,
                    h: temp.sel.h
                });
            }

            // draw dotted selection
            drawSelection(ctxLive, 'dotted');
        });

        // draw image if loaded
        imgToCrop.addEventListener('load', function() {
            drawCropImage(imgToCrop, ctxCropped, canvasCropped);

            // temp
            var result = canvasCropped.toDataURL();
            callback(result);
        });

        imgToCrop.addEventListener('error', function(e) {
            log(e);
        });
    }


    // @TODO:
    function getCropedImage() {
    }


    //reset selection to default settings
    function resetSelection(canvas) {
        var resetVals = {
            x: canvas.width / 4,
            y: canvas.height / 4,
            w: canvas.width / 2,
            h: canvas.height / 2
        };

        for (prop in resetVals) {
            sel[prop] = resetVals[prop];
        }
    }


    //
    function saveMouseCoordinates(e, canvas) {
        // click coords relative to the canvas
        // @TODO shift to pageX, pageY
        var x = e.clientX - canvas.getBoundingClientRect().left,
            y = e.clientY - canvas.getBoundingClientRect().top,

            // shift between click and left top corner of the sel
            shiftX = x - sel.x,
            shiftY = y - sel.y,

            // central dividing reaction area coord lines
            centerX = sel.x + sel.w / 2,
            centerY = sel.y + sel.h / 2;

        // dragging
        // if ((x > sel.x + 5) && (x < (sel.x + sel.w - 5)) && (y > sel.y + 5) && (y < (sel.y + sel.h - 5))) {
        //     log('drag');
        //     sel.x = x;
        //     sel.y = y;
        //     return;
        // }

        // resizing
        // top-left
        if ( x < centerX && y < centerY) {
            sel.x = x;
            sel.y = y;
            sel.w -= shiftX;
            sel.h -= shiftY;

            // top-right
        } else if ( x > centerX && y < centerY) {
            sel.y = y;
            sel.w = x - sel.x;
            sel.h -= shiftY;

            // bottom-right
        } else if ( x > centerX && y > centerY) {
            sel.w = x - sel.x;
            sel.h = y - sel.y;

            // bottom-left
        } else if ( x < centerX && y > centerY) {
            sel.x = x;
            sel.w -= shiftX;
            sel.h = y - sel.y;
        }

        // preserve relative values
        // @TODO: recalculate values - clearly some of those are wrong
        // we need to calculate relative TO THE IMAGE, not to canvas
        // because that is what we send to server in the end
        // in case of CORS issues
        temp.sel = {
            x: sel.x / canvas.width,
            y: sel.y / canvas.height,
            w: sel.w / canvas.width,
            h: sel.h / canvas.height
        }
    }


    // resizes canvas to a parent element
    function resizeCanvasToParentEl(ctx, canvas) {
        var parentElRect = canvas.parentElement.getBoundingClientRect(),
        parentElWidth = parentElRect.width,
        parentElHeight = parentElRect.height;

        // no need in these two
        // canvas.width = parentElWidth;
        // canvas.height = parentElHeight;
        ctx.canvas.width  = parentElWidth;
        ctx.canvas.height = parentElHeight;
    }


    // resizes canvas to a particular image
    function resizeCanvasToSelection(sel, ctx, canvas) {
        // canvas.width = sel.w;
        // canvas.height = sel.h;
        ctx.canvas.width  = sel.w;
        ctx.canvas.height = sel.h;
    }


    //  redraw function aggregator
    function redrawCanvasLive() {
        clearCanvas(ctxLive, canvasLive);
        drawSourceImage(imgSource, ctxLive, canvasLive);
        drawSelection(ctxLive);
    }


    // draw loaded image to live canvas
    function drawSourceImage(img, ctx, canvas) {
        var x, y, w, h;

        // @TODO: override to drag the whole selection

        // scaling to live canvas
        if (canvas.height > canvas.width) {

            if (img.height > img.width) {
                // log('vertical canvas - vertical image');
                h = canvas.height;
                w = img.width * h / img.height;
                y = 0;
                x = (canvas.width - w) / 2;

            } else {
                // log('vertical canvas - horizontal image');
                w = canvas.width;
                h = img.height * w / img.width;
                x = 0;
                y = (canvas.height - h) / 2;
            }
        } else {

            if (img.height < img.width) {
                // log('horizontal canvas - horizontal image');
                h = canvas.height;
                w = img.width * h / img.height;
                y = 0;
                x = (canvas.width - w) / 2;

            } else {
                // log('horizontal canvas - vertical image');
                h = canvas.height;
                w = img.width * h / img.height;
                y = 0;
                x = (canvas.width - w) / 2;
            }
        }
        ctx.drawImage(img, x, y, w, h);

        // preserve image relative coords
        temp.source = {
            x: x / canvas.width,
            y: y / canvas.height,
            w: w / canvas.width,
            h: h / canvas.height
        }
    }


    // draw loaded image to live canvas
    function drawCropImage(img, ctx, canvas) {
        ctx.drawImage(img, -sel.x, -sel.y);
    }


    // draw sel rectangle
    // dotted = true - makes to draw dotted line without squares in the corners
    // dotted = false - solid line with squares
    function drawSelection(ctx, dotted) {
        ctx.beginPath();

        if (dotted) {
            // dashed line
            ctx.setLineDash(sel.dotted);
        } else {
            // solid line
            ctx.setLineDash([]);

            // draw squares in the corners
            ctx.fillStyle = sel.lineColor;
            ctx.fillRect(sel.x - sel.squareSize / 2, sel.y - sel.squareSize / 2, sel.squareSize, sel.squareSize);
            ctx.fillRect(sel.x + sel.w - sel.squareSize / 2, sel.y - sel.squareSize / 2, sel.squareSize, sel.squareSize);
            ctx.fillRect(sel.x + sel.w - sel.squareSize / 2, sel.y + sel.h - sel.squareSize / 2, sel.squareSize, sel.squareSize);
            ctx.fillRect(sel.x - sel.squareSize / 2, sel.y + sel.h - sel.squareSize / 2, sel.squareSize, sel.squareSize);
        }

        ctx.rect(sel.x, sel.y, sel.w, sel.h);
        ctx.lineWidth = sel.lineWidth;
        ctx.strokeStyle = sel.lineColor;
        ctx.stroke();
    }


    // clean canvas ctx
    function clearCanvas(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return {
        setFileInput: setImageSourceFileInput,
        setUrlInput: setImageSourceUrlInput,
        setUrl: setUrl,
        setCropTrigger: setCropTrigger,

        // getCropedImage: getCropedImage
    }
};
