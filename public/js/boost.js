/*
 Highcharts JS v7.1.2 (2019-06-03)

 Boost module

 (c) 2010-2019 Highsoft AS
 Author: Torstein Honsi

 License: www.highcharts.com/license
*/
(function(h) {
    "object" === typeof module && module.exports ? (h["default"] = h,
    module.exports = h) : "function" === typeof define && define.amd ? define("highcharts/modules/boost", ["highcharts"], function(u) {
        h(u);
        h.Highcharts = u;
        return h
    }) : h("undefined" !== typeof Highcharts ? Highcharts : void 0)
}
)(function(h) {
    function u(e, h, c, C) {
        e.hasOwnProperty(h) || (e[h] = C.apply(null, c))
    }
    h = h ? h._modules : {};
    u(h, "modules/boost/boostables.js", [], function() {
        return "area arearange column columnrange bar line scatter heatmap bubble treemap".split(" ")
    });
    u(h, "modules/boost/boostable-map.js", [h["modules/boost/boostables.js"]], function(e) {
        var h = {};
        e.forEach(function(c) {
            h[c] = 1
        });
        return h
    });
    u(h, "modules/boost/wgl-shader.js", [h["parts/Globals.js"]], function(e) {
        var h = e.pick;
        return function(c) {
            function v() {
                r.length && e.error("[highcharts boost] shader error - " + r.join("\n"))
            }
            function g(a, f) {
                var b = c.createShader("vertex" === f ? c.VERTEX_SHADER : c.FRAGMENT_SHADER);
                c.shaderSource(b, a);
                c.compileShader(b);
                return c.getShaderParameter(b, c.COMPILE_STATUS) ? b : (r.push("when compiling " + f + " shader:\n" + c.getShaderInfoLog(b)),
                !1)
            }
            function w() {
                function b(b) {
                    return c.getUniformLocation(a, b)
                }
                var e = g("#version 100\n#define LN10 2.302585092994046\nprecision highp float;\nattribute vec4 aVertexPosition;\nattribute vec4 aColor;\nvarying highp vec2 position;\nvarying highp vec4 vColor;\nuniform mat4 uPMatrix;\nuniform float pSize;\nuniform float translatedThreshold;\nuniform bool hasThreshold;\nuniform bool skipTranslation;\nuniform float xAxisTrans;\nuniform float xAxisMin;\nuniform float xAxisMinPad;\nuniform float xAxisPointRange;\nuniform float xAxisLen;\nuniform bool  xAxisPostTranslate;\nuniform float xAxisOrdinalSlope;\nuniform float xAxisOrdinalOffset;\nuniform float xAxisPos;\nuniform bool  xAxisCVSCoord;\nuniform bool  xAxisIsLog;\nuniform bool  xAxisReversed;\nuniform float yAxisTrans;\nuniform float yAxisMin;\nuniform float yAxisMinPad;\nuniform float yAxisPointRange;\nuniform float yAxisLen;\nuniform bool  yAxisPostTranslate;\nuniform float yAxisOrdinalSlope;\nuniform float yAxisOrdinalOffset;\nuniform float yAxisPos;\nuniform bool  yAxisCVSCoord;\nuniform bool  yAxisIsLog;\nuniform bool  yAxisReversed;\nuniform bool  isBubble;\nuniform bool  bubbleSizeByArea;\nuniform float bubbleZMin;\nuniform float bubbleZMax;\nuniform float bubbleZThreshold;\nuniform float bubbleMinSize;\nuniform float bubbleMaxSize;\nuniform bool  bubbleSizeAbs;\nuniform bool  isInverted;\nfloat bubbleRadius(){\nfloat value \x3d aVertexPosition.w;\nfloat zMax \x3d bubbleZMax;\nfloat zMin \x3d bubbleZMin;\nfloat radius \x3d 0.0;\nfloat pos \x3d 0.0;\nfloat zRange \x3d zMax - zMin;\nif (bubbleSizeAbs){\nvalue \x3d value - bubbleZThreshold;\nzMax \x3d max(zMax - bubbleZThreshold, zMin - bubbleZThreshold);\nzMin \x3d 0.0;\n}\nif (value \x3c zMin){\nradius \x3d bubbleZMin / 2.0 - 1.0;\n} else {\npos \x3d zRange \x3e 0.0 ? (value - zMin) / zRange : 0.5;\nif (bubbleSizeByArea \x26\x26 pos \x3e 0.0){\npos \x3d sqrt(pos);\n}\nradius \x3d ceil(bubbleMinSize + pos * (bubbleMaxSize - bubbleMinSize)) / 2.0;\n}\nreturn radius * 2.0;\n}\nfloat translate(float val,\nfloat pointPlacement,\nfloat localA,\nfloat localMin,\nfloat minPixelPadding,\nfloat pointRange,\nfloat len,\nbool  cvsCoord,\nbool  isLog,\nbool  reversed\n){\nfloat sign \x3d 1.0;\nfloat cvsOffset \x3d 0.0;\nif (cvsCoord) {\nsign *\x3d -1.0;\ncvsOffset \x3d len;\n}\nif (isLog) {\nval \x3d log(val) / LN10;\n}\nif (reversed) {\nsign *\x3d -1.0;\ncvsOffset -\x3d sign * len;\n}\nreturn sign * (val - localMin) * localA + cvsOffset + \n(sign * minPixelPadding);\n}\nfloat xToPixels(float value) {\nif (skipTranslation){\nreturn value;// + xAxisPos;\n}\nreturn translate(value, 0.0, xAxisTrans, xAxisMin, xAxisMinPad, xAxisPointRange, xAxisLen, xAxisCVSCoord, xAxisIsLog, xAxisReversed);// + xAxisPos;\n}\nfloat yToPixels(float value, float checkTreshold) {\nfloat v;\nif (skipTranslation){\nv \x3d value;// + yAxisPos;\n} else {\nv \x3d translate(value, 0.0, yAxisTrans, yAxisMin, yAxisMinPad, yAxisPointRange, yAxisLen, yAxisCVSCoord, yAxisIsLog, yAxisReversed);// + yAxisPos;\nif (v \x3e yAxisLen) {\nv \x3d yAxisLen;\n}\n}\nif (checkTreshold \x3e 0.0 \x26\x26 hasThreshold) {\nv \x3d min(v, translatedThreshold);\n}\nreturn v;\n}\nvoid main(void) {\nif (isBubble){\ngl_PointSize \x3d bubbleRadius();\n} else {\ngl_PointSize \x3d pSize;\n}\nvColor \x3d aColor;\nif (skipTranslation \x26\x26 isInverted) {\ngl_Position \x3d uPMatrix * vec4(aVertexPosition.y + yAxisPos, aVertexPosition.x + xAxisPos, 0.0, 1.0);\n} else if (isInverted) {\ngl_Position \x3d uPMatrix * vec4(yToPixels(aVertexPosition.y, aVertexPosition.z) + yAxisPos, xToPixels(aVertexPosition.x) + xAxisPos, 0.0, 1.0);\n} else {\ngl_Position \x3d uPMatrix * vec4(xToPixels(aVertexPosition.x) + xAxisPos, yToPixels(aVertexPosition.y, aVertexPosition.z) + yAxisPos, 0.0, 1.0);\n}\n}", "vertex")
                  , k = g("precision highp float;\nuniform vec4 fillColor;\nvarying highp vec2 position;\nvarying highp vec4 vColor;\nuniform sampler2D uSampler;\nuniform bool isCircle;\nuniform bool hasColor;\nvoid main(void) {\nvec4 col \x3d fillColor;\nvec4 tcol;\nif (hasColor) {\ncol \x3d vColor;\n}\nif (isCircle) {\ntcol \x3d texture2D(uSampler, gl_PointCoord.st);\ncol *\x3d tcol;\nif (tcol.r \x3c 0.0) {\ndiscard;\n} else {\ngl_FragColor \x3d col;\n}\n} else {\ngl_FragColor \x3d col;\n}\n}", "fragment");
                if (!e || !k)
                    return a = !1,
                    v(),
                    !1;
                a = c.createProgram();
                c.attachShader(a, e);
                c.attachShader(a, k);
                c.linkProgram(a);
                if (!c.getProgramParameter(a, c.LINK_STATUS))
                    return r.push(c.getProgramInfoLog(a)),
                    v(),
                    a = !1;
                c.useProgram(a);
                c.bindAttribLocation(a, 0, "aVertexPosition");
                q = b("uPMatrix");
                y = b("pSize");
                L = b("fillColor");
                t = b("isBubble");
                p = b("bubbleSizeAbs");
                d = b("bubbleSizeByArea");
                R = b("uSampler");
                n = b("skipTranslation");
                f = b("isCircle");
                I = b("isInverted");
                return !0
            }
            function l(b, f) {
                c && a && (b = m[b] = m[b] || c.getUniformLocation(a, b),
                c.uniform1f(b, f))
            }
            var m = {}, a, q, y, L, t, p, d, n, f, I, r = [], R;
            return c && !w() ? !1 : {
                psUniform: function() {
                    return y
                },
                pUniform: function() {
                    return q
                },
                fillColorUniform: function() {
                    return L
                },
                setBubbleUniforms: function(b, n, k) {
                    var e = b.options
                      , r = Number.MAX_VALUE
                      , g = -Number.MAX_VALUE;
                    c && a && "bubble" === b.type && (r = h(e.zMin, Math.min(r, Math.max(n, !1 === e.displayNegative ? e.zThreshold : -Number.MAX_VALUE))),
                    g = h(e.zMax, Math.max(g, k)),
                    c.uniform1i(t, 1),
                    c.uniform1i(f, 1),
                    c.uniform1i(d, "width" !== b.options.sizeBy),
                    c.uniform1i(p, b.options.sizeByAbsoluteValue),
                    l("bubbleZMin", r),
                    l("bubbleZMax", g),
                    l("bubbleZThreshold", b.options.zThreshold),
                    l("bubbleMinSize", b.minPxSize),
                    l("bubbleMaxSize", b.maxPxSize))
                },
                bind: function() {
                    c && a && c.useProgram(a)
                },
                program: function() {
                    return a
                },
                create: w,
                setUniform: l,
                setPMatrix: function(b) {
                    c && a && c.uniformMatrix4fv(q, !1, b)
                },
                setColor: function(b) {
                    c && a && c.uniform4f(L, b[0] / 255, b[1] / 255, b[2] / 255, b[3])
                },
                setPointSize: function(b) {
                    c && a && c.uniform1f(y, b)
                },
                setSkipTranslation: function(b) {
                    c && a && c.uniform1i(n, !0 === b ? 1 : 0)
                },
                setTexture: function(b) {
                    c && a && c.uniform1i(R, b)
                },
                setDrawAsCircle: function(b) {
                    c && a && c.uniform1i(f, b ? 1 : 0)
                },
                reset: function() {
                    c && a && (c.uniform1i(t, 0),
                    c.uniform1i(f, 0))
                },
                setInverted: function(b) {
                    c && a && c.uniform1i(I, b)
                },
                destroy: function() {
                    c && a && (c.deleteProgram(a),
                    a = !1)
                }
            }
        }
    });
    u(h, "modules/boost/wgl-vbuffer.js", [], function() {
        return function(e, h, c) {
            function v() {
                g && (e.deleteBuffer(g),
                w = g = !1);
                a = 0;
                l = c || 2;
                q = []
            }
            var g = !1, w = !1, l = c || 2, m = !1, a = 0, q;
            return {
                destroy: v,
                bind: function() {
                    if (!g)
                        return !1;
                    e.vertexAttribPointer(w, l, e.FLOAT, !1, 0, 0)
                },
                data: q,
                build: function(a, c, t) {
                    var p;
                    q = a || [];
                    if (!(q && 0 !== q.length || m))
                        return v(),
                        !1;
                    l = t || l;
                    g && e.deleteBuffer(g);
                    m || (p = new Float32Array(q));
                    g = e.createBuffer();
                    e.bindBuffer(e.ARRAY_BUFFER, g);
                    e.bufferData(e.ARRAY_BUFFER, m || p, e.STATIC_DRAW);
                    w = e.getAttribLocation(h.program(), c);
                    e.enableVertexAttribArray(w);
                    return !0
                },
                render: function(a, c, t) {
                    var h = m ? m.length : q.length;
                    if (!g || !h)
                        return !1;
                    if (!a || a > h || 0 > a)
                        a = 0;
                    if (!c || c > h)
                        c = h;
                    e.drawArrays(e[(t || "points").toUpperCase()], a / l, (c - a) / l);
                    return !0
                },
                allocate: function(c) {
                    a = -1;
                    m = new Float32Array(4 * c)
                },
                push: function(c, e, t, h) {
                    m && (m[++a] = c,
                    m[++a] = e,
                    m[++a] = t,
                    m[++a] = h)
                }
            }
        }
    });
    u(h, "modules/boost/wgl-renderer.js", [h["modules/boost/wgl-shader.js"], h["modules/boost/wgl-vbuffer.js"], h["parts/Globals.js"]], function(e, h, c) {
        var v = c.win.document
          , g = c.merge
          , w = c.objEach
          , l = c.isNumber
          , m = c.some
          , a = c.Color
          , q = c.pick;
        return function(y) {
            function u(a) {
                var b, f;
                return a.isSeriesBoosting ? (b = !!a.options.stacking,
                f = a.xData || a.options.xData || a.processedXData,
                b = (b ? a.data : f || a.options.data).length,
                "treemap" === a.type ? b *= 12 : "heatmap" === a.type ? b *= 6 : ka[a.type] && (b *= 2),
                b) : 0
            }
            function t() {
                k.clear(k.COLOR_BUFFER_BIT | k.DEPTH_BUFFER_BIT)
            }
            function p(a, b) {
                function f(a) {
                    a && (b.colorData.push(a[0]),
                    b.colorData.push(a[1]),
                    b.colorData.push(a[2]),
                    b.colorData.push(a[3]))
                }
                function d(a, b, d, c, k) {
                    f(k);
                    z.usePreallocated ? K.push(a, b, d ? 1 : 0, c || 1) : (M.push(a),
                    M.push(b),
                    M.push(d ? 1 : 0),
                    M.push(c || 1))
                }
                function k() {
                    b.segments.length && (b.segments[b.segments.length - 1].to = M.length)
                }
                function n() {
                    b.segments.length && b.segments[b.segments.length - 1].from === M.length || (k(),
                    b.segments.push({
                        from: M.length
                    }))
                }
                function e(a, b, c, k, n) {
                    f(n);
                    d(a + c, b);
                    f(n);
                    d(a, b);
                    f(n);
                    d(a, b + k);
                    f(n);
                    d(a, b + k);
                    f(n);
                    d(a + c, b + k);
                    f(n);
                    d(a + c, b)
                }
                function h(a, f) {
                    z.useGPUTranslations || (b.skipTranslation = !0,
                    a.x = C.toPixels(a.x, !0),
                    a.y = w.toPixels(a.y, !0));
                    f ? M = [a.x, a.y, 0, 2].concat(M) : d(a.x, a.y, 0, 2)
                }
                var t = a.pointArrayMap && "low,high" === a.pointArrayMap.join(","), O = a.chart, G = a.options, r = !!G.stacking, g = G.data, p = a.xAxis.getExtremes(), l = p.min, p = p.max, I = a.yAxis.getExtremes(), v = I.min, I = I.max, q = a.xData || G.xData || a.processedXData, R = a.yData || G.yData || a.processedYData, S = a.zData || G.zData || a.processedZData, w = a.yAxis, C = a.xAxis, y = a.chart.plotWidth, u = !q || 0 === q.length, H = G.connectNulls, x = a.points || !1, D = !1, L = !1, B, E, Q, g = r ? a.data : q || g, q = {
                    x: Number.MAX_VALUE,
                    y: 0
                }, J = {
                    x: -Number.MAX_VALUE,
                    y: 0
                }, X = 0, Y = !1, A, P, F = -1, U = !1, V = !1, Z, ta = "undefined" === typeof O.index, ha = !1, ia = !1, N = !1, wa = ka[a.type], ja = !1, qa = !0, ra = !0, aa = G.zones || !1, W = !1, sa = G.threshold;
                if (!(G.boostData && 0 < G.boostData.length)) {
                    aa && (m(aa, function(a) {
                        if ("undefined" === typeof a.value)
                            return W = c.Color(a.color),
                            !0
                    }),
                    W || (W = a.pointAttribs && a.pointAttribs().fill || a.color,
                    W = c.Color(W)));
                    O.inverted && (y = a.chart.plotHeight);
                    a.closestPointRangePx = Number.MAX_VALUE;
                    n();
                    if (x && 0 < x.length)
                        b.skipTranslation = !0,
                        b.drawMode = "triangles",
                        x[0].node && x[0].node.levelDynamic && x.sort(function(a, b) {
                            if (a.node) {
                                if (a.node.levelDynamic > b.node.levelDynamic)
                                    return 1;
                                if (a.node.levelDynamic < b.node.levelDynamic)
                                    return -1
                            }
                            return 0
                        }),
                        x.forEach(function(b) {
                            var f = b.plotY, d;
                            "undefined" === typeof f || isNaN(f) || null === b.y || (f = b.shapeArgs,
                            d = O.styledMode ? b.series.colorAttribs(b) : d = b.series.pointAttribs(b),
                            b = d["stroke-width"] || 0,
                            E = c.color(d.fill).rgba,
                            E[0] /= 255,
                            E[1] /= 255,
                            E[2] /= 255,
                            "treemap" === a.type && (b = b || 1,
                            Q = c.color(d.stroke).rgba,
                            Q[0] /= 255,
                            Q[1] /= 255,
                            Q[2] /= 255,
                            e(f.x, f.y, f.width, f.height, Q),
                            b /= 2),
                            "heatmap" === a.type && O.inverted && (f.x = C.len - f.x,
                            f.y = w.len - f.y,
                            f.width = -f.width,
                            f.height = -f.height),
                            e(f.x + b, f.y + b, f.width - 2 * b, f.height - 2 * b, E))
                        });
                    else {
                        for (; F < g.length - 1; ) {
                            B = g[++F];
                            if (ta)
                                break;
                            u ? (x = B[0],
                            A = B[1],
                            g[F + 1] && (V = g[F + 1][0]),
                            g[F - 1] && (U = g[F - 1][0]),
                            3 <= B.length && (P = B[2],
                            B[2] > b.zMax && (b.zMax = B[2]),
                            B[2] < b.zMin && (b.zMin = B[2]))) : (x = B,
                            A = R[F],
                            g[F + 1] && (V = g[F + 1]),
                            g[F - 1] && (U = g[F - 1]),
                            S && S.length && (P = S[F],
                            S[F] > b.zMax && (b.zMax = S[F]),
                            S[F] < b.zMin && (b.zMin = S[F])));
                            if (H || null !== x && null !== A) {
                                if (V && V >= l && V <= p && (ha = !0),
                                U && U >= l && U <= p && (ia = !0),
                                t ? (u && (A = B.slice(1, 3)),
                                Z = A[0],
                                A = A[1]) : r && (x = B.x,
                                A = B.stackY,
                                Z = A - B.y),
                                null !== v && "undefined" !== typeof v && null !== I && "undefined" !== typeof I && (qa = A >= v && A <= I),
                                x > p && J.x < p && (J.x = x,
                                J.y = A),
                                x < l && q.x > l && (q.x = x,
                                q.y = A),
                                null !== A || !H)
                                    if (null !== A && (qa || ha || ia)) {
                                        if ((V >= l || x >= l) && (U <= p || x <= p) && (ja = !0),
                                        ja || ha || ia) {
                                            aa && (N = W.rgba,
                                            m(aa, function(a, b) {
                                                b = aa[b - 1];
                                                if ("undefined" !== typeof a.value && A <= a.value) {
                                                    if (!b || A >= b.value)
                                                        N = c.color(a.color).rgba;
                                                    return !0
                                                }
                                            }),
                                            N[0] /= 255,
                                            N[1] /= 255,
                                            N[2] /= 255);
                                            if (!z.useGPUTranslations && (b.skipTranslation = !0,
                                            x = C.toPixels(x, !0),
                                            A = w.toPixels(A, !0),
                                            x > y && "points" === b.drawMode))
                                                continue;
                                            if (wa) {
                                                B = Z;
                                                if (!1 === Z || "undefined" === typeof Z)
                                                    B = 0 > A ? A : 0;
                                                t || r || (B = Math.max(null === sa ? v : sa, v));
                                                z.useGPUTranslations || (B = w.toPixels(B, !0));
                                                d(x, B, 0, 0, N)
                                            }
                                            b.hasMarkers && ja && !1 !== D && (a.closestPointRangePx = Math.min(a.closestPointRangePx, Math.abs(x - D)));
                                            !z.useGPUTranslations && !z.usePreallocated && D && 1 > Math.abs(x - D) && L && 1 > Math.abs(A - L) ? z.debug.showSkipSummary && ++X : (G.step && !ra && d(x, L, 0, 2, N),
                                            d(x, A, 0, "bubble" === a.type ? P || 1 : 2, N),
                                            D = x,
                                            L = A,
                                            Y = !0,
                                            ra = !1)
                                        }
                                    } else
                                        n()
                            } else
                                n()
                        }
                        z.debug.showSkipSummary && console.log("skipped points:", X);
                        Y || !1 === H || "line_strip" !== a.drawMode || (q.x < Number.MAX_VALUE && h(q, !0),
                        J.x > -Number.MAX_VALUE && h(J))
                    }
                    k()
                }
            }
            function d() {
                D = [];
                X.data = M = [];
                Y = [];
                K && K.destroy()
            }
            function n(a) {
                b && (b.setUniform("xAxisTrans", a.transA),
                b.setUniform("xAxisMin", a.min),
                b.setUniform("xAxisMinPad", a.minPixelPadding),
                b.setUniform("xAxisPointRange", a.pointRange),
                b.setUniform("xAxisLen", a.len),
                b.setUniform("xAxisPos", a.pos),
                b.setUniform("xAxisCVSCoord", !a.horiz),
                b.setUniform("xAxisIsLog", a.isLog),
                b.setUniform("xAxisReversed", !!a.reversed))
            }
            function f(a) {
                b && (b.setUniform("yAxisTrans", a.transA),
                b.setUniform("yAxisMin", a.min),
                b.setUniform("yAxisMinPad", a.minPixelPadding),
                b.setUniform("yAxisPointRange", a.pointRange),
                b.setUniform("yAxisLen", a.len),
                b.setUniform("yAxisPos", a.pos),
                b.setUniform("yAxisCVSCoord", !a.horiz),
                b.setUniform("yAxisIsLog", a.isLog),
                b.setUniform("yAxisReversed", !!a.reversed))
            }
            function I(a, f) {
                b.setUniform("hasThreshold", a);
                b.setUniform("translatedThreshold", f)
            }
            function r(e) {
                if (e)
                    H = e.chartWidth || 800,
                    C = e.chartHeight || 400;
                else
                    return !1;
                if (!(k && H && C && b))
                    return !1;
                z.debug.timeRendering && console.time("gl rendering");
                k.canvas.width = H;
                k.canvas.height = C;
                b.bind();
                k.viewport(0, 0, H, C);
                b.setPMatrix([2 / H, 0, 0, 0, 0, -(2 / C), 0, 0, 0, 0, -2, 0, -1, 1, -1, 1]);
                1 < z.lineWidth && !c.isMS && k.lineWidth(z.lineWidth);
                K.build(X.data, "aVertexPosition", 4);
                K.bind();
                b.setInverted(e.inverted);
                D.forEach(function(d, t) {
                    var g = d.series.options, r = g.marker, p;
                    p = "undefined" !== typeof g.lineWidth ? g.lineWidth : 1;
                    var m = g.threshold
                      , O = l(m)
                      , v = d.series.yAxis.getThreshold(m)
                      , m = q(g.marker ? g.marker.enabled : null, d.series.xAxis.isRadial ? !0 : null, d.series.closestPointRangePx > 2 * ((g.marker ? g.marker.radius : 10) || 10))
                      , r = E[r && r.symbol || d.series.symbol] || E.circle;
                    if (!(0 === d.segments.length || d.segmentslength && d.segments[0].from === d.segments[0].to)) {
                        r.isReady && (k.bindTexture(k.TEXTURE_2D, r.handle),
                        b.setTexture(r.handle));
                        e.styledMode ? r = d.series.markerGroup && d.series.markerGroup.getStyle("fill") : (r = d.series.pointAttribs && d.series.pointAttribs().fill || d.series.color,
                        g.colorByPoint && (r = d.series.chart.options.colors[t]));
                        d.series.fillOpacity && g.fillOpacity && (r = (new a(r)).setOpacity(q(g.fillOpacity, 1)).get());
                        r = c.color(r).rgba;
                        z.useAlpha || (r[3] = 1);
                        "lines" === d.drawMode && z.useAlpha && 1 > r[3] && (r[3] /= 10);
                        "add" === g.boostBlending ? (k.blendFunc(k.SRC_ALPHA, k.ONE),
                        k.blendEquation(k.FUNC_ADD)) : "mult" === g.boostBlending || "multiply" === g.boostBlending ? k.blendFunc(k.DST_COLOR, k.ZERO) : "darken" === g.boostBlending ? (k.blendFunc(k.ONE, k.ONE),
                        k.blendEquation(k.FUNC_MIN)) : k.blendFuncSeparate(k.SRC_ALPHA, k.ONE_MINUS_SRC_ALPHA, k.ONE, k.ONE_MINUS_SRC_ALPHA);
                        b.reset();
                        0 < d.colorData.length && (b.setUniform("hasColor", 1),
                        t = h(k, b),
                        t.build(d.colorData, "aColor", 4),
                        t.bind());
                        b.setColor(r);
                        n(d.series.xAxis);
                        f(d.series.yAxis);
                        I(O, v);
                        "points" === d.drawMode && (g.marker && g.marker.radius ? b.setPointSize(2 * g.marker.radius) : b.setPointSize(1));
                        b.setSkipTranslation(d.skipTranslation);
                        "bubble" === d.series.type && b.setBubbleUniforms(d.series, d.zMin, d.zMax);
                        b.setDrawAsCircle(P[d.series.type] || !1);
                        if (0 < p || "line_strip" !== d.drawMode)
                            for (p = 0; p < d.segments.length; p++)
                                K.render(d.segments[p].from, d.segments[p].to, d.drawMode);
                        if (d.hasMarkers && m)
                            for (g.marker && g.marker.radius ? b.setPointSize(2 * g.marker.radius) : b.setPointSize(10),
                            b.setDrawAsCircle(!0),
                            p = 0; p < d.segments.length; p++)
                                K.render(d.segments[p].from, d.segments[p].to, "POINTS")
                    }
                });
                z.debug.timeRendering && console.timeEnd("gl rendering");
                y && y();
                d()
            }
            function R(a) {
                t();
                if (a.renderer.forExport)
                    return r(a);
                J ? r(a) : setTimeout(function() {
                    R(a)
                }, 1)
            }
            var b = !1
              , K = !1
              , k = !1
              , H = 0
              , C = 0
              , M = !1
              , Y = !1
              , X = {}
              , J = !1
              , D = []
              , E = {}
              , ka = {
                column: !0,
                columnrange: !0,
                bar: !0,
                area: !0,
                arearange: !0
            }
              , P = {
                scatter: !0,
                bubble: !0
            }
              , z = {
                pointSize: 1,
                lineWidth: 1,
                fillColor: "#AA00AA",
                useAlpha: !0,
                usePreallocated: !1,
                useGPUTranslations: !1,
                debug: {
                    timeRendering: !1,
                    timeSeriesProcessing: !1,
                    timeSetup: !1,
                    timeBufferCopy: !1,
                    timeKDTree: !1,
                    showSkipSummary: !1
                }
            };
            return X = {
                allocateBufferForSingleSeries: function(a) {
                    var b = 0;
                    z.usePreallocated && (a.isSeriesBoosting && (b = u(a)),
                    K.allocate(b))
                },
                pushSeries: function(a) {
                    0 < D.length && D[D.length - 1].hasMarkers && (D[D.length - 1].markerTo = Y.length);
                    z.debug.timeSeriesProcessing && console.time("building " + a.type + " series");
                    D.push({
                        segments: [],
                        markerFrom: Y.length,
                        colorData: [],
                        series: a,
                        zMin: Number.MAX_VALUE,
                        zMax: -Number.MAX_VALUE,
                        hasMarkers: a.options.marker ? !1 !== a.options.marker.enabled : !1,
                        showMarkers: !0,
                        drawMode: {
                            area: "lines",
                            arearange: "lines",
                            areaspline: "line_strip",
                            column: "lines",
                            columnrange: "lines",
                            bar: "lines",
                            line: "line_strip",
                            scatter: "points",
                            heatmap: "triangles",
                            treemap: "triangles",
                            bubble: "points"
                        }[a.type] || "line_strip"
                    });
                    p(a, D[D.length - 1]);
                    z.debug.timeSeriesProcessing && console.timeEnd("building " + a.type + " series")
                },
                setSize: function(a, d) {
                    H === a && C === d || !b || (H = a,
                    C = d,
                    b.bind(),
                    b.setPMatrix([2 / H, 0, 0, 0, 0, -(2 / C), 0, 0, 0, 0, -2, 0, -1, 1, -1, 1]))
                },
                inited: function() {
                    return J
                },
                setThreshold: I,
                init: function(a, f) {
                    function c(a, b) {
                        var d = {
                            isReady: !1,
                            texture: v.createElement("canvas"),
                            handle: k.createTexture()
                        }
                          , f = d.texture.getContext("2d");
                        E[a] = d;
                        d.texture.width = 512;
                        d.texture.height = 512;
                        f.mozImageSmoothingEnabled = !1;
                        f.webkitImageSmoothingEnabled = !1;
                        f.msImageSmoothingEnabled = !1;
                        f.imageSmoothingEnabled = !1;
                        f.strokeStyle = "rgba(255, 255, 255, 0)";
                        f.fillStyle = "#FFF";
                        b(f);
                        try {
                            k.activeTexture(k.TEXTURE0),
                            k.bindTexture(k.TEXTURE_2D, d.handle),
                            k.texImage2D(k.TEXTURE_2D, 0, k.RGBA, k.RGBA, k.UNSIGNED_BYTE, d.texture),
                            k.texParameteri(k.TEXTURE_2D, k.TEXTURE_WRAP_S, k.CLAMP_TO_EDGE),
                            k.texParameteri(k.TEXTURE_2D, k.TEXTURE_WRAP_T, k.CLAMP_TO_EDGE),
                            k.texParameteri(k.TEXTURE_2D, k.TEXTURE_MAG_FILTER, k.LINEAR),
                            k.texParameteri(k.TEXTURE_2D, k.TEXTURE_MIN_FILTER, k.LINEAR),
                            k.bindTexture(k.TEXTURE_2D, null),
                            d.isReady = !0
                        } catch (ba) {}
                    }
                    var n = 0
                      , g = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"];
                    J = !1;
                    if (!a)
                        return !1;
                    for (z.debug.timeSetup && console.time("gl setup"); n < g.length && !(k = a.getContext(g[n], {})); n++)
                        ;
                    if (k)
                        f || d();
                    else
                        return !1;
                    k.enable(k.BLEND);
                    k.blendFunc(k.SRC_ALPHA, k.ONE_MINUS_SRC_ALPHA);
                    k.disable(k.DEPTH_TEST);
                    k.depthFunc(k.LESS);
                    b = e(k);
                    if (!b)
                        return !1;
                    K = h(k, b);
                    c("circle", function(a) {
                        a.beginPath();
                        a.arc(256, 256, 256, 0, 2 * Math.PI);
                        a.stroke();
                        a.fill()
                    });
                    c("square", function(a) {
                        a.fillRect(0, 0, 512, 512)
                    });
                    c("diamond", function(a) {
                        a.beginPath();
                        a.moveTo(256, 0);
                        a.lineTo(512, 256);
                        a.lineTo(256, 512);
                        a.lineTo(0, 256);
                        a.lineTo(256, 0);
                        a.fill()
                    });
                    c("triangle", function(a) {
                        a.beginPath();
                        a.moveTo(0, 512);
                        a.lineTo(256, 0);
                        a.lineTo(512, 512);
                        a.lineTo(0, 512);
                        a.fill()
                    });
                    c("triangle-down", function(a) {
                        a.beginPath();
                        a.moveTo(0, 0);
                        a.lineTo(256, 512);
                        a.lineTo(512, 0);
                        a.lineTo(0, 0);
                        a.fill()
                    });
                    J = !0;
                    z.debug.timeSetup && console.timeEnd("gl setup");
                    return !0
                },
                render: R,
                settings: z,
                valid: function() {
                    return !1 !== k
                },
                clear: t,
                flush: d,
                setXAxis: n,
                setYAxis: f,
                data: M,
                gl: function() {
                    return k
                },
                allocateBuffer: function(a) {
                    var b = 0;
                    z.usePreallocated && (a.series.forEach(function(a) {
                        a.isSeriesBoosting && (b += u(a))
                    }),
                    K.allocate(b))
                },
                destroy: function() {
                    d();
                    K.destroy();
                    b.destroy();
                    k && (w(E, function(a) {
                        E[a].handle && k.deleteTexture(E[a].handle)
                    }),
                    k.canvas.width = 1,
                    k.canvas.height = 1)
                },
                setOptions: function(a) {
                    g(!0, z, a)
                }
            }
        }
    });
    u(h, "modules/boost/boost-attach.js", [h["parts/Globals.js"], h["modules/boost/wgl-renderer.js"]], function(e, h) {
        var c = e.win.document
          , v = c.createElement("canvas");
        return function(g, w) {
            var l = g.chartWidth
              , m = g.chartHeight
              , a = g
              , q = g.seriesGroup || w.group
              , y = c.implementation.hasFeature("www.http://w3.org/TR/SVG11/feature#Extensibility", "1.1")
              , a = g.isChartSeriesBoosting() ? g : w
              , y = !1;
            a.renderTarget || (a.canvas = v,
            g.renderer.forExport || !y ? (a.renderTarget = g.renderer.image("", 0, 0, l, m).addClass("highcharts-boost-canvas").add(q),
            a.boostClear = function() {
                a.renderTarget.attr({
                    href: ""
                })
            }
            ,
            a.boostCopy = function() {
                a.boostResizeTarget();
                a.renderTarget.attr({
                    href: a.canvas.toDataURL("image/png")
                })
            }
            ) : (a.renderTargetFo = g.renderer.createElement("foreignObject").add(q),
            a.renderTarget = c.createElement("canvas"),
            a.renderTargetCtx = a.renderTarget.getContext("2d"),
            a.renderTargetFo.element.appendChild(a.renderTarget),
            a.boostClear = function() {
                a.renderTarget.width = a.canvas.width;
                a.renderTarget.height = a.canvas.height
            }
            ,
            a.boostCopy = function() {
                a.renderTarget.width = a.canvas.width;
                a.renderTarget.height = a.canvas.height;
                a.renderTargetCtx.drawImage(a.canvas, 0, 0)
            }
            ),
            a.boostResizeTarget = function() {
                l = g.chartWidth;
                m = g.chartHeight;
                (a.renderTargetFo || a.renderTarget).attr({
                    x: 0,
                    y: 0,
                    width: l,
                    height: m
                }).css({
                    pointerEvents: "none",
                    mixedBlendMode: "normal",
                    opacity: 1
                });
                a instanceof e.Chart && a.markerGroup.translate(g.plotLeft, g.plotTop)
            }
            ,
            a.boostClipRect = g.renderer.clipRect(),
            (a.renderTargetFo || a.renderTarget).clip(a.boostClipRect),
            a instanceof e.Chart && (a.markerGroup = a.renderer.g().add(q),
            a.markerGroup.translate(w.xAxis.pos, w.yAxis.pos)));
            a.canvas.width = l;
            a.canvas.height = m;
            a.boostClipRect.attr(g.getBoostClipRect(a));
            a.boostResizeTarget();
            a.boostClear();
            a.ogl || (a.ogl = h(function() {
                a.ogl.settings.debug.timeBufferCopy && console.time("buffer copy");
                a.boostCopy();
                a.ogl.settings.debug.timeBufferCopy && console.timeEnd("buffer copy")
            }),
            a.ogl.init(a.canvas) || e.error("[highcharts boost] - unable to init WebGL renderer"),
            a.ogl.setOptions(g.options.boost || {}),
            a instanceof e.Chart && a.ogl.allocateBuffer(g));
            a.ogl.setSize(l, m);
            return a.ogl
        }
    });
    u(h, "modules/boost/boost-utils.js", [h["parts/Globals.js"], h["modules/boost/boostable-map.js"], h["modules/boost/boost-attach.js"]], function(e, h, c) {
        function v() {
            var a = Array.prototype.slice.call(arguments)
              , c = -Number.MAX_VALUE;
            a.forEach(function(a) {
                if ("undefined" !== typeof a && null !== a && "undefined" !== typeof a.length && 0 < a.length)
                    return c = a.length,
                    !0
            });
            return c
        }
        function g(a, c, d) {
            a && c.renderTarget && c.canvas && !(d || c.chart).isChartSeriesBoosting() && a.render(d || c.chart)
        }
        function w(a, c) {
            a && c.renderTarget && c.canvas && !c.chart.isChartSeriesBoosting() && a.allocateBufferForSingleSeries(c)
        }
        function l(c, g, d, n, f, e) {
            f = f || 0;
            n = n || 3E3;
            for (var h = f + n, t = !0; t && f < h && f < c.length; )
                t = g(c[f], f),
                ++f;
            t && (f < c.length ? e ? l(c, g, d, n, f, e) : a.requestAnimationFrame ? a.requestAnimationFrame(function() {
                l(c, g, d, n, f)
            }) : setTimeout(function() {
                l(c, g, d, n, f)
            }) : d && d())
        }
        function m() {
            var c = 0, g, d = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"], n = !1;
            if ("undefined" !== typeof a.WebGLRenderingContext)
                for (g = q.createElement("canvas"); c < d.length; c++)
                    try {
                        if (n = g.getContext(d[c]),
                        "undefined" !== typeof n && null !== n)
                            return !0
                    } catch (f) {}
            return !1
        }
        var a = e.win
          , q = a.document
          , y = e.pick
          , u = {
            patientMax: v,
            boostEnabled: function(a) {
                return y(a && a.options && a.options.boost && a.options.boost.enabled, !0)
            },
            shouldForceChartSeriesBoosting: function(a) {
                var c = 0, d = 0, g = y(a.options.boost && a.options.boost.allowForce, !0), f;
                if ("undefined" !== typeof a.boostForceChartBoost)
                    return a.boostForceChartBoost;
                if (1 < a.series.length)
                    for (var e = 0; e < a.series.length; e++)
                        f = a.series[e],
                        0 !== f.options.boostThreshold && !1 !== f.visible && "heatmap" !== f.type && (h[f.type] && ++d,
                        v(f.processedXData, f.options.data, f.points) >= (f.options.boostThreshold || Number.MAX_VALUE) && ++c);
                a.boostForceChartBoost = g && (d === a.series.length && 0 < c || 5 < c);
                return a.boostForceChartBoost
            },
            renderIfNotSeriesBoosting: g,
            allocateIfNotSeriesBoosting: w,
            eachAsync: l,
            hasWebGLSupport: m,
            pointDrawHandler: function(a) {
                var e = !0;
                this.chart.options && this.chart.options.boost && (e = "undefined" === typeof this.chart.options.boost.enabled ? !0 : this.chart.options.boost.enabled);
                if (!e || !this.isSeriesBoosting)
                    return a.call(this);
                this.chart.isBoosting = !0;
                if (a = c(this.chart, this))
                    w(a, this),
                    a.pushSeries(this);
                g(a, this)
            }
        };
        e.hasWebGLSupport = m;
        return u
    });
    u(h, "modules/boost/boost-init.js", [h["parts/Globals.js"], h["modules/boost/boost-utils.js"], h["modules/boost/boost-attach.js"]], function(e, h, c) {
        var v = e.addEvent, g = e.fireEvent, w = e.extend, l = e.Series, m = e.seriesTypes, a = e.wrap, q = function() {}, y = h.eachAsync, u = h.pointDrawHandler, t = h.allocateIfNotSeriesBoosting, p = h.renderIfNotSeriesBoosting, d = h.shouldForceChartSeriesBoosting, n;
        return function() {
            e.extend(l.prototype, {
                renderCanvas: function() {
                    function a(a, b) {
                        var d, f, c = !1, e = "undefined" === typeof l.index, g = !0;
                        if (!e && (oa ? (d = a[0],
                        f = a[1]) : (d = a,
                        f = w[b]),
                        la ? (oa && (f = a.slice(1, 3)),
                        c = f[0],
                        f = f[1]) : ma && (d = a.x,
                        f = a.stackY,
                        c = f - a.y),
                        ua || (g = f >= D && f <= E),
                        null !== f && d >= C && d <= J && g))
                            if (a = k.toPixels(d, !0),
                            z) {
                                if (void 0 === T || a === P) {
                                    la || (c = f);
                                    if (void 0 === ca || f > ba)
                                        ba = f,
                                        ca = b;
                                    if (void 0 === T || c < ea)
                                        ea = c,
                                        T = b
                                }
                                a !== P && (void 0 !== T && (f = m.toPixels(ba, !0),
                                da = m.toPixels(ea, !0),
                                ga(a, f, ca),
                                da !== f && ga(a, da, T)),
                                T = ca = void 0,
                                P = a)
                            } else
                                f = Math.ceil(m.toPixels(f, !0)),
                                ga(a, f, b);
                        return !e
                    }
                    function d() {
                        g(e, "renderedCanvas");
                        delete e.buildKDTree;
                        e.buildKDTree();
                        fa.debug.timeKDTree && console.timeEnd("kd tree building")
                    }
                    var e = this, h = e.options || {}, b = !1, l = e.chart, k = this.xAxis, m = this.yAxis, v = h.xData || e.processedXData, w = h.yData || e.processedYData, u = h.data, b = k.getExtremes(), C = b.min, J = b.max, b = m.getExtremes(), D = b.min, E = b.max, L = {}, P, z = !!e.sampling, O, G = !1 !== h.enableMouseTracking, da = m.getThreshold(h.threshold), la = e.pointArrayMap && "low,high" === e.pointArrayMap.join(","), ma = !!h.stacking, na = e.cropStart || 0, ua = e.requireSorting, oa = !v, ea, ba, T, ca, fa, va = "x" === h.findNearestPointBy, pa = this.xData || this.options.xData || this.processedXData || !1, ga = function(a, b, f) {
                        a = Math.ceil(a);
                        n = va ? a : a + "," + b;
                        G && !L[n] && (L[n] = !0,
                        l.inverted && (a = k.len - a,
                        b = m.len - b),
                        O.push({
                            x: pa ? pa[na + f] : !1,
                            clientX: a,
                            plotX: a,
                            plotY: b,
                            i: na + f
                        }))
                    }, b = c(l, e);
                    l.isBoosting = !0;
                    fa = b.settings;
                    if (this.visible) {
                        if (this.points || this.graph)
                            this.animate = null,
                            this.destroyGraphics();
                        l.isChartSeriesBoosting() ? (this.markerGroup && this.markerGroup !== l.markerGroup && this.markerGroup.destroy(),
                        this.markerGroup = l.markerGroup,
                        this.renderTarget && (this.renderTarget = this.renderTarget.destroy())) : (this.markerGroup === l.markerGroup && (this.markerGroup = void 0),
                        this.markerGroup = e.plotGroup("markerGroup", "markers", !0, 1, l.seriesGroup));
                        O = this.points = [];
                        e.buildKDTree = q;
                        b && (t(b, this),
                        b.pushSeries(e),
                        p(b, this, l));
                        l.renderer.forExport || (fa.debug.timeKDTree && console.time("kd tree building"),
                        y(ma ? e.data : v || u, a, d))
                    }
                }
            });
            ["heatmap", "treemap"].forEach(function(f) {
                m[f] && a(m[f].prototype, "drawPoints", u)
            });
            m.bubble && (delete m.bubble.prototype.buildKDTree,
            a(m.bubble.prototype, "markerAttribs", function(a) {
                return this.isSeriesBoosting ? !1 : a.apply(this, [].slice.call(arguments, 1))
            }));
            m.scatter.prototype.fill = !0;
            w(m.area.prototype, {
                fill: !0,
                fillOpacity: !0,
                sampling: !0
            });
            w(m.column.prototype, {
                fill: !0,
                sampling: !0
            });
            e.Chart.prototype.callbacks.push(function(a) {
                v(a, "predraw", function() {
                    a.boostForceChartBoost = void 0;
                    a.boostForceChartBoost = d(a);
                    a.isBoosting = !1;
                    !a.isChartSeriesBoosting() && a.didBoost && (a.didBoost = !1);
                    a.boostClear && a.boostClear();
                    a.canvas && a.ogl && a.isChartSeriesBoosting() && (a.didBoost = !0,
                    a.ogl.allocateBuffer(a));
                    a.markerGroup && a.xAxis && 0 < a.xAxis.length && a.yAxis && 0 < a.yAxis.length && a.markerGroup.translate(a.xAxis[0].pos, a.yAxis[0].pos)
                });
                v(a, "render", function() {
                    a.ogl && a.isChartSeriesBoosting() && a.ogl.render(a)
                })
            })
        }
    });
    u(h, "modules/boost/boost-overrides.js", [h["parts/Globals.js"], h["modules/boost/boost-utils.js"], h["modules/boost/boostables.js"], h["modules/boost/boostable-map.js"]], function(e, h, c, u) {
        var g = h.boostEnabled
          , v = h.shouldForceChartSeriesBoosting;
        h = e.Chart;
        var l = e.Series
          , m = e.Point
          , a = e.seriesTypes
          , q = e.addEvent
          , y = e.isNumber
          , C = e.pick
          , t = e.wrap
          , p = e.getOptions().plotOptions;
        h.prototype.isChartSeriesBoosting = function() {
            return C(this.options.boost && this.options.boost.seriesThreshold, 50) <= this.series.length || v(this)
        }
        ;
        h.prototype.getBoostClipRect = function(a) {
            var d = {
                x: this.plotLeft,
                y: this.plotTop,
                width: this.plotWidth,
                height: this.plotHeight
            };
            a === this && this.yAxis.forEach(function(a) {
                d.y = Math.min(a.pos, d.y);
                d.height = Math.max(a.pos - this.plotTop + a.len, d.height)
            }, this);
            return d
        }
        ;
        l.prototype.getPoint = function(a) {
            var d = a
              , c = this.xData || this.options.xData || this.processedXData || !1;
            !a || a instanceof this.pointClass || (d = (new this.pointClass).init(this, this.options.data[a.i], c ? c[a.i] : void 0),
            d.category = C(this.xAxis.categories ? this.xAxis.categories[d.x] : d.x, d.x),
            d.dist = a.dist,
            d.distX = a.distX,
            d.plotX = a.plotX,
            d.plotY = a.plotY,
            d.index = a.i);
            return d
        }
        ;
        t(l.prototype, "searchPoint", function(a) {
            return this.getPoint(a.apply(this, [].slice.call(arguments, 1)))
        });
        t(m.prototype, "haloPath", function(a) {
            var d, c = this.series, e = this.plotX, g = this.plotY, h = c.chart.inverted;
            c.isSeriesBoosting && h && (this.plotX = c.yAxis.len - g,
            this.plotY = c.xAxis.len - e);
            d = a.apply(this, Array.prototype.slice.call(arguments, 1));
            c.isSeriesBoosting && h && (this.plotX = e,
            this.plotY = g);
            return d
        });
        t(l.prototype, "markerAttribs", function(a, c) {
            var d, e = c.plotX, g = c.plotY, h = this.chart.inverted;
            this.isSeriesBoosting && h && (c.plotX = this.yAxis.len - g,
            c.plotY = this.xAxis.len - e);
            d = a.apply(this, Array.prototype.slice.call(arguments, 1));
            this.isSeriesBoosting && h && (c.plotX = e,
            c.plotY = g);
            return d
        });
        q(l, "destroy", function() {
            var a = this
              , c = a.chart;
            c.markerGroup === a.markerGroup && (a.markerGroup = null);
            c.hoverPoints && (c.hoverPoints = c.hoverPoints.filter(function(c) {
                return c.series === a
            }));
            c.hoverPoint && c.hoverPoint.series === a && (c.hoverPoint = null)
        });
        t(l.prototype, "getExtremes", function(a) {
            if (!this.isSeriesBoosting || !this.hasExtremes || !this.hasExtremes())
                return a.apply(this, Array.prototype.slice.call(arguments, 1))
        });
        ["translate", "generatePoints", "drawTracker", "drawPoints", "render"].forEach(function(c) {
            function d(a) {
                var d = this.options.stacking && ("translate" === c || "generatePoints" === c);
                if (!this.isSeriesBoosting || d || !g(this.chart) || "heatmap" === this.type || "treemap" === this.type || !u[this.type] || 0 === this.options.boostThreshold)
                    a.call(this);
                else if (this[c + "Canvas"])
                    this[c + "Canvas"]()
            }
            t(l.prototype, c, d);
            "translate" === c && "column bar arearange columnrange heatmap treemap".split(" ").forEach(function(f) {
                a[f] && t(a[f].prototype, c, d)
            })
        });
        t(l.prototype, "processData", function(a) {
            function c(a) {
                return d.chart.isChartSeriesBoosting() || (a ? a.length : 0) >= (d.options.boostThreshold || Number.MAX_VALUE)
            }
            var d = this
              , e = this.options.data;
            g(this.chart) && u[this.type] ? (c(e) && "heatmap" !== this.type && "treemap" !== this.type && !this.options.stacking && this.hasExtremes && this.hasExtremes(!0) || (a.apply(this, Array.prototype.slice.call(arguments, 1)),
            e = this.processedXData),
            (this.isSeriesBoosting = c(e)) ? this.enterBoost() : this.exitBoost && this.exitBoost()) : a.apply(this, Array.prototype.slice.call(arguments, 1))
        });
        q(l, "hide", function() {
            this.canvas && this.renderTarget && (this.ogl && this.ogl.clear(),
            this.boostClear())
        });
        l.prototype.enterBoost = function() {
            this.alteredByBoost = [];
            ["allowDG", "directTouch", "stickyTracking"].forEach(function(a) {
                this.alteredByBoost.push({
                    prop: a,
                    val: this[a],
                    own: this.hasOwnProperty(a)
                })
            }, this);
            this.directTouch = this.allowDG = !1;
            this.stickyTracking = !0;
            this.animate = null;
            this.labelBySeries && (this.labelBySeries = this.labelBySeries.destroy())
        }
        ;
        l.prototype.exitBoost = function() {
            (this.alteredByBoost || []).forEach(function(a) {
                a.own ? this[a.prop] = a.val : delete this[a.prop]
            }, this);
            this.boostClear && this.boostClear()
        }
        ;
        l.prototype.hasExtremes = function(a) {
            var c = this.options
              , d = this.xAxis && this.xAxis.options
              , e = this.yAxis && this.yAxis.options
              , g = this.colorAxis && this.colorAxis.options;
            return c.data.length > (c.boostThreshold || Number.MAX_VALUE) && y(e.min) && y(e.max) && (!a || y(d.min) && y(d.max)) && (!g || y(g.min) && y(g.max))
        }
        ;
        l.prototype.destroyGraphics = function() {
            var a = this, c = this.points, e, g;
            if (c)
                for (g = 0; g < c.length; g += 1)
                    (e = c[g]) && e.destroyElements && e.destroyElements();
            ["graph", "area", "tracker"].forEach(function(c) {
                a[c] && (a[c] = a[c].destroy())
            })
        }
        ;
        c.forEach(function(c) {
            p[c] && (p[c].boostThreshold = 5E3,
            p[c].boostData = [],
            a[c].prototype.fillOpacity = !0)
        })
    });
    u(h, "modules/boost/named-colors.js", [h["parts/Globals.js"]], function(e) {
        var h = {
            aliceblue: "#f0f8ff",
            antiquewhite: "#faebd7",
            aqua: "#00ffff",
            aquamarine: "#7fffd4",
            azure: "#f0ffff",
            beige: "#f5f5dc",
            bisque: "#ffe4c4",
            black: "#000000",
            blanchedalmond: "#ffebcd",
            blue: "#0000ff",
            blueviolet: "#8a2be2",
            brown: "#a52a2a",
            burlywood: "#deb887",
            cadetblue: "#5f9ea0",
            chartreuse: "#7fff00",
            chocolate: "#d2691e",
            coral: "#ff7f50",
            cornflowerblue: "#6495ed",
            cornsilk: "#fff8dc",
            crimson: "#dc143c",
            cyan: "#00ffff",
            darkblue: "#00008b",
            darkcyan: "#008b8b",
            darkgoldenrod: "#b8860b",
            darkgray: "#a9a9a9",
            darkgreen: "#006400",
            darkkhaki: "#bdb76b",
            darkmagenta: "#8b008b",
            darkolivegreen: "#556b2f",
            darkorange: "#ff8c00",
            darkorchid: "#9932cc",
            darkred: "#8b0000",
            darksalmon: "#e9967a",
            darkseagreen: "#8fbc8f",
            darkslateblue: "#483d8b",
            darkslategray: "#2f4f4f",
            darkturquoise: "#00ced1",
            darkviolet: "#9400d3",
            deeppink: "#ff1493",
            deepskyblue: "#00bfff",
            dimgray: "#696969",
            dodgerblue: "#1e90ff",
            feldspar: "#d19275",
            firebrick: "#b22222",
            floralwhite: "#fffaf0",
            forestgreen: "#228b22",
            fuchsia: "#ff00ff",
            gainsboro: "#dcdcdc",
            ghostwhite: "#f8f8ff",
            gold: "#ffd700",
            goldenrod: "#daa520",
            gray: "#808080",
            green: "#008000",
            greenyellow: "#adff2f",
            honeydew: "#f0fff0",
            hotpink: "#ff69b4",
            indianred: "#cd5c5c",
            indigo: "#4b0082",
            ivory: "#fffff0",
            khaki: "#f0e68c",
            lavender: "#e6e6fa",
            lavenderblush: "#fff0f5",
            lawngreen: "#7cfc00",
            lemonchiffon: "#fffacd",
            lightblue: "#add8e6",
            lightcoral: "#f08080",
            lightcyan: "#e0ffff",
            lightgoldenrodyellow: "#fafad2",
            lightgrey: "#d3d3d3",
            lightgreen: "#90ee90",
            lightpink: "#ffb6c1",
            lightsalmon: "#ffa07a",
            lightseagreen: "#20b2aa",
            lightskyblue: "#87cefa",
            lightslateblue: "#8470ff",
            lightslategray: "#778899",
            lightsteelblue: "#b0c4de",
            lightyellow: "#ffffe0",
            lime: "#00ff00",
            limegreen: "#32cd32",
            linen: "#faf0e6",
            magenta: "#ff00ff",
            maroon: "#800000",
            mediumaquamarine: "#66cdaa",
            mediumblue: "#0000cd",
            mediumorchid: "#ba55d3",
            mediumpurple: "#9370d8",
            mediumseagreen: "#3cb371",
            mediumslateblue: "#7b68ee",
            mediumspringgreen: "#00fa9a",
            mediumturquoise: "#48d1cc",
            mediumvioletred: "#c71585",
            midnightblue: "#191970",
            mintcream: "#f5fffa",
            mistyrose: "#ffe4e1",
            moccasin: "#ffe4b5",
            navajowhite: "#ffdead",
            navy: "#000080",
            oldlace: "#fdf5e6",
            olive: "#808000",
            olivedrab: "#6b8e23",
            orange: "#ffa500",
            orangered: "#ff4500",
            orchid: "#da70d6",
            palegoldenrod: "#eee8aa",
            palegreen: "#98fb98",
            paleturquoise: "#afeeee",
            palevioletred: "#d87093",
            papayawhip: "#ffefd5",
            peachpuff: "#ffdab9",
            peru: "#cd853f",
            pink: "#ffc0cb",
            plum: "#dda0dd",
            powderblue: "#b0e0e6",
            purple: "#800080",
            red: "#ff0000",
            rosybrown: "#bc8f8f",
            royalblue: "#4169e1",
            saddlebrown: "#8b4513",
            salmon: "#fa8072",
            sandybrown: "#f4a460",
            seagreen: "#2e8b57",
            seashell: "#fff5ee",
            sienna: "#a0522d",
            silver: "#c0c0c0",
            skyblue: "#87ceeb",
            slateblue: "#6a5acd",
            slategray: "#708090",
            snow: "#fffafa",
            springgreen: "#00ff7f",
            steelblue: "#4682b4",
            tan: "#d2b48c",
            teal: "#008080",
            thistle: "#d8bfd8",
            tomato: "#ff6347",
            turquoise: "#40e0d0",
            violet: "#ee82ee",
            violetred: "#d02090",
            wheat: "#f5deb3",
            white: "#ffffff",
            whitesmoke: "#f5f5f5",
            yellow: "#ffff00",
            yellowgreen: "#9acd32"
        };
        return e.Color.prototype.names = h
    });
    u(h, "modules/boost/boost.js", [h["parts/Globals.js"], h["modules/boost/boost-utils.js"], h["modules/boost/boost-init.js"]], function(e, h, c) {
        h = h.hasWebGLSupport;
        h() ? c() : "undefined" !== typeof e.initCanvasBoost ? e.initCanvasBoost() : e.error(26)
    });
    u(h, "masters/modules/boost.src.js", [], function() {})
});
//# sourceMappingURL=boost.js.map
