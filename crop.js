
function Crop(canvasLiveId, options){

    // temp logging fn
    var log = console.log.bind(console);


    // var
    var canvasLive = document.querySelectorAll(canvasLiveId)[0],
        canvasZoom = document.createElement('canvas'),
        ctxLive = canvasLive.getContext('2d'),
        ctxZoom = canvasZoom.getContext('2d'),

        dragging = false, // dragging event flag
        tainted = false,

        btnSrc = document.getElementById('btn-src'),
        btnCrop = document.getElementById('btn-crop'),
        inpSrc = document.getElementById('inp-src'),
        inpFile = document.getElementById('inp-file'),
        imgSource = new Image(),
        imgZoom = new Image(),
        imgResult = document.getElementById('img-result'),
        outputFormat = 'image/jpeg',
        outputQuality = 1;

    // predefined selection
    // center half-image by default
    var sel = {
        x: canvasLive.width / 4,
        y: canvasLive.height / 4,
        w: canvasLive.width / 2,
        h: canvasLive.height / 2,
        lineColor: '#fff',
        lineWidth: 2,
        dotted: [2, 2],
        squareSize: 20
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


    // initalisation
    (function init(){
        /******************************************************************
        * EVENT LIST @TODO: put in init() fn
        ******************************************************************/
        // window events
        window.addEventListener('load', function() {
            resizeCanvasToParentEl(ctxLive, canvasLive);
        });

        window.addEventListener('resize', function() {
            resizeCanvasToParentEl(ctxLive, canvasLive);
            resetSelection(canvasLive);
            redrawCanvasLive();
        });



        // to load a source file
        inpFile.addEventListener('change', function() {
            var imageSourceFile  = new FileReader();

            imageSourceFile.addEventListener('loadend', function() {
                imgSource.src = imageSourceFile.result;
            });

            if (inpFile.files[0]) {
                imageSourceFile.readAsDataURL(inpFile.files[0]);
            }
        });

        // make a cropped image
        // or send crop coordinates with image link
        btnCrop.addEventListener('click', function() {
            // draw source image without a selection
            drawSourceImage(imgSource, ctxLive, canvasLive);

            try {
                imgZoom.src = canvasLive.toDataURL();
                resizeCanvasToSelection(sel, ctxZoom, canvasZoom);
            } catch(e) {
                tainted = true;
                log('cannot send the selection, sending', temp.sel, e);
            }

            // draw dotted selection
            drawSelection(ctxLive, 'dotted');
        });

        // draw image if loaded - no need
        imgZoom.addEventListener('load', function() {
            drawZoomImage(imgZoom, ctxZoom, canvasZoom);

            // temp
            imgResult.src = canvasZoom.toDataURL();
        });

        imgZoom.addEventListener('error', function(e) {
            log(e);
        });

        // draw image if loaded
        imgSource.addEventListener('load', function() {
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


    //
    function setImageSource(val) {
    }


    //
    function setImageUrlSource(val) {
        imgSource.src = val;
    }


    //
    function setImageFileSource(val) {

    }


    //
    function getCropedImage() {
    }


    //reset selection to default settings
    function resetSelection(canvas) {
        sel = {
            x: temp.sel.x * canvas.width,
            y: temp.sel.y * canvas.height,
            w: temp.sel.w * temp.source.w * canvas.width,
            h: temp.sel.h * temp.source.h * canvas.height,
            lineColor: '#fff',
            lineWidth: 2,
            dotted: [2, 2]
        };
    }


    //
    function saveMouseCoordinates(e, canvas) {
        // click coords relative to the canvas
        var x = e.clientX - canvas.getBoundingClientRect().left,
        y = e.clientY - canvas.getBoundingClientRect().top,

        // shift between click and left top corner of the sel
        shiftX = x - sel.x,
        shiftY = y - sel.y,

        // central dividing reaction area coord lines
        centerX = sel.x + sel.w / 2,
        centerY = sel.y + sel.h / 2;

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
    function drawZoomImage(img, ctx, canvas) {
        ctx.drawImage(img, -sel.x, -sel.y);
    }


    // draw sel rectangle
    function drawSelection(ctx, dotted) {
        ctx.beginPath();

        if (dotted) {
            ctx.setLineDash(sel.dotted);
        } else {
            // no dashes
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
        set: setImageSource,
        get: getCropedImage
    }
};
