var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var CDMyC3;
(function (CDMyC3) {
    CDMyC3.eC3Engine = "CDMyC3.TheC3Service";
    var TheC3Service = (function () {
        function TheC3Service() {
            var _this = this;
            this.MyBaseEngine = null;
            this.MyBaseEngine = cdeCommCore.StartNewEngine(CDMyC3.eC3Engine);
            this.MyBaseEngine.RegisterIncomingMessage(function (pProcessMessage) { _this.HandleMessage(pProcessMessage); });
        }
        TheC3Service.StartEngine = function () {
            TheC3Service.MyEngine = new TheC3Service();
            cdeNMI.TheNMIService.cdeGetStyle("/plugins/P172/CSS/C3.min.css", null);
            cdeNMI.TheNMIService.cdeGetStyle("/plugins/P172/CSS/cssDark.min.css", null);
            cdeNMI.TheNMIService.cdeGetScript("/plugins/P172/JS/d3.min.js", function () {
                cdeNMI.TheNMIService.cdeGetScript("/plugins/P172/JS/c3.min.js", function () {
                    cdeNMI.TheNMIService.cdeGetScript("/plugins/P172/JS/smoothie.js", function () {
                        cdeNMI.TheNMIService.cdeGetScript("/plugins/P172/JS/cytoscape.min.js", function () {
                            TheC3Service.HaveCtrlsLoaded = true;
                            cdeNMI.MyTCF.RegisterControlName("Speed Gauge", "CDMyC3.ctrlC3SpeedGauge:" + CDMyC3.eC3Engine);
                            cdeNMI.MyTCF.RegisterControlName("Live Chart", "CDMyC3.ctrlProLiveChart:" + CDMyC3.eC3Engine);
                            cdeNMI.MyTCF.RegisterControlName("Stack Chart", "CDMyC3.ctrlC3StackChart:" + CDMyC3.eC3Engine);
                            cdeNMI.MyTCF.RegisterControlName("Cyto Chart", "CDMyC3.ctrlProCytoChart:" + CDMyC3.eC3Engine);
                            cdeNMI.MyTCF.RegisterControlName("Line Chart", "CDMyC3.ctrlC3Line:" + CDMyC3.eC3Engine);
                            cde.MyBaseAssets.MyEngines[CDMyC3.eC3Engine].FireEngineIsReady();
                            cdeNMI.FireEvent(false, "EngineReady", CDMyC3.eC3Engine);
                        });
                    });
                });
            });
        };
        TheC3Service.prototype.HandleMessage = function (pProcessMessage) {
            var pMSG = pProcessMessage.Message;
            if (!pMSG)
                return;
            var tCmd = pMSG.TXT.split(':');
            switch (tCmd[0]) {
                case 'CHART_DATA':
                    if (CDMyC3.TheC3Service.MyChartScreens[tCmd[1]])
                        CDMyC3.TheC3Service.MyChartScreens[tCmd[1]].SetProperty("Series", pMSG.PLS);
                    break;
                case 'CHART_MODEL':
                    if (CDMyC3.TheC3Service.MyChartScreens[tCmd[1]])
                        CDMyC3.TheC3Service.MyChartScreens[tCmd[1]].SetProperty("DataModel", pMSG.PLS);
                    break;
                default:
                    break;
            }
        };
        TheC3Service.HaveCtrlsLoaded = false;
        TheC3Service.MyChartScreens = new Array();
        return TheC3Service;
    }());
    CDMyC3.TheC3Service = TheC3Service;
    var ctrlC3SpeedGauge = (function (_super) {
        __extends(ctrlC3SpeedGauge, _super);
        function ctrlC3SpeedGauge() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ctrlC3SpeedGauge.prototype.InitControl = function (pTargetElem, pTRF, pPropertyBag, pScreenID) {
            _super.prototype.InitControl.call(this, pTargetElem, pTRF, pPropertyBag, pScreenID);
            this.SetProperty("StartAngle", "225");
            this.SetProperty("EndAngle", "270");
            return true;
        };
        ctrlC3SpeedGauge.prototype.SetProperty = function (pName, pValue) {
            _super.prototype.SetProperty.call(this, pName, pValue);
        };
        return ctrlC3SpeedGauge;
    }(cdeNMI.ctrlCircularGauge2));
    CDMyC3.ctrlC3SpeedGauge = ctrlC3SpeedGauge;
    var ctrlProCytoChart = (function (_super) {
        __extends(ctrlProCytoChart, _super);
        function ctrlProCytoChart() {
            var _this = _super.call(this, null, null) || this;
            _this.myChartContainer = null;
            _this.myChartControl = null;
            _this.myPropertyBag = null;
            return _this;
        }
        ctrlProCytoChart.prototype.SetProperty = function (pName, pValue) {
            _super.prototype.SetProperty.call(this, pName, pValue);
            if (TheC3Service.HaveCtrlsLoaded) {
                if (pName === "Elements" && pValue) {
                    this.RenderChart(pValue);
                }
                else if (pName === "Layout" && pValue && this.myChartControl) {
                    this.myChartControl.layout({ name: pValue });
                }
                else if (pName === "UpdateNode" && pValue && this.myChartControl) {
                    var tUpd = JSON.parse(pValue);
                    var tNode = this.myChartControl.getElementById(tUpd.data.id);
                    tNode.data(tUpd.data);
                    var tns = this.myChartControl.$('#' + tUpd.data.id);
                    tns.classes(tUpd.classes);
                }
                else if (pName === "AddNode" && pValue && this.myChartControl) {
                    var tUpd = JSON.parse(pValue);
                    this.myChartControl.add(tUpd);
                }
                else if (pName === "TriggerSnapshot" && this.myChartControl) {
                    var tRaw = cdeNMI.convertBase64ToBinary(this.myChartControl.png());
                    cde.MyContentEngine.SaveFile(tRaw, cdeNMI.DateToMini(new Date()) + ".PNG", "image/png", false);
                }
            }
        };
        ctrlProCytoChart.prototype.AddValueToChart = function (tVal, tSerNo) {
            if (tSerNo === void 0) { tSerNo = "Data"; }
        };
        ctrlProCytoChart.prototype.RenderChart = function (pElements) {
            if (!this.myChartContainer)
                return;
            var tElements = {
                nodes: [
                    { data: { id: 'a' } }
                ],
                edges: [
                    { data: { id: 'ae', weight: 1, source: 'a', target: 'a' } }
                ]
            };
            if (pElements)
                tElements = JSON.parse(pElements);
            else if (this.GetProperty("Elements"))
                tElements = JSON.parse(this.GetProperty("Elements"));
            else if (this.GetSetting("Elements"))
                tElements = JSON.parse(this.GetSetting("Elements"));
            var tLayout = "circle";
            if (this.GetSetting("Layout"))
                tLayout = this.GetSetting("Layout");
            if (this.GetProperty("Layout"))
                tLayout = this.GetProperty("Layout");
            this.myChartControl = cytoscape({
                container: this.myChartContainer.GetElement(),
                boxSelectionEnabled: false,
                autounselectify: true,
                style: cytoscape.stylesheet()
                    .selector('node')
                    .css({
                    'content': 'data(label)',
                    'text-valign': 'center',
                    'color': 'white',
                    'text-outline-width': 2,
                    'background-color': '#52CFEA',
                    'text-outline-color': '#52CFEA'
                })
                    .selector('edge')
                    .css({
                    'curve-style': 'bezier',
                    'target-arrow-shape': 'triangle',
                    'width': 4,
                    'line-color': '#ddd',
                    'target-arrow-color': '#000000'
                })
                    .selector('.nodeClass')
                    .css({
                    'background-color': '#61bffc',
                    'text-outline-color': '#61bffc'
                })
                    .selector('.nodeJS')
                    .css({
                    'background-color': '#000000',
                    'text-outline-color': '#000000'
                })
                    .selector('.nodeCloud')
                    .css({
                    'background-color': '#888888',
                    'text-outline-color': '#888888'
                })
                    .selector('.nodeForeign')
                    .css({
                    'background-color': '#880088',
                    'text-outline-color': '#880088'
                })
                    .selector('.nodeWaiting')
                    .css({
                    'background-color': '#ddd',
                    'text-outline-color': '#ddd'
                })
                    .selector('.nodeWarning')
                    .css({
                    'background-color': 'orange',
                    'text-outline-color': 'orange'
                })
                    .selector('.nodeNormal')
                    .css({
                    'background-color': '#52CFEA',
                    'text-outline-color': '#52CFEA'
                })
                    .selector('.nodeError')
                    .css({
                    'background-color': 'red',
                    'text-outline-color': 'red'
                })
                    .selector('.highlighted')
                    .css({
                    'background-color': '#61bffc',
                    'line-color': '#61bffc',
                    'target-arrow-color': '#61bffc',
                    'transition-property': 'background-color, line-color, target-arrow-color',
                    'transition-duration': '0.5s'
                }),
                elements: tElements,
                layout: {
                    name: tLayout,
                    directed: true,
                    padding: 10,
                    avoidOverlap: true,
                }
            });
            this.myChartControl.on('tap', 'node', function (evt) {
                var tD = evt.target.data();
                if (tD.nodeType === 1) {
                    cdeNMI.TheMainPage.TransitToScreen(cdeCommonUtils.GuidToString(tD.cdeMID));
                }
            });
            var ele = this.myChartControl.container();
            ele.childNodes[0].style.display = 'flex';
            cdeNMI.TheNMIBaseControl.SetPropertiesFromBag(this, this.myPropertyBag);
        };
        ctrlProCytoChart.prototype.InitControl = function (pTargetElem, pTRF, pPropertyBag, pScreenID) {
            var _this = this;
            _super.prototype.InitControl.call(this, pTargetElem, pTRF, pPropertyBag, pScreenID);
            this.myPropertyBag = pPropertyBag;
            this.myChartContainer = cdeNMI.ctrlTileGroup.Create(pTargetElem, null, null);
            var tW = cdeCommonUtils.CInt(this.MyParentCtrl.GetProperty("ControlTW"));
            if (this.GetSetting("TileWidth"))
                tW = cdeCommonUtils.CInt(this.GetSetting("TileWidth"));
            var tH = cdeCommonUtils.CInt(this.MyParentCtrl.GetProperty("ControlTH"));
            if (this.GetSetting("TileHeight"))
                tH = cdeCommonUtils.CInt(this.GetSetting("TileHeight"));
            pTargetElem.RegisterEvent("Resize", function (sender, para) {
                _this.MyParentCtrl.SetProperty("TileWidth", para[1]);
                _this.myChartContainer.SetProperty("TileWidth", para[1]);
                if (TheC3Service.HaveCtrlsLoaded) {
                    _this.RenderChart(null);
                }
            });
            this.myChartContainer.SetProperty("TileWidth", tW);
            this.myChartContainer.SetProperty("TileHeight", tH);
            this.myChartContainer.SetProperty("Display", "flex");
            this.SetElement(this.myChartContainer.GetElement(), true, this.myChartContainer.GetElement());
            return true;
        };
        ctrlProCytoChart.prototype.ApplySkin = function () {
            var _this = this;
            if (TheC3Service.HaveCtrlsLoaded) {
                this.RenderChart(null);
            }
            else {
                cdeNMI.RegisterEvent("ChartsReady", function () { _this.ApplySkin(); });
            }
        };
        return ctrlProCytoChart;
    }(cdeNMI.TheNMIBaseControl));
    CDMyC3.ctrlProCytoChart = ctrlProCytoChart;
    var ctrlProLiveChart = (function (_super) {
        __extends(ctrlProLiveChart, _super);
        function ctrlProLiveChart() {
            var _this = _super.call(this, null, null) || this;
            _this.myChartContainer = null;
            _this.myChartScreen = null;
            _this.myChartControl = null;
            _this.myPropertyBag = null;
            _this.myChartCanvas = null;
            _this.mLastUpdate = null;
            _this.mSeriesNames = null;
            _this.mMaxVal = 100;
            _this.mBackwards = false;
            _this.mTimeSeries = [];
            _this.mDelay = 500;
            _this.mSpeed = 50;
            _this.mHasStarted = false;
            _this.mColors = [
                'rgba(0,255,0,0.62)',
                'rgba(0,255,255,0.62)',
                'rgba(255,255,0,0.62)',
                'rgba(0,0,255,0.62)',
                'rgba(255,0,0,0.62)',
                'rgba(255,255,255,0.62)',
            ];
            return _this;
        }
        ctrlProLiveChart.prototype.findIndex = function (inStr) {
            for (var i = 0; i < this.mSeriesNames.length; i++) {
                if (this.mSeriesNames[i].name === inStr)
                    return i;
            }
            return -1;
        };
        ctrlProLiveChart.prototype.SetProperty = function (pName, pValue) {
            _super.prototype.SetProperty.call(this, pName, pValue);
            if (TheC3Service.HaveCtrlsLoaded && this.myChartControl) {
                if ((pName === "Value" || pName === "iValue") && pValue) {
                    if (cdeCommonUtils.CStr(pValue).substr(0, 1) === "[") {
                        var ts = JSON.parse(pValue);
                        for (var i = 0; i < ts.length; i++) {
                            this.AddValueToChart(ts[i].value, ts[i].name);
                        }
                    }
                    else {
                        var tParts = cdeCommonUtils.CStr(pValue).split(';');
                        var tSerNo = "Data";
                        var tVal = 0;
                        if (tParts.length > 1) {
                            tSerNo = tParts[1];
                            tVal = cdeCommonUtils.CDbl(tParts[0]);
                        }
                        else {
                            tVal = cdeCommonUtils.CDbl(pValue);
                        }
                        this.AddValueToChart(tVal, tSerNo);
                    }
                    if (!this.mHasStarted)
                        this.RenderChart();
                }
                else if (pName === "SeriesNames" && pValue) {
                    this.mSeriesNames = JSON.parse(this.GetProperty("SeriesNames"));
                }
                else if (pName === "TabIndex") {
                    if (cdeCommonUtils.CInt(pValue) < 0) {
                        if (this.myChartControl && this.myChartControl.frame)
                            this.myChartControl.stop();
                    }
                    else {
                        if (this.myChartControl && !this.myChartControl.frame)
                            this.myChartControl.start();
                    }
                }
            }
        };
        ctrlProLiveChart.prototype.AddValueToChart = function (tVal, tSerNo) {
            if (tSerNo === void 0) { tSerNo = "Data"; }
            var tIdx = 0;
            if (tSerNo === "0" || tSerNo === "Data" || cdeCommonUtils.CInt(tSerNo) > 0)
                tIdx = cdeCommonUtils.CInt(tSerNo);
            else
                tIdx = this.findIndex(tSerNo);
            var tLineColor = this.mColors[this.mTimeSeries.length];
            var tFillColor = tLineColor;
            var tLineWidth = 2;
            if (tIdx >= 0 && this.mSeriesNames[tIdx]) {
                tLineColor = this.mSeriesNames[tIdx].lineColor;
                tFillColor = tLineColor;
                if (this.mSeriesNames[tIdx].fillColor)
                    tFillColor = this.mSeriesNames[tIdx].fillColor;
                tSerNo = this.mSeriesNames[tIdx].name;
                if (cde.CInt(this.mSeriesNames[tIdx].lineWidth) > 0)
                    tLineWidth = cde.CInt(this.mSeriesNames[tIdx].lineWidth);
            }
            var series = this.mTimeSeries[tSerNo];
            if (!series) {
                series = new TimeSeries({ lineWidth: tLineWidth, strokeStyle: tLineColor, fillStyle: tFillColor });
                series.options = { lineWidth: tLineWidth, strokeStyle: tLineColor, fillStyle: tFillColor };
                this.mTimeSeries[tSerNo] = series;
                this.myChartControl.addTimeSeries(series, { lineWidth: tLineWidth, strokeStyle: tLineColor, fillStyle: tFillColor });
            }
            var x = (new Date()).getTime();
            series.append(x, cdeCommonUtils.CInt(tVal));
        };
        ctrlProLiveChart.prototype.RenderChart = function () {
            if (!this.myChartContainer || !this.myChartCanvas || this.myChartControl)
                return;
            var tTitle = this.GetProperty("Title");
            if (!tTitle)
                tTitle = "";
            var tSubTitle = this.GetProperty("SubTitle");
            if (!tSubTitle)
                tSubTitle = "";
            var tBack = this.GetProperty("Background");
            if (!tBack)
                tBack = "rgba(0,0,0,0.01)";
            this.mDelay = cdeCommonUtils.CInt(this.GetProperty("Delay"));
            if (this.mDelay === 0)
                this.mDelay = 500;
            this.mSpeed = cdeCommonUtils.CInt(this.GetProperty("Speed"));
            if (this.mSpeed === 0)
                this.mSpeed = 50;
            this.mBackwards = cdeCommonUtils.CBool(this.GetProperty("LeftToRight"));
            var millis = this.mSpeed * 50;
            if (cdeCommonUtils.CInt(this.GetProperty("MillisPerLine")) > 0)
                millis = cdeCommonUtils.CInt(this.GetProperty("MillisPerLine"));
            if (this.GetProperty("SeriesNames"))
                this.mSeriesNames = cde.cdeEval("(" + this.GetProperty("SeriesNames") + ")");
            else
                this.mSeriesNames = [{ name: 'Data', lineColor: 'rgba(0,255,0,0.39)' }];
            var wid = cdeCommonUtils.CInt(this.GetProperty("ControlTW"));
            if (wid === 0)
                wid = null;
            else
                wid = cdeNMI.GetSizeFromTile(wid);
            var hei = cdeCommonUtils.CInt(this.GetProperty("ControlTH"));
            if (hei === 0)
                hei = null;
            else
                hei = cdeNMI.GetSizeFromTile(hei);
            this.myChartContainer.SetProperty("TileWidth", this.GetProperty("ControlTW"));
            this.myChartContainer.SetProperty("TileHeight", this.GetProperty("ControlTH"));
            this.myChartCanvas.width = wid;
            this.myChartCanvas.height = hei;
            this.mTimeSeries = new Array();
            var tConf = { millisPerPixel: this.mSpeed, grid: { verticalSections: 0, millisPerLine: millis, fillStyle: tBack, borderVisible: false }, horizontalLines: [{ color: '#ffffff', lineWidth: 1, value: 0 }] };
            if (cdeCommonUtils.CInt(this.GetProperty("MaxValue")) !== 0)
                tConf.maxValue = cdeCommonUtils.CInt(this.GetProperty("MaxValue"));
            tConf.minValue = 0;
            if (cdeCommonUtils.CInt(this.GetProperty("MinValue")) !== 0)
                tConf.minValue = cdeCommonUtils.CInt(this.GetProperty("MinValue"));
            tConf.scrollBackwards = this.mBackwards;
            this.myChartControl = new SmoothieChart(tConf);
            this.myChartControl.streamTo(this.myChartCanvas, this.mDelay);
            this.mHasStarted = true;
            cdeNMI.TheNMIBaseControl.SetPropertiesFromBag(this, this.myPropertyBag);
        };
        ctrlProLiveChart.prototype.InitControl = function (pTargetElem, pTRF, pPropertyBag, pScreenID) {
            var _this = this;
            _super.prototype.InitControl.call(this, pTargetElem, pTRF, pPropertyBag, pScreenID);
            this.myPropertyBag = pPropertyBag;
            this.myChartScreen = cdeNMI.ctrlTileGroup.Create(pTargetElem, null);
            this.myChartContainer = cdeNMI.ctrlTileGroup.Create(this.myChartScreen, null, null);
            this.myChartCanvas = document.createElement("canvas");
            this.myChartCanvas.width = 0;
            this.myChartCanvas.height = 0;
            this.myChartContainer.GetElement().appendChild(this.myChartCanvas);
            this.RegisterEvent("PointerUp", function () {
                if (_this.myChartControl.frame)
                    _this.myChartControl.stop();
                else
                    _this.myChartControl.start();
            });
            this.SetElement(this.myChartContainer.GetElement(), true, this.myChartScreen.GetElement());
            return true;
        };
        ctrlProLiveChart.prototype.ApplySkin = function () {
            var _this = this;
            if (TheC3Service.HaveCtrlsLoaded) {
                if (!this.myChartControl)
                    this.RenderChart();
                if (!this.MyTarget || this.MyTarget.GetProperty("IsUnloaded"))
                    this.myChartControl.stop();
                else
                    this.myChartControl.start();
                return true;
            }
            else {
                cdeNMI.RegisterEvent("ChartsReady", function () { _this.ApplySkin(); });
            }
        };
        return ctrlProLiveChart;
    }(cdeNMI.TheNMIBaseControl));
    CDMyC3.ctrlProLiveChart = ctrlProLiveChart;
    var ctrlC3Chart = (function (_super) {
        __extends(ctrlC3Chart, _super);
        function ctrlC3Chart() {
            var _this = _super.call(this, null, null) || this;
            _this.cAllProps = "ChartType,ChartColors,SetSeries,Groups";
            _this.myCurrentSeries = null;
            _this.myChartConfig = null;
            _this.myChartControl = null;
            _this.myChartScreen = null;
            _this.myChartSize = { width: 0, height: 0 };
            return _this;
        }
        ctrlC3Chart.prototype.InitControl = function (pTargetElem, pTRF, pPropertyBag, pScreenID) {
            _super.prototype.InitControl.call(this, pTargetElem, pTRF, pPropertyBag, pScreenID);
            this.myChartScreen = cdeNMI.ctrlTileGroup.Create(pTargetElem, null);
            this.myChartScreen.SetProperty("ClassName", "p171ChartFontColor");
            this.SetElement(this.myChartScreen.GetElement(), true, this.myChartScreen.GetElement());
            return true;
        };
        ctrlC3Chart.prototype.SetProperty = function (pName, pValue) {
            var IsDirty = false;
            if (pName === "ControlTW") {
                pName = "TileWidth";
                this.myChartSize.width = cdeNMI.GetSizeFromTile(pValue);
            }
            if (pName === "ControlTH") {
                pName = "TileHeight";
                this.myChartSize.height = cdeNMI.GetSizeFromTile(pValue);
            }
            else if (pName === "SetRawData") {
                this.myCurrentSeries = pValue;
                IsDirty = true;
            }
            _super.prototype.SetProperty.call(this, pName, pValue);
            if (!this.myChartConfig) {
                this.myChartConfig = {
                    data: {
                        columns: this.myCurrentSeries,
                    },
                    size: this.myChartSize
                };
                IsDirty = true;
            }
            if ((pName === "Value" || pName === "iValue") && pValue) {
                this.SetData(pValue);
                IsDirty = true;
            }
            else if (pName === "DataModel") {
                IsDirty = true;
            }
            else if (pName === "RefreshData") {
                this.RefreshData();
            }
            else if (pName === "Background") {
                this.MyRootElement.style.backgroundColor = pValue;
            }
            else if (this.cAllProps.indexOf(pName) >= 0)
                IsDirty = true;
            if (IsDirty && TheC3Service.HaveCtrlsLoaded && this.myChartControl)
                this.ApplySkin();
        };
        ctrlC3Chart.prototype.RefreshData = function () {
            var tStr = this.GetProperty("DataSource");
            if (tStr && tStr.length > 0) {
                var tParts = tStr.split(';');
                if (tParts.length > 1) {
                    TheC3Service.MyChartScreens[tParts[1]] = this;
                    cdeCommCore.PublishToService(tParts[0], "GET_CHARTDATA", tParts[1]);
                }
                else {
                    TheC3Service.MyChartScreens[tStr] = this;
                    cdeCommCore.PublishToService(CDMyC3.eC3Engine, "GET_CHARTDATA", tStr);
                }
            }
        };
        ctrlC3Chart.prototype.SetData = function (pValue) {
            try {
                var ts = void 0;
                if (cdeCommonUtils.CStr(pValue).substr(0, 1) === "[") {
                    ts = JSON.parse(pValue);
                }
                else {
                    var tA = cdeCommonUtils.CStr(pValue).split(';');
                    if (this.myCurrentSeries) {
                        ts = this.myCurrentSeries;
                        for (var i = 0; i < tA.length; i++) {
                            var tPVal = cdeCommonUtils.CStr(tA[i]).split(':');
                            if (tPVal.length > 1) {
                                ts[i][0] = tPVal[0];
                                if (cdeCommonUtils.CBool(this.GetProperty("UpdateData")))
                                    ts[i][1] = tPVal[1];
                                else
                                    ts[i][ts[i].length] = tPVal[1];
                            }
                            else {
                                if (cdeCommonUtils.CBool(this.GetProperty("UpdateData")))
                                    ts[i][1] = tA[i];
                                else
                                    ts[i][ts[i].length] = tA[i];
                            }
                        }
                    }
                    else {
                        var tSS = "[";
                        for (var i = 0; i < tA.length; i++) {
                            var tPVal = cdeCommonUtils.CStr(tA[i]).split(':');
                            if (tPVal.length > 1)
                                tSS += '[' + tPVal[0] + '",' + tPVal[1] + ']';
                            else
                                tSS += '["Value' + i + '",' + tA[i] + ']';
                        }
                        tSS += "]";
                        ts = JSON.parse(tSS);
                    }
                }
                if (ts) {
                    this.myCurrentSeries = ts;
                    this.myChartConfig.data.columns = this.myCurrentSeries;
                }
            }
            catch (ex) {
                cdeCommonUtils.cdeLogEvent(ex);
            }
        };
        ctrlC3Chart.prototype.ApplySkin = function () {
            if (!this.myChartConfig) {
                this.myChartConfig = {
                    data: {},
                    zoom: {
                        enabled: true,
                        rescale: true,
                        type: 'drag'
                    },
                    size: {
                        height: cdeNMI.GetSizeFromTile(this.GetProperty("TileHeight")),
                        width: cdeNMI.GetSizeFromTile(this.GetProperty("TileWidth"))
                    }
                };
            }
            if (this.GetProperty("DataModel")) {
                var tDM = this.GetProperty("DataModel");
                if (this.GetProperty("DataModel") !== "[]") {
                    this.myCurrentSeries = JSON.parse(tDM);
                    this.SetProperty("DataModel", "[]");
                }
            }
            if (this.GetProperty("SetSeries") && this.GetProperty("SetSeries") !== "[]") {
                this.SetData(this.GetProperty("SetSeries"));
                this.myChartConfig.data.columns = this.myCurrentSeries;
                this.SetProperty("SetSeries", "[]");
            }
            if (this.GetProperty("ChartColors")) {
                try {
                    var tColors = { pattern: JSON.parse(this.GetProperty("ChartColors")) };
                    this.myChartConfig.color = tColors;
                }
                catch (ex) {
                    cdeCommonUtils.cdeLogEvent(ex);
                }
            }
            if (this.GetProperty("Legend")) {
                this.myChartConfig.legend = JSON.parse(this.GetProperty("Legend"));
            }
            if (this.GetProperty("Axis")) {
                this.myChartConfig.axis = JSON.parse(this.GetProperty("Axis"));
            }
            if (this.GetProperty("DataOptions")) {
                this.myChartConfig.data = JSON.parse(this.GetProperty("DataOptions"));
            }
            if (this.GetProperty("ChartType"))
                this.myChartConfig.data.type = this.GetProperty("ChartType");
            if (!cdeCommonUtils.IsNotSet(this.GetProperty("MaxValue"))) {
                this.myChartConfig.gauge = { max: this.GetProperty("MaxValue") };
            }
            if (!this.myChartControl) {
                this.myChartConfig.bindto = this.myChartScreen.GetElement();
                this.myChartControl = c3.generate(this.myChartConfig);
                this.RefreshData();
            }
            else {
                var tArgs = {};
                if (this.GetProperty("DataOptions")) {
                    tArgs = JSON.parse(this.GetProperty("DataOptions"));
                }
                if (this.myChartConfig.color)
                    tArgs.colors = this.myChartConfig.color.pattern;
                tArgs.columns = this.myCurrentSeries;
                tArgs.type = this.myChartConfig.data.type;
                this.myChartControl.load(tArgs);
            }
        };
        return ctrlC3Chart;
    }(cdeNMI.TheNMIBaseControl));
    CDMyC3.ctrlC3Chart = ctrlC3Chart;
    var ctrlC3Line = (function (_super) {
        __extends(ctrlC3Line, _super);
        function ctrlC3Line() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ctrlC3Line.prototype.InitControl = function (pTargetElem, pTRF, pPropertyBag, pScreenID) {
            _super.prototype.InitControl.call(this, pTargetElem, pTRF, pPropertyBag, pScreenID);
            this.SetProperty("ChartType", "spline");
            this.SetProperty("UpdateData", "true");
            this.SetProperty("Axis", JSON.stringify({
                x: {
                    type: 'timeseries',
                    tick: {
                        format: '%Y-%m-%d %H:%M:%S'
                    }
                }
            }));
            this.SetProperty("DataOptions", JSON.stringify({
                columns: ['x', 12],
                x: 'x',
                xFormat: '%Y-%m-%d %H:%M:%S'
            }));
            return true;
        };
        return ctrlC3Line;
    }(ctrlC3Chart));
    CDMyC3.ctrlC3Line = ctrlC3Line;
    var ctrlC3StackChart = (function (_super) {
        __extends(ctrlC3StackChart, _super);
        function ctrlC3StackChart() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.myBucketName = "Data";
            _this.myColumX = null;
            return _this;
        }
        ctrlC3StackChart.prototype.InitControl = function (pTargetElem, pTRF, pPropertyBag, pScreenID) {
            _super.prototype.InitControl.call(this, pTargetElem, pTRF, pPropertyBag, pScreenID);
            this.SetProperty("ChartType", "bar");
            this.SetProperty("Axis", JSON.stringify({
                x: {
                    type: 'category'
                }
            }));
            this.SetProperty("DataOptions", JSON.stringify({
                columns: ['x', 1],
                x: 'x',
            }));
            this.SetProperty("Legend", JSON.stringify({
                hide: true,
            }));
            return true;
        };
        ctrlC3StackChart.prototype.SetProperty = function (pName, pValue) {
            if (pName === "XAxis" && pValue) {
                var tAxt = JSON.parse(pValue);
                this.myBucketName = cde.CStr(Object.keys(tAxt)[0]);
                tAxt[this.myBucketName].splice(0, 0, 'x');
                this.myColumX = JSON.stringify(tAxt[this.myBucketName]);
                return;
            }
            if (pName === "iValue" && pValue) {
                if (pValue.substr(0, 1) === "[") {
                    var tSeries = [];
                    var tF = JSON.parse(pValue);
                    tF.splice(0, 0, this.myBucketName);
                    if (this.myColumX)
                        tSeries.push(JSON.parse(this.myColumX));
                    tSeries.push(tF);
                    pValue = tSeries;
                    pName = "SetRawData";
                }
            }
            _super.prototype.SetProperty.call(this, pName, pValue);
        };
        return ctrlC3StackChart;
    }(ctrlC3Chart));
    CDMyC3.ctrlC3StackChart = ctrlC3StackChart;
    var ctrlC3Pie = (function (_super) {
        __extends(ctrlC3Pie, _super);
        function ctrlC3Pie() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ctrlC3Pie.prototype.InitControl = function (pTargetElem, pTRF, pPropertyBag, pScreenID) {
            _super.prototype.InitControl.call(this, pTargetElem, pTRF, pPropertyBag, pScreenID);
            this.SetProperty("ChartType", "pie");
            this.SetProperty("UpdateData", "true");
            return true;
        };
        return ctrlC3Pie;
    }(ctrlC3Chart));
    CDMyC3.ctrlC3Pie = ctrlC3Pie;
    var ctrlC3Gauge = (function (_super) {
        __extends(ctrlC3Gauge, _super);
        function ctrlC3Gauge() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ctrlC3Gauge.prototype.InitControl = function (pTargetElem, pTRF, pPropertyBag, pScreenID) {
            _super.prototype.InitControl.call(this, pTargetElem, pTRF, pPropertyBag, pScreenID);
            this.SetProperty("ChartType", "gauge");
            this.SetProperty("UpdateData", "true");
            return true;
        };
        return ctrlC3Gauge;
    }(ctrlC3Chart));
    CDMyC3.ctrlC3Gauge = ctrlC3Gauge;
    var ctrlTimeLineChart = (function (_super) {
        __extends(ctrlTimeLineChart, _super);
        function ctrlTimeLineChart() {
            var _this = _super.call(this, null, null) || this;
            _this.cAllProps = "ChartType,ChartColors,SetSeries,Groups";
            _this.myChartScreen = null;
            _this.myStripHeader = null;
            _this.myStripImage = null;
            return _this;
        }
        ctrlTimeLineChart.prototype.SetProperty = function (pName, pValue) {
            _super.prototype.SetProperty.call(this, pName, pValue);
            if ((pName === "Value" || pName === "iValue") && pValue) {
            }
            else if (pName === "Background") {
                this.MyRootElement.style.backgroundColor = pValue;
            }
            else if (pName === "HeaderImage" && this.myStripHeader) {
                this.myStripHeader.SetProperty("iValue", pValue);
            }
            else if (pName === "StripImage" && this.myStripHeader) {
                this.myStripImage.SetProperty("iValue", pValue);
            }
        };
        ctrlTimeLineChart.prototype.InitControl = function (pTargetElem, pTRF, pPropertyBag, pScreenID) {
            _super.prototype.InitControl.call(this, pTargetElem, pTRF, pPropertyBag, pScreenID);
            this.myChartScreen = cdeNMI.ctrlTileGroup.Create(pTargetElem, null);
            this.myChartScreen.SetProperty("ClassName", "p171ChartFontColor");
            this.myStripHeader = new cdeNMI.ctrlZoomImage();
            this.myStripHeader.InitControl(this.myChartScreen);
            this.myStripHeader.SetProperty("ImgFormat", "png");
            this.myStripHeader.SetProperty("IsBlob", true);
            this.myStripHeader.SetProperty("TileFactorY", 2);
            this.myStripHeader.SetProperty("ControlTH", 1);
            this.myStripHeader.SetProperty("TileWidth", this.GetSetting("TileWidth"));
            this.myStripHeader.SetProperty("ClassName", this.GetSetting("ClassName"));
            this.myStripImage = new cdeNMI.ctrlZoomImage();
            this.myStripImage.InitControl(this.myChartScreen);
            this.myStripImage.SetProperty("ImgFormat", "png");
            this.myStripImage.SetProperty("IsBlob", true);
            this.myStripImage.SetProperty("TileFactorY", 2);
            this.myStripImage.SetProperty("ControlTH", 1);
            this.myStripImage.SetProperty("TileWidth", this.GetSetting("TileWidth"));
            this.myStripImage.SetProperty("ClassName", this.GetSetting("ClassName"));
            this.SetElement(this.myChartScreen.GetElement(), true, this.myChartScreen.GetElement());
            return true;
        };
        return ctrlTimeLineChart;
    }(cdeNMI.TheNMIBaseControl));
    CDMyC3.ctrlTimeLineChart = ctrlTimeLineChart;
    var ctrlTeslaSpeedometer = (function (_super) {
        __extends(ctrlTeslaSpeedometer, _super);
        function ctrlTeslaSpeedometer() {
            var _this = _super.call(this, null, null) || this;
            _this.containerTileGroup = null;
            _this.dev = false;
            _this.canvas = null;
            _this.tempValue = 0;
            _this.tempPower = 0;
            return _this;
        }
        ctrlTeslaSpeedometer.prototype.InitControl = function (pTargetControl, pTRF, pPropertyBag, pScreenID) {
            var _this = this;
            _super.prototype.InitControl.call(this, pTargetControl, pTRF, pPropertyBag, pScreenID);
            this.containerTileGroup = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileGroup).Create(pTargetControl);
            var tMax = cde.CInt(this.GetProperty("MaxValue"));
            if (tMax === cde.CInt(this.GetProperty("MinValue")))
                tMax = 100;
            this.SetProperty("MaxValue", tMax);
            if (this.GetProperty("MainBackground"))
                this.containerTileGroup.SetProperty("Background", this.GetProperty("MainBackground"));
            this.canvas = document.createElement("canvas");
            this.containerTileGroup.GetElement().appendChild(this.canvas);
            var tW = cde.CInt(this.GetSetting("ControlTW"));
            var tH = cde.CInt(this.GetSetting("ControlTH"));
            this.canvas.width = 0;
            this.canvas.height = 0;
            this.ctx = this.canvas.getContext("2d");
            this.ctx.scale(1, 1);
            this.speedGradient = this.ctx.createLinearGradient(0, 500, 0, 0);
            this.speedGradient.addColorStop(0, '#00b8fe');
            this.speedGradient.addColorStop(1, '#41dcf4');
            this.rpmGradient = this.ctx.createLinearGradient(0, 500, 0, 0);
            this.rpmGradient.addColorStop(0, '#f7b733');
            this.rpmGradient.addColorStop(1, '#fc4a1a');
            if (tW > 0) {
                this.containerTileGroup.SetProperty("TileWidth", tW);
                this.canvas.width = cdeNMI.GetSizeFromTile(this.containerTileGroup.GetProperty("TileWidth"));
            }
            if (tH > 0) {
                this.containerTileGroup.SetProperty("TileHeight", tH);
                this.canvas.height = cdeNMI.GetSizeFromTile(this.containerTileGroup.GetProperty("TileHeight"));
            }
            cde.MyBaseAssets.RegisterEvent("ThemeSwitched", function () {
                _this.drawSpeedo();
            });
            this.drawSpeedo();
            this.AnimateFrame(true);
            _super.prototype.SetElement.call(this, this.containerTileGroup.GetElement());
            return true;
        };
        ctrlTeslaSpeedometer.prototype.SetProperty = function (pName, pValue) {
            _super.prototype.SetProperty.call(this, pName, pValue);
            var bIsDirty = false;
            if (pName === "MainBackground") {
                if (!this.containerTileGroup)
                    return;
                this.containerTileGroup.SetProperty("Background", pValue);
            }
            else if (pName === "Background") {
                bIsDirty = true;
            }
            else if (pName === "ControlTW" && this.ctx) {
                this.containerTileGroup.SetProperty("TileWidth", pValue);
                this.canvas.width = cdeNMI.GetSizeFromTile(this.containerTileGroup.GetProperty("TileWidth"));
                bIsDirty = true;
            }
            else if (pName === "ControlTH" && this.ctx) {
                this.containerTileGroup.SetProperty("TileHeight", pValue);
                this.canvas.height = cdeNMI.GetSizeFromTile(this.containerTileGroup.GetProperty("TileHeight"));
                bIsDirty = true;
            }
            if (pName === "iValue" || pName === "Value") {
                bIsDirty = true;
            }
            if (pName === "MaxValue" || pName === "MinValue" || pName === "Foreground") {
                bIsDirty = true;
            }
            if (pName === "Power") {
                bIsDirty = true;
            }
            if (bIsDirty && this.ctx)
                this.AnimateFrame(true);
        };
        ctrlTeslaSpeedometer.prototype.AnimateFrame = function (pForce) {
            var _this = this;
            this.myframe = requestAnimationFrame(function () { _this.AnimateFrame(false); });
            if (cde.CBool(this.GetProperty("DontAnimate")) === true) {
                cancelAnimationFrame(this.myframe);
                this.drawSpeedo();
                return;
            }
            var bCancelAnim = false;
            var tDbl;
            if (cde.CDbl(this.GetProperty("Value")) < this.tempValue) {
                tDbl = (this.tempValue - cde.CDbl(this.GetProperty("Value"))) / 20;
                this.tempValue -= tDbl;
                if (!pForce && (cde.CDbl(this.GetProperty("Value")) > this.tempValue || Math.abs(tDbl) < 1)) {
                    bCancelAnim = true;
                    this.tempValue = cde.CDbl(this.GetProperty("Value"));
                }
            }
            else {
                tDbl = (cde.CDbl(this.GetProperty("Value")) - this.tempValue) / 20;
                this.tempValue += tDbl;
                if (!pForce && (cde.CDbl(this.GetProperty("Value")) < this.tempValue || Math.abs(tDbl) < 1)) {
                    bCancelAnim = true;
                    this.tempValue = cde.CDbl(this.GetProperty("Value"));
                }
            }
            if (cde.CDbl(this.GetProperty("Power")) < this.tempPower) {
                tDbl = (this.tempPower - cde.CDbl(this.GetProperty("Power"))) / 20;
                this.tempPower -= tDbl;
                if (!pForce && (cde.CDbl(this.GetProperty("Power")) > this.tempPower || Math.abs(tDbl) < 1)) {
                    bCancelAnim = true;
                    this.tempPower = cde.CDbl(this.GetProperty("Power"));
                }
            }
            else {
                tDbl = (cde.CDbl(this.GetProperty("Power")) - this.tempValue) / 20;
                this.tempPower += tDbl;
                if (!pForce && (cde.CDbl(this.GetProperty("Power")) < this.tempValue || Math.abs(tDbl) < 1)) {
                    bCancelAnim = true;
                    this.tempPower = cde.CDbl(this.GetProperty("Power"));
                }
            }
            if (bCancelAnim === true)
                cancelAnimationFrame(this.myframe);
            this.drawSpeedo();
        };
        ctrlTeslaSpeedometer.prototype.speedNeedle = function (rotation) {
            this.ctx.lineWidth = 2;
            this.ctx.save();
            this.ctx.translate(250, 250);
            this.ctx.rotate(rotation);
            this.ctx.strokeRect(-130 / 2 + 170, -1 / 2, 135, 1);
            this.ctx.restore();
            rotation += Math.PI / 180;
        };
        ctrlTeslaSpeedometer.prototype.rpmNeedle = function (rotation) {
            this.ctx.lineWidth = 2;
            this.ctx.save();
            this.ctx.translate(250, 250);
            this.ctx.rotate(rotation);
            this.ctx.strokeRect(-130 / 2 + 170, -1 / 2, 135, 1);
            this.ctx.restore();
            rotation += Math.PI / 180;
        };
        ctrlTeslaSpeedometer.prototype.drawMiniNeedle = function (rotation, width, speed) {
            this.ctx.lineWidth = width;
            this.ctx.save();
            this.ctx.translate(250, 250);
            this.ctx.rotate(rotation);
            this.ctx.strokeStyle = "#333";
            this.ctx.fillStyle = "#333";
            this.ctx.strokeRect(-20 / 2 + 220, -1 / 2, 20, 1);
            this.ctx.restore();
            var x = (250 + 180 * Math.cos(rotation));
            var y = (250 + 180 * Math.sin(rotation));
            this.ctx.font = "700 20px Open Sans";
            this.ctx.fillText(speed, x, y);
            rotation += Math.PI / 180;
        };
        ctrlTeslaSpeedometer.prototype.calculateSpeedAngle = function (x, a, b) {
            var degree = (a - b) * (x) + b;
            var radian = (degree * Math.PI) / 180;
            return radian <= 1.45 ? radian : 1.45;
        };
        ctrlTeslaSpeedometer.prototype.calculateRPMAngel = function (x, a, b) {
            var degree = (a - b) * (x) + b;
            var radian = (degree * Math.PI) / 180;
            return radian >= -0.46153862656807704 ? radian : -0.46153862656807704;
        };
        ctrlTeslaSpeedometer.prototype.drawSpeedo = function () {
            if (!this.ctx || this.canvas.width === 0 || this.canvas.height === 0)
                return;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            var speed = Math.floor(this.tempValue);
            var power = this.tempPower;
            var gear = cde.CInt(this.GetProperty("Gear"));
            var topSpeed = cde.CInt(this.GetProperty("MaxValue"));
            if (topSpeed === 0)
                topSpeed = 120;
            this.ctx.beginPath();
            this.ctx.fillStyle = 'rgba(0, 0, 0, .9)';
            this.ctx.arc(250, 250, 240, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.save();
            this.ctx.restore();
            this.ctx.fillStyle = "#FFF";
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.strokeStyle = "#333";
            this.ctx.lineWidth = 10;
            this.ctx.arc(250, 250, 100, 0, 2 * Math.PI);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.lineWidth = 1;
            this.ctx.arc(250, 250, 240, 0, 2 * Math.PI);
            this.ctx.stroke();
            this.ctx.font = "700 70px Open Sans";
            this.ctx.textAlign = "center";
            this.ctx.fillText(cde.CStr(speed), 250, 220);
            this.ctx.font = "700 15px Open Sans";
            this.ctx.fillText("mph", 250, 235);
            if (gear === 0 && speed > 0) {
                this.ctx.fillStyle = "#999";
                this.ctx.font = "700 70px Open Sans";
                this.ctx.fillText('R', 250, 460);
                this.ctx.fillStyle = "#333";
                this.ctx.font = "50px Open Sans";
                this.ctx.fillText('N', 290, 460);
            }
            else if (gear === 0 && speed === 0) {
                this.ctx.fillStyle = "#999";
                this.ctx.font = "700 70px Open Sans";
                this.ctx.fillText('N', 250, 460);
                this.ctx.fillStyle = "#333";
                this.ctx.font = "700 50px Open Sans";
                this.ctx.fillText('R', 210, 460);
                this.ctx.font = "700 50px Open Sans";
                this.ctx.fillText(cde.CStr(gear + 1), 290, 460);
            }
            else if (gear - 1 <= 0) {
                this.ctx.fillStyle = "#999";
                this.ctx.font = "700 70px Open Sans";
                this.ctx.fillText(cde.CStr(gear), 250, 460);
                this.ctx.fillStyle = "#333";
                this.ctx.font = "50px Open Sans";
                this.ctx.fillText('R', 210, 460);
                this.ctx.font = "700 50px Open Sans";
                this.ctx.fillText(cde.CStr(gear + 1), 290, 460);
            }
            else {
                this.ctx.font = "700 70px Open Sans";
                this.ctx.fillStyle = "#999";
                this.ctx.fillText(cde.CStr(gear), 250, 460);
                this.ctx.font = "700 50px Open Sans";
                this.ctx.fillStyle = "#333";
                this.ctx.fillText(cde.CStr(gear - 1), 210, 460);
                if (gear + 1 < 7) {
                    this.ctx.font = "700 50px Open Sans";
                    this.ctx.fillText(cde.CStr(gear + 1), 290, 460);
                }
            }
            this.ctx.fillStyle = "#FFF";
            for (var i = 10; i <= Math.ceil(topSpeed / 20) * 20; i += 10) {
                console.log();
                this.drawMiniNeedle(this.calculateSpeedAngle(i / topSpeed, 83.07888, 34.3775) * Math.PI, i % 20 === 0 ? 3 : 1, i % 20 === 0 ? i : '');
                if (i <= 100) {
                    this.drawMiniNeedle(this.calculateSpeedAngle(i / 47, 0, 22.9183) * Math.PI, i % 20 === 0 ? 3 : 1, i % 20 ===
                        0 ?
                        i / 10 : '');
                }
            }
            this.ctx.beginPath();
            this.ctx.strokeStyle = "#41dcf4";
            this.ctx.lineWidth = 25;
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = "#00c6ff";
            this.ctx.strokeStyle = this.speedGradient;
            this.ctx.arc(250, 250, 228, .6 * Math.PI, this.calculateSpeedAngle(speed / topSpeed, 83.07888, 34.3775) * Math.PI);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.lineWidth = 25;
            this.ctx.strokeStyle = this.rpmGradient;
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = "#f7b733";
            this.ctx.arc(250, 250, 228, .4 * Math.PI, this.calculateRPMAngel(power / 4.7, 0, 22.9183) * Math.PI, true);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = '#41dcf4';
            this.speedNeedle(this.calculateSpeedAngle(speed / topSpeed, 83.07888, 34.3775) * Math.PI);
            this.ctx.strokeStyle = this.rpmGradient;
            this.rpmNeedle(this.calculateRPMAngel(power / 4.7, 0, 22.9183) * Math.PI);
            this.ctx.strokeStyle = "#000";
        };
        return ctrlTeslaSpeedometer;
    }(cdeNMI.TheNMIBaseControl));
    CDMyC3.ctrlTeslaSpeedometer = ctrlTeslaSpeedometer;
})(CDMyC3 || (CDMyC3 = {}));
//# sourceMappingURL=/ClientBin/plugins/P172/CDMyC3.TheC3Service.js.map