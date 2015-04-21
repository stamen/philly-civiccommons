/*
 (c) 2014, Vladimir Agafonkin
 simpleheat, a tiny JavaScript library for drawing heatmaps with Canvas
 https://github.com/mourner/simpleheat
*/

(function () { 'use strict';

function simpleheat(canvas) {
    // jshint newcap: false, validthis: true
    if (!(this instanceof simpleheat)) { return new simpleheat(canvas); }

    this._canvas = canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;

    this._ctx = canvas.getContext('2d');
    this._width = canvas.width;
    this._height = canvas.height;

    this._max = 1;
    this._data = [];
}

simpleheat.prototype = {

    defaultRadius: 25,

    defaultGradient: {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
    },

    data: function (data) {
        this._data = data;
        return this;
    },

    max: function (max) {
        this._max = max;
        return this;
    },

    add: function (point) {
        this._data.push(point);
        return this;
    },

    clear: function () {
        this._data = [];
        return this;
    },

    radius: function (r, blur) {
        blur = blur || 15;

        // create a grayscale blurred circle image that we'll use for drawing points
        var circle = this._circle = document.createElement('canvas'),
            ctx = circle.getContext('2d'),
            r2 = this._r = r + blur;

        circle.width = circle.height = r2 * 2;

        ctx.shadowOffsetX = ctx.shadowOffsetY = 200;
        ctx.shadowBlur = blur;
        ctx.shadowColor = 'black';

        ctx.beginPath();
        ctx.arc(r2 - 200, r2 - 200, r, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();

        return this;
    },

    gradient: function (grad) {
        // create a 256x1 gradient that we'll use to turn a grayscale heatmap into a colored one
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            gradient = ctx.createLinearGradient(0, 0, 0, 256);

        canvas.width = 1;
        canvas.height = 256;

        for (var i in grad) {
            gradient.addColorStop(i, grad[i]);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1, 256);

        this._grad = ctx.getImageData(0, 0, 1, 256).data;

        return this;
    },

    gradientReturn: function (grad) {
        // create a 256x1 gradient that we'll use to turn a grayscale heatmap into a colored one
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            gradient = ctx.createLinearGradient(0, 0, 0, 256);

        canvas.width = 1;
        canvas.height = 256;

        for (var i in grad) {
            gradient.addColorStop(i, grad[i]);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1, 256);

        return ctx.getImageData(0, 0, 1, 256).data;

    },

    clearCanvas: function() {
        var ctx = this._ctx;
        ctx.clearRect(0, 0, this._width, this._height);

        this.overlays = [];
    },

    saveState: function() {
        var ctx = this._ctx;
        ctx.save();
    },

    restoreState: function() {
        var ctx = this._ctx;
        ctx.restore();
    },
    createOverlay: function() {
        var ctx = this._ctx;
        this.overlays.push(ctx.getImageData(0, 0, this._width, this._height));
    },

    draw: function (minOpacity) {
        if (!this._circle) {
            this.radius(this.defaultRadius);
        }
        if (!this._grad) {
            this.gradient(this.defaultGradient);
        }

        var ctx = this._ctx;

        ctx.clearRect(0, 0, this._width, this._height);

        // draw a grayscale heatmap by putting a blurred circle at each data point
        for (var i = 0, len = this._data.length, p; i < len; i++) {
            p = this._data[i];

            ctx.globalAlpha = Math.max(p[2] / this._max, minOpacity === undefined ? 0.05 : minOpacity);
            ctx.drawImage(this._circle, p[0] - this._r, p[1] - this._r);
        }

        // colorize the heatmap, using opacity value of each pixel to get the right color from our gradient
        var colored = ctx.getImageData(0, 0, this._width, this._height);
        this._colorize(colored.data, this._grad);
        ctx.putImageData(colored, 0, 0);

        return this;
    },

    drawWithData: function (data, gradd, minOpacity, maxOpacity) {
        if (!this._circle) {
            this.radius(this.defaultRadius);
        }

        var grad = this.gradientReturn(gradd);

        var ctx = this._ctx;
        ctx.clearRect(0, 0, this._width, this._height);

        var max = d3.max(data, function(d){return d[2]});
        // draw a grayscale heatmap by putting a blurred circle at each data point
        for (var i = 0, len = data.length, p; i < len; i++) {
            p = data[i];
            ctx.globalAlpha = Math.max(p[2] / max, minOpacity === undefined ? 0.05 : minOpacity);
            //ctx.globalAlpha = Math.min(maxOpacity, Math.max(1 / data.length, minOpacity === undefined ? 0.05 : minOpacity));
            ctx.drawImage(this._circle, p[0] - this._r, p[1] - this._r);
        }

        // colorize the heatmap, using opacity value of each pixel to get the right color from our gradient
        var colored = ctx.getImageData(0, 0, this._width, this._height);
        this._colorize(colored.data, grad);
        ctx.putImageData(colored, 0, 0);
        this.createOverlay();

        return this;
    },

    blend: function() {

        var ctx = this._ctx;
        ctx.clearRect(0, 0, this._width, this._height);
        //ctx.globalCompositeOperation = 'lighter';
        var base = this.overlays.pop();//ctx.getImageData(0, 0, this._width, this._height);
        while(this.overlays.length) {
            var o = this.overlays.pop();
            base = this.mix(base, o);
        }
        ctx.putImageData(base, 0, 0);
    },



    _colorize: function (pixels, gradient) {
        for (var i = 3, len = pixels.length, j; i < len; i += 4) {
            j = pixels[i] * 4; // get gradient color from opacity value

            if (j) {
                pixels[i - 3] = gradient[j];
                pixels[i - 2] = gradient[j + 1];
                pixels[i - 1] = gradient[j + 2];
            }
        }
    },

    mix: function(dest, source, blendMode) {
        blendMode = 'color';
        //color
        //overlay
        //hardlight
        //softlight
        //lighten

        var dst = dest.data;
        var src = source.data;
        var sA, dA, len=dst.length;
        var sRA, sGA, sBA, dRA, dGA, dBA, dA2,
            r1,g1,b1, r2,g2,b2;
        var demultiply;



        function Fsoftlight(a,b) {
            /*
                http://en.wikipedia.org/wiki/Blend_modes#Soft_Light
                2ab+a^2 (1-2b), if b<0.5
                2a(1-b) +sqrt(a)(2b-1), otherwise
            */
            var b2=b<<1;
            if (b<128) return (a*(b2+(a*(255-b2)>>8)))>>8;
            else       return (a*(511-b2)+(Math.sqrt(a<<8)*(b2-255)))>>8;
        }

        function Foverlay(a,b) {
            return a<128 ?
                (a*b)>>7 : // (2*a*b)>>8 :
                255 - (( (255 - b) * (255 - a))>>7);
        }

        function Fdodge(a,b) {
            return (b==255 && a==0) ? 255 : Math.min(255,(a<<8)/(255-b));
        }

        function Fburn(a,b) {
            return (b==255 && a==0) ? 0 : 255-Math.min(255,((255-a)<<8)/b);
        }


        /*
            // yyy = similar to YCbCr
            0.2990    0.5870    0.1140
            -0.1687   -0.3313    0.5000
            0.5000   -0.4187   -0.0813
        */
        function rgb2YCbCr(r,g,b) {
            return {
                r: 0.2990*r+0.5870*g+0.1140*b,
                g: -0.1687*r-0.3313*g+0.5000*b,
                b: 0.5000*r-0.4187*g-0.0813*b };
        }

        /*
            1.0000   -0.0000    1.4020
            1.0000   -0.3441   -0.7141
            1.0000    1.7720    0.0000
        */
        function YCbCr2rgb(r,g,b) {
            return {
                r: r +1.4020*b,
                g: r-0.3441*g   -0.7141*b,
                b: r+1.7720*g };
        }

        function rgb2hsv(r,g,b) {
            var c=rgb2YCbCr(r,g,b);
            var s=Math.sqrt(c.g*c.g+c.b*c.b),
                h=Math.atan2(c.g,c.b);
            return {h:h, s:s, v:c.r };
        }

        function hsv2rgb(h,s,v) {
            var g=s*Math.sin(h),
                b=s*Math.cos(h);
            return YCbCr2rgb(v,g,b);
        }


        for (var px=0;px<len;px+=4){
            sA  = src[px+3]/255;
            dA  = dst[px+3]/255;
            dA2 = (sA + dA - sA*dA);
            dst[px+3] = dA2*255;

            r1=dst[px], g1=dst[px+1], b1=dst[px+2];
            r2=src[px], g2=src[px+1], b2=src[px+2];

            sRA = r2/255*sA;
            dRA = r1/255*dA;
            sGA = g2/255*sA;
            dGA = g1/255*dA;
            sBA = b2/255*sA;
            dBA = b1/255*dA;

            demultiply = 255 / dA2;

            var f1=dA*sA, f2=dA-f1, f3=sA-f1;

            switch(blendMode){
                // ******* Very close match to Photoshop
                case 'normal':
                case 'src-over':
                    dst[px  ] = (sRA + dRA - dRA*sA) * demultiply;
                    dst[px+1] = (sGA + dGA - dGA*sA) * demultiply;
                    dst[px+2] = (sBA + dBA - dBA*sA) * demultiply;
                break;

                case 'screen':
                    dst[px  ] = (sRA + dRA - sRA*dRA) * demultiply;
                    dst[px+1] = (sGA + dGA - sGA*dGA) * demultiply;
                    dst[px+2] = (sBA + dBA - sBA*dBA) * demultiply;
                break;

                case 'multiply':
                    dst[px  ] = (sRA*dRA + sRA*(1-dA) + dRA*(1-sA)) * demultiply;
                    dst[px+1] = (sGA*dGA + sGA*(1-dA) + dGA*(1-sA)) * demultiply;
                    dst[px+2] = (sBA*dBA + sBA*(1-dA) + dBA*(1-sA)) * demultiply;
                break;

                case 'difference':
                    dst[px  ] = (sRA + dRA - 2 * Math.min( sRA*dA, dRA*sA )) * demultiply;
                    dst[px+1] = (sGA + dGA - 2 * Math.min( sGA*dA, dGA*sA )) * demultiply;
                    dst[px+2] = (sBA + dBA - 2 * Math.min( sBA*dA, dBA*sA )) * demultiply;
                break;

                // ******* Slightly different from Photoshop, where alpha is concerned
                case 'src-in':
                    dA2 = sA*dA;
                    demultiply = 255 / dA2;
                    dst[px  ] = sRA*dA * demultiply;
                    dst[px+1] = sGA*dA * demultiply;
                    dst[px+2] = sBA*dA * demultiply;
                    dst[px+3] = dA2*255;
                break;

                case 'plus':
                case 'add':
                    // Photoshop doesn't simply add the alpha channels; this might be correct wrt SVG 1.2
                    dst[px  ] = Math.min(sRA + dRA,1) * demultiply;
                    dst[px+1] = Math.min(sGA + dGA,1) * demultiply;
                    dst[px+2] = Math.min(sBA + dBA,1) * demultiply;
                break;

                case 'overlay':
                    dst[px]   = f1*Foverlay(r1,r2) + f2*r1 + f3*r2;
                    dst[px+1] = f1*Foverlay(g1,g2) + f2*g1 + f3*g2;
                    dst[px+2] = f1*Foverlay(b1,b2) + f2*b1 + f3*b2;
                break;

                case 'hardlight': // hardlight(a,b) = overlay(b,a)
                    dst[px]   = f1*Foverlay(r2,r1) + f2*r1 + f3*r2;
                    dst[px+1] = f1*Foverlay(g2,g1) + f2*g1 + f3*g2;
                    dst[px+2] = f1*Foverlay(b2,b1) + f2*b1 + f3*b2;
                break;

                case 'colordodge':
                case 'dodge':
                    dst[px]   = f1*Fdodge(r1,r2) + f2*r1 + f3*r2;
                    dst[px+1] = f1*Fdodge(g1,g2) + f2*g1 + f3*g2;
                    dst[px+2] = f1*Fdodge(b1,b2) + f2*b1 + f3*b2;
                break;

                case 'colorburn':
                case 'burn':
                    dst[px]   = f1*Fburn(r1,r2) + f2*r1 + f3*r2;
                    dst[px+1] = f1*Fburn(g1,g2) + f2*g1 + f3*g2;
                    dst[px+2] = f1*Fburn(b1,b2) + f2*b1 + f3*b2;
                break;

                case 'darken':
                case 'darker':
                    dst[px]   = f1*(r1<r2 ? r1 : r2) + f2*r1 + f3*r2;
                    dst[px+1] = f1*(g1<g2 ? g1 : g2) + f2*g1 + f3*g2;
                    dst[px+2] = f1*(b1<b2 ? b1 : b2) + f2*b1 + f3*b2;
                break;

                case 'lighten':
                case 'lighter':
                    dst[px  ] = (sRA<dRA ? dRA : sRA) * demultiply;
                    dst[px+1] = (sGA<dGA ? dGA : sGA) * demultiply;
                    dst[px+2] = (sBA<dBA ? dBA : sBA) * demultiply;
                break;

                case 'exclusion':
                    dst[px  ] = (dRA+sRA - 2*dRA*sRA) * demultiply;
                    dst[px+1] = (dGA+sGA - 2*dGA*sGA) * demultiply;
                    dst[px+2] = (dBA+sBA - 2*dBA*sBA) * demultiply;
                break;

                case 'softlight':
                    dst[px]   = f1*Fsoftlight(r1,r2) + f2*r1 + f3*r2;
                    dst[px+1] = f1*Fsoftlight(g1,g2) + f2*g1 + f3*g2;
                    dst[px+2] = f1*Fsoftlight(b1,b2) + f2*b1 + f3*b2;
                break;

                case 'luminosity':
                    var hsl  = rgb2YCbCr(r1,g1,b1);
                    var hsl2 = rgb2YCbCr(r2,g2,b2);
                    var rgb=YCbCr2rgb(hsl2.r, hsl.g, hsl.b);
                    dst[px]   = f1*rgb.r + f2*r1 + f3*r2;
                    dst[px+1] = f1*rgb.g + f2*g1 + f3*g2;
                    dst[px+2] = f1*rgb.b + f2*b1 + f3*b2;
                break;

                case 'color':
                    var hsl  = rgb2YCbCr(r1,g1,b1);
                    var hsl2 = rgb2YCbCr(r2,g2,b2);
                    var rgb=YCbCr2rgb(hsl.r, hsl2.g, hsl2.b);
                    dst[px]   = f1*rgb.r + f2*r1 + f3*r2;
                    dst[px+1] = f1*rgb.g + f2*g1 + f3*g2;
                    dst[px+2] = f1*rgb.b + f2*b1 + f3*b2;
                break;

                case 'hue':
                    var hsl =rgb2hsv(r1,g1,b1);
                    var hsl2=rgb2hsv(r2,g2,b2);
                    var rgb=hsv2rgb(hsl2.h, hsl.s, hsl.v);
                    dst[px]   = f1*rgb.r + f2*r1 + f3*r2;
                    dst[px+1] = f1*rgb.g + f2*g1 + f3*g2;
                    dst[px+2] = f1*rgb.b + f2*b1 + f3*b2;
                break;

                case 'saturation':
                    var hsl =rgb2hsv(r1,g1,b1);
                    var hsl2=rgb2hsv(r2,g2,b2);
                    var rgb=hsv2rgb(hsl.h, hsl2.s, hsl.v);
                    dst[px]   = f1*rgb.r + f2*r1 + f3*r2;
                    dst[px+1] = f1*rgb.g + f2*g1 + f3*g2;
                    dst[px+2] = f1*rgb.b + f2*b1 + f3*b2;
                break;

                case 'lightercolor':
                    var rgb = 2.623*(r1-r2)+5.15*(g1-g2)+b1-b2>0 ? {r:r1,g:g1,b:b1} : {r:r2,g:g2,b:b2};
                    dst[px]   = f1*rgb.r + f2*r1 + f3*r2;
                    dst[px+1] = f1*rgb.g + f2*g1 + f3*g2;
                    dst[px+2] = f1*rgb.b + f2*b1 + f3*b2;
                break;

                case 'darkercolor':
                    var rgb = 2.623*(r1-r2)+5.15*(g1-g2)+b1-b2<0 ? {r:r1,g:g1,b:b1} : {r:r2,g:g2,b:b2};
                    dst[px]   = f1*rgb.r + f2*r1 + f3*r2;
                    dst[px+1] = f1*rgb.g + f2*g1 + f3*g2;
                    dst[px+2] = f1*rgb.b + f2*b1 + f3*b2;
                break;

                default: // ******* UNSUPPORTED mode, produces yellow/magenta checkerboard
                    var col = (px/4) % this.canvas.width,
                        row = Math.floor((px/4) / this.canvas.width),
                        odd = (col%8<4 && row%8<4) || (col%8>3 && row%8>3);
                    dst[px] = dst[px+3] = 255;
                    dst[px+1] = odd ? 255 : 0;
                    dst[px+2] = odd ? 0 : 255;
            }
        }

        //dest.data = dst;
        return dest;
    }
};

window.simpleheat = simpleheat;

})();
