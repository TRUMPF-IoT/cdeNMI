// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {
    /**
* Creates a pin button that can be used to visualize pin/unpinned elements 
*
* (4.1 Ready!)
*/
    export class ctrlPinButton extends TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        divPin: HTMLDivElement = null;
        rootDiv: HTMLDivElement = null;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.PinButton;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);


            this.rootDiv = document.createElement("div");
            this.rootDiv.style.position = "relative";
            this.PreventDefault = true;
            this.SetElement(this.rootDiv, true);

            this.divPin = document.createElement("div");

            this.rootDiv.appendChild(this.divPin);
            //this.divPin.innerHTML = "<img src='/ClientBin/Images/e.png' width='32' height='32'/>";
            this.RegisterEvent("PointerUp", (pControl: INMIControl, evt: Event, pPointer: ThePointer) => {
                this.SetProperty("Value", !this.GetProperty("Value"));
                if (this.GetProperty("OnClick"))
                    this.GetProperty("OnClick")(this.GetProperty("Value"), evt, pPointer);
            });

            return true;
        }

        public SetProperty(pName: string, pValue) {
            if (pName === "ClassName" && this.divPin) {
                this.divPin.className = pValue;
                return;
            } else if (pName === "Top" && this.divPin) {
                pValue = cde.CInt(pValue);
                this.divPin.style.top = pValue + "px";
                return;
            } else if (pName === "Foreground" && this.divPin) {
                this.divPin.style.color = pValue;
                return;
            } else if (pName === "Right" && this.divPin) {
                pValue = cde.CInt(pValue);
                this.divPin.style.right = pValue + "px";
                return;
            } else if (pName === "OnPointerDown" && this.divPin) {
                if (pValue) {
                    this.PreventManipulation = true;
                    this.HookEvents(false);
                    this.RegisterEvent("PointerDown", pValue);
                }
            } else if (pName === "Content") {
                this.divPin.innerHTML = pValue;
                return;
            }
            super.SetProperty(pName, pValue);
        }
    }

    /**
* Creates a touch overlay ontop of the screen but attached to another control specified by pTargetControl
* this is used for entries in Tables or other inline controls
* 
*
* (4.1 Ready!)
*/
    export class ctrlTouchOverlay extends TheNMIBaseControl implements INMITouchOverlay {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        divTiles: HTMLDivElement = null;
        public CurrentControl: INMIControl = null;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.TouchOverlay;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.CurrentControl = pTargetControl;
            this.divTiles = document.createElement('div');
            this.divTiles.className = "cdeOverlay";
            this.SetElement(this.divTiles, false);
            this.HookEvents(false);

            return true;
        }
    }

    /**
* Creates a dynamic control from an HTML5 snipplet with subcontrols
*
* (4.1 Ready!) TODO: Verify with FacePlate containing Macros
*/
    export class ctrlFacePlate extends cdeNMI.TheNMIBaseControl {
        constructor() {
            super(null, null);
        }

        mCtrlDIV: ctrlTileGroup = null;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID); //sets all the properties that are coming from the plugin on the elements

            if (cde.CBool(this.GetSetting("IsPlainHTML")) === true && pTargetControl) {
                this.SetElement(pTargetControl.GetContainerElement());
            }
            else {
                this.mCtrlDIV = new cdeNMI.ctrlTileGroup();
                this.mCtrlDIV.InitControl(pTargetControl);
                this.mCtrlDIV.MyRootElement.style.width = "inherit";
                this.mCtrlDIV.MyRootElement.style.height = "inherit";
                this.SetElement(this.mCtrlDIV.GetElement());
            }

            return true;
        }

        public SetProperty(pName: string, pValue) {
            super.SetProperty(pName, pValue);

            if (!this.GetContainerElement()) return;
            if (pName === "HTML") {
                cdeNMI.cdeParseHTML(this, this.MyTRF, pValue);
            } else if (pName === "HTMLUrl") {
                cdeNMI.MyEngine.cdeGetResource(pValue, (cookie, data: string) => {
                    if (data && !data.startsWith("ERR:")) {
                        cdeNMI.cdeParseHTML(this, this.MyTRF, data);
                        this.FireEvent(true, "OnIsLoaded", true);
                    }
                });
            } else if (pName === "Background") {
                this.mCtrlDIV.GetElement().style.background = pValue;
            }
        }
    }

    /**
* Creates a area that allows to upload files to the owner Service (Plugin) and Relay
*
* (4.1 Ready!)
*/
    export class ctrlDropUploader extends cdeNMI.TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        mContentTarget: INMIControl;
        mInfo: INMIControl;
        mZoomImg: INMIControl;
        mFileList: any[] = [];

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.DropUploader;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.mContentTarget = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(pTargetControl, { TRF: this.MyTRF });  // ctrlTileGroup.Create(pTargetControl, null);
            this.mContentTarget.SetProperty("ClassName", "ctrlDropUploader");
            this.mContentTarget.SetInitialSize(0);

            this.mZoomImg = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.Picture).Create(this.mContentTarget); //ctrlZoomImage.Create(this.mContentTarget);
            this.mZoomImg.SetProperty("Visibility", false);
            this.mZoomImg.SetProperty("Style", "width:100%;height:100%");

            //this.mInfo = ctrlSmartLabel.Create(this.mContentTarget, null, null, "", "p");
            this.mInfo = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.mContentTarget, { PreInitBag: ["Element=p"] });
            const holder = this.mContentTarget.GetElement();
            holder.ondragover = () => {
                this.mContentTarget.GetElement().className = 'ctrlDropUploaderHover';
                return false;
            };
            holder.ondragend = () => {
                this.mContentTarget.GetElement().className = 'ctrlDropUploader';
                return false;
            };
            holder.ondragleave = () => {
                this.mContentTarget.GetElement().className = 'ctrlDropUploader';
                return false;
            };
            holder.ondrop = (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.mContentTarget.GetElement().className = 'ctrlDropUploader';
                this.ProcessFiles(e.dataTransfer.files);
            }

            this.SetElement(this.mContentTarget.GetElement());
            return true;
        }

        public SetProperty(pName: string, pValue) {
            if (pName === "iValue" || pName === "Value") {
                if (this.mZoomImg && (pValue.toLowerCase().indexOf(".jpg") > 0 || pValue.toLowerCase().indexOf(".jpeg") > 0 || pValue.toLowerCase().indexOf(".png") > 0)) {
                    this.mZoomImg.SetProperty("Visibility", true);
                    this.mZoomImg.SetProperty("Source", pValue);
                    this.mInfo.SetProperty("Visibility", false);
                }
                else {
                    this.mInfo.SetProperty("Visibility", true);
                    this.mInfo.GetElement().innerHTML = pValue;
                }
            } else if (pName === "Title") {
                this.mInfo.SetProperty("iValue", pValue);
            } else if (pName === "Foreground" && this.mContentTarget) {
                this.mContentTarget.SetProperty("Foreground", pValue);
            } else if (pName === "Background" && this.mContentTarget) {
                this.mContentTarget.SetProperty("Background", pValue);
            } else {
                super.SetProperty(pName, pValue);
            }
        }

        UploadNext() {
            if (this.mFileList.length) {

                const nextFile = this.mFileList.shift();
                let tFileSize: number = this.GetProperty("MaxFileSize");
                if (!tFileSize) {
                    tFileSize = 512000;
                }
                if (tFileSize > 500000000) tFileSize = 500000000;
                if (nextFile.size >= tFileSize) { // 262144) { // 256kb
                    this.mInfo.GetElement().innerHTML += "File " + nextFile.name + " size " + nextFile.size + " too big - Max: " + tFileSize;
                    this.OnComplete(nextFile.size);
                } else {
                    this.mInfo.GetElement().innerHTML = "Reading: " + nextFile.name;
                    this.UploadFile(nextFile, status);
                }
            } else {
                this.mContentTarget.GetElement().className = 'ctrlDropUploader';
            }
        }
        OnComplete(size) {
            this.UploadNext();
        }

        UploadFile(file, status) {
            const reader = new FileReader();
            this.mInfo.GetElement().innerHTML = "Uploading: " + file.name;;
            reader.onload = (evt) => {
                const tres: any = reader.result;
                if (this.MyEngineName) {
                    let tFileName: string = file.name;
                    let tDir: string = this.GetProperty("TargetDir");
                    if (tDir) {
                        if (tDir.substr(tDir.length - 1, 1) !== '\\')
                            tDir += "\\";
                        tFileName = tDir + tFileName;
                    }
                    if (this.MyFieldInfo) {
                        let tPushName: string = "CDE_FILEPUSH:" + tFileName + ":" + this.MyFieldInfo.cdeO;
                        if (this.GetProperty("Cookie"))
                            tPushName += ":" + this.GetProperty("Cookie");
                        if (cde.CBool(this.GetProperty("AllowGlobalPush")) && cde.MyBaseAssets.MyEngines[this.MyEngineName])
                            cdeCommCore.PublishCentral(this.MyEngineName, tPushName, tres);
                        else
                            cdeCommCore.PublishToNode(this.MyFieldInfo.cdeN, this.MyEngineName, tPushName, tres);
                    }
                }
                this.FireEvent(false, "OnFilePushed", evt.target);
                if (this.mZoomImg && tres.indexOf("image") > 0) {
                    this.mZoomImg.SetProperty("Visibility", true);
                    this.mZoomImg.SetProperty("Source", tres);
                    this.mInfo.SetProperty("Visibility", false);
                }
                else {
                    this.mInfo.SetProperty("Visibility", true);
                    this.mInfo.GetElement().innerHTML = file.name + " - Done";
                }
            };
            reader.readAsDataURL(file);
        }

        ProcessFiles(pFileList) {
            if (!pFileList || !pFileList.length || this.mFileList.length) return;

            for (let i = 0; i < pFileList.length; i++) {
                this.mFileList.push(pFileList[i]);
            }
            this.UploadNext();
        }

        ///legacy support
        public static Create(pTargetControl: cdeNMI.INMIControl, pTargetEngine: string, pTRF?: cdeNMI.TheTRF, pTitle?: string): ctrlDropUploader {
            const t: ctrlDropUploader = new ctrlDropUploader(pTRF);
            t.MyEngineName = pTargetEngine;
            t.InitControl(pTargetControl, pTRF);
            if (pTitle)
                t.SetProperty("Title", pTitle);
            return t;
        }
    }


    /**
    * Creates a Zoom Image - size of one Tile and zooms to 3x Tiles if zooming is enabled
    *
    * This control is NOT and input control for Form or Table
    * (4.1 Ready!)
    */
    export class ctrlZoomImage extends TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        Img: HTMLImageElement = null;
        HostDiv: HTMLDivElement;
        imgNumber = 0;
        MyZoom = null;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.Picture;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.HostDiv = document.createElement('div');

            this.Img = document.createElement('img');
            this.Img.className = "Blocked";

            this.Img.style.width = "inherit";
            this.Img.style.height = "inherit";
            this.Img.addEventListener('error', (evt) => {
                this.OnImgError(evt);
            });

            this.HostDiv.appendChild(this.Img);
            if (cde.CBool(this.GetSetting("EnableZoom")) === true) {
                this.MyZoom = new Zoom(this.Img, { rotate: cde.CBool(this.GetSetting("AllowRotate")) }, null);
            }

            super.SetProperty("ZoomLevel", 1);

            this.SetElement(this.HostDiv, true);

            this.RegisterEvent("Resize", (sender, newSize: number) => {
                if (newSize <= cde.CInt(this.GetProperty("MaxTileWidth")) && newSize >= cde.CInt(this.GetProperty("MinTileWidth"))) {
                    this.MyTE.SetProperty("TileWidth", newSize);
                    switch (newSize) {
                        case 6: this.MyTE.SetProperty("TileHeight", 5); break;
                        default:
                            this.MyTE.SetProperty("TileHeight", (newSize / 4 * 3));
                            break;
                    }
                    //this.SetProperty("ControlTW", newSize);
                }
            });
            return true;
        }

        public SetProperty(pName: string, pValue) {
            let tTile = 0;
            if (pName === "Name") {
                if (this.Img)
                    this.Img.alt = pValue;
            } else if ((pName === "Source" || pName === "Value" || pName === "iValue") && this.Img) {
                try {
                    if (pValue && pValue.startsWith("FA")) {
                        pValue = "<i class='fa faIcon " + (pValue.substr(3, 1) === "S" ? "fa-spin " : "") + "fa-" + pValue.substr(2, 1) + "x'>&#x" + pValue.substr(4, pValue.length - 4) + ";</i>";
                    }
                    else if (pValue && (pValue.substring(0, 5) === "data:" || cde.CBool(super.GetProperty("IsBlob")) || pValue.length > 512)) {
                        let tformat: string = super.GetProperty("ImgFormat");
                        if (!tformat) tformat = "jpeg";
                        if (pValue.substr(0, 5) !== "data:")
                            pValue = "data:image/" + tformat + ";base64," + pValue;
                        if (!this.HostDiv.className)
                            this.HostDiv.className = "cdeLiveImg";
                        this.Img.src = pValue;
                    } else if (pValue) {
                        const tPa: string[] = cde.CStr(pValue).split(';');
                        let tImgSrc: string = pValue;
                        if (tPa.length > 1) {
                            this.SetProperty("ImageOpacity", tPa[1]);
                            if (tPa.length > 2)
                                tImgSrc = tPa[0];
                            else
                                tImgSrc = cde.FixupPath(tPa[0]);
                        }
                        const tN: string = cde.MyBaseAssets.MyCommStatus.InitialNPA;
                        this.Img.src = cde.FixupPath(tImgSrc + (!tN ? "" : "?SID=" + tN.substr(4, tN.length - (4 + (tN.indexOf(".ashx") > 0 ? 5 : 0)))));
                    }
                } catch (ex) {
                    cdeNMI.ShowToastMessage(pValue + ":IMG SETP ERROR:" + ex);
                }
                if (pName === "Source" || !pValue)
                    return;
            } else if (pName === "ZoomLevel") {
                this.OnClickFunction(this, null, null);
            } else if (pName === "ControlTW") {
                tTile = cdeNMI.GetSizeFromTile(cde.CInt(pValue));
                if (tTile > 0) {
                    const tSKY: number = cde.CInt(this.GetProperty("TileFactorX"));
                    if (tSKY > 1)
                        tTile /= tSKY;
                    this.Img.width = tTile;
                    this.Img.style.width = tTile + "px";
                }
            } else if (pName === "ControlTH") {
                tTile = cdeNMI.GetSizeFromTile(cde.CInt(pValue));
                if (tTile > 0) {
                    const tSKY: number = cde.CInt(this.GetProperty("TileFactorY"));
                    if (tSKY > 1)
                        tTile /= tSKY;
                    this.Img.height = tTile;
                    this.Img.style.height = tTile + "px";
                }
            } else if (pName === "Width") {
                tTile = cde.CDbl(pValue);
                if (tTile > 0) {
                    const tSKY: number = cde.CInt(this.GetProperty("TileFactorX"));
                    if (tSKY > 1)
                        tTile /= tSKY;
                    this.Img.width = tTile;
                }
            } else if (pName === "Height") {
                tTile = cde.CDbl(pValue);
                if (tTile > 0) {
                    const tSKY: number = cde.CInt(this.GetProperty("TileFactorY"));
                    if (tSKY > 1)
                        tTile /= tSKY;
                    this.Img.height = tTile;
                }
            } else if (pName === "ImageOpacity" && this.Img) {
                this.Img.style.opacity = pValue;
            } else if (pName === "StartSequence") {
                this.RequestRedraw();
            } else if (pName === "Background") {
                this.HostDiv.style.backgroundColor = pValue;
            } else if (pName === "EnableZoom") {
                this.EnabledZoom();
                this.HookEvents(false);
            } else if (pName === "ClassName") {
                this.Img.className = pValue;
            } else if (pName === "OnClick") {
                this.HookEvents(false);
                //if (pValue && (typeof (pValue) == 'string') && pValue.toString().substr(0, 4) == "TTS:")
                //    pValue = "cdeNMI.MyScreenManager.TransitToScreen('" + pValue.substr(4) + "', true)";    //4.107:TODO Update with real SCreenManager
                this.RegisterEvent("OnClick", pValue);
                this.RegisterEvent("PointerUp", this.DoFireClick);
                this.Img.style.cursor = "pointer";
            } else if (pName === "AutoAdjust" && this.MyTarget) {
                this.Img.width = this.MyTarget.GetElement().clientWidth;
                this.Img.height = this.MyTarget.GetElement().clientHeight;
            }
            super.SetProperty(pName, pValue);
        }

        OnImgError(evt) {
            if (cdeNMI.MyEngine) {
                const t: string = this.Img.src;
                const f = cdeNMI.GetLocation(t).pathname;
                cdeNMI.MyEngine.cdeGetImage(f, (pThis: ctrlZoomImage, pData) => {
                    let tPlanar: ThePlanarImage;
                    try {
                        tPlanar = JSON.parse(pData);
                        const tP: number = tPlanar.ImageSource.indexOf(".");
                        const tExt: string = tPlanar.ImageSource.substr(tP + 1);
                        pThis.SetProperty("Source", "data:image/" + tExt + ";base64," + tPlanar.Bits);
                    }
                    catch (ex) {
                        cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "SetProperty:OnImgError", "Image settting for  Inlining (" + tPlanar.ImageSource + ") failed with " + ex);
                    }
                }, this);
            }
        }

        private EnabledZoom() { //TODO: Create cool Full Zoom
            this.HostDiv.style.width = "";
            this.HostDiv.style.height = "";
            this.Img.style.cursor = "pointer";
            this.RegisterEvent("PointerUp", (obj: INMIControl, evt: Event, pPointer: ThePointer) => {
                this.OnClickFunction(obj, evt, pPointer);
            });
        }

        private OnClickFunction(obj: INMIControl, evt: Event, pPointer: ThePointer) {
            if (!this.Img || (pPointer && pPointer.PathLength() > cdeNMI.MyNMISettings.DeadPathLength))
                return;
            if (!this.Img ||
                cde.CBool(this.GetProperty("Disabled")) || (this.MyTRF && this.MyTRF.FldInfo && (this.MyTRF.FldInfo.Flags & 2) === 0)) {
                if (cde.CBool(this.GetProperty("EnableZoom")) === true && this.MyZoom) {
                    this.MyZoom.destroy();
                    this.MyZoom = new Zoom(this.Img, { rotate: cde.CBool(this.GetSetting("AllowRotate")) }, null);
                }
                return;
            }
            if (evt) {
                evt.cancelBubble = true;
                evt.stopPropagation();
            }
            let tH = cde.CDbl(this.GetProperty("FullHeight"));
            if (tH === 0)
                tH = this.Img.naturalHeight;
            if (tH === 0)
                tH = cdeNMI.GetSizeFromTile(1);
            let tW = cde.CDbl(this.GetProperty("FullWidth"));
            if (tW === 0)
                tW = this.Img.naturalWidth;
            if (tW === 0)
                tW = cdeNMI.GetSizeFromTile(1);

            let cTW: number = cde.CDbl(this.GetProperty("ControlTW"));
            if (cTW === 0)
                cTW = 1;
            let cTH: number = cde.CDbl(this.GetProperty("ControlTH"));
            if (cTH === 0)
                cTH = 1;

            switch (super.GetProperty("ZoomLevel")) {
                case 1:
                    {
                        if (this.Img.src.substr(0, 5) !== "data:" && this.Img.src.indexOf("_s.") > 0) {
                            let tUrl: string = this.Img.src.substr(0, this.Img.src.indexOf("_s."));
                            tUrl += this.Img.src.substr(this.Img.src.lastIndexOf("."));
                            this.Img.src = tUrl;
                            tW = this.Img.naturalWidth;
                        }
                        const tWid: number = cdeNMI.GetSizeFromTile(3);
                        if (tWid > tW) {
                            this.ShowNaturalSize(cTW, cTH, tW / tH);
                            break;
                        }
                        //$(this.Img).
                        //    animate({
                        //        "width": tWid,
                        //        "height": (tWid / (tW / tH))
                        //    },
                        //        500,
                        //        "easeOutCirc");
                        super.SetProperty("ZoomLevel", 2);
                    }
                    break;
                case 2:
                    {
                        const tWid2: number = cdeNMI.GetSizeFromTile(6);
                        if (tWid2 > tW) {
                            this.ShowNaturalSize(cTW, cTH, tW / tH);
                            break;
                        }
                        //$(this.Img).
                        //    animate({
                        //        "width": tWid2,
                        //        "height": (tWid2 / (tW / tH))
                        //    },
                        //        500,
                        //        "easeOutCirc");
                        super.SetProperty("ZoomLevel", 3);
                    }
                    break;
                case 3:
                    {
                        let tWid3: number = cdeNMI.GetSizeFromTile(12);
                        if (tWid3 > tW) {
                            tWid3 = tW;
                        }
                        //$(this.Img).
                        //    animate({
                        //        "width": tWid3,
                        //        "height": (tWid3 / (tW / tH))
                        //    },
                        //        500,
                        //        "easeOutCirc");
                        super.SetProperty("ZoomLevel", 0);
                    }
                    break;
                default:
                    this.ShowNaturalSize(cTW, cTH, tW / tH);
                    break;
            }
        }


        ShowNaturalSize(cTW: number, cTH: number, cRatio: number) {
            //var tWid3: number = cdeNMI.GetSizeFromTile(cTW);
            //if (cde.CBool(this.GetProperty("AutoAdjust"))) {
            //    //$(this.Img).animate({
            //    //    "width": cdeNMI.GetSizeFromTile(cTW),
            //    //    "height": cdeNMI.GetSizeFromTile(cTH)
            //    //}, 500, "easeOutCirc");
            //} else {
            //    //$(this.Img).animate({
            //    //    "width": tWid3,
            //    //    "height": (tWid3 / cRatio)
            //    //}, 500, "easeOutCirc");
            //}
            super.SetProperty("ZoomLevel", 1);
        }

        public RedrawImage() {
            if (this.imgNumber > this.GetProperty("LastSeqNo")) {
                if (this.GetProperty("DoLoop") === true) {
                    this.imgNumber = 0;
                    this.RequestRedraw();
                }
            } else {
                this.Img.src = this.GetProperty("Value") + ("00000" + (this.imgNumber++).toString()).slice(-5) + ".png"; // "raining/Raining_"
                this.RequestRedraw();
            }
        }
        public RequestRedraw() {
            const tWindow: any = window;
            if (tWindow.webkitRequestAnimationFrame)
                tWindow.webkitRequestAnimationFrame(() => {
                    this.RedrawImage();
                });
            else
                window.setTimeout(() => {
                    this.RedrawImage();
                }, Math.floor(1000 / 60));
        }

        //Backward compat
        static Create(pTargetControl: cdeNMI.INMIControl, pWidth?: number, pHeight?: number, pUrl?: string, pClass?: string): ctrlZoomImage {
            const tTemp: ctrlZoomImage = new ctrlZoomImage();
            tTemp.InitControl(pTargetControl);

            if (pClass)
                tTemp.SetProperty("ClassName", pClass);
            if (pUrl) {
                if (pUrl.substring(0, 5) === "data:")
                    tTemp.HostDiv.className = "cdeLiveImg";
                tTemp.SetProperty("iValue", pUrl);
            }
            if (pWidth >= 0 && pHeight >= 0) {
                tTemp.EnabledZoom();
            }
            tTemp.SetProperty("FullHeight", pHeight);
            tTemp.SetProperty("FullWidth", pWidth);
            return tTemp;
        }
    }


    /**
* Creates a progress bar
*
* (4.1 Ready!)
*/
    export class ctrlProgressBar extends cdeNMI.TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        mContentTarget: HTMLProgressElement;
        mBaseCtrl: INMIControl;
        mWidth = 0;
        mHeight = 0;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.ProgressBar;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.mBaseCtrl = cdeNMI.MyTCF.CreateBaseControl().Create(pTargetControl, { TRF: this.MyTRF });
            this.mBaseCtrl.SetElement(document.createElement("div"));
            this.mBaseCtrl.GetElement().className = "ctrlProgressBar";
            this.mBaseCtrl.SetInitialSize(0);

            this.mContentTarget = document.createElement("progress");
            this.mContentTarget.className = "ctrlProgressBar";
            this.mBaseCtrl.GetElement().appendChild(this.mContentTarget);
            this.SetElement(this.mBaseCtrl.GetElement());
            this.SetProperty("MaxValue", 100);
            return true;
        }

        public SetProperty(pName: string, pValue) {
            super.SetProperty(pName, pValue);

            if (pName === "Background") {
                this.mContentTarget.style.background = pValue;
            } else if (pName === "Foreground") {
                this.mContentTarget.style.color = pValue;
            } else if (pName === "BarClassName") {
                this.mContentTarget.className = pValue;
            } else if (pName === "MaxValue") {
                pValue = cde.CInt(pValue);
                this.mContentTarget.max = pValue;
            } else if (pName === "Value" || pName === "iValue") {
                this.mContentTarget.value = cde.CDbl(pValue);
            }
        }

        //legacy support
        public static Create(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pValue?: number, pMaxVal?: number): ctrlProgressBar {
            const t: ctrlProgressBar = new ctrlProgressBar(pTRF);
            t.InitControl(pTargetControl, pTRF);

            if (pMaxVal) {
                t.SetProperty("MaxValue", pMaxVal);
            }
            if (!pValue) pValue = 0;
            t.SetProperty("iValue", pValue);
            return t;
        }
    }
    export class ctrlProgressBarCool extends cdeNMI.TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        mContentTarget: HTMLSpanElement;
        mBaseCtrl: INMIControl;
        mWidth = 0;
        mHeight = 0;
        mMaxValue = 100;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.ProgressBar;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.mBaseCtrl = cdeNMI.MyTCF.CreateBaseControl().Create(pTargetControl, { TRF: this.MyTRF });
            this.mBaseCtrl.SetElement(document.createElement("div"));
            this.mBaseCtrl.GetElement().className = "cdeMeter";
            this.mBaseCtrl.SetInitialSize(0);

            this.mContentTarget = document.createElement("span");
            this.mBaseCtrl.GetElement().appendChild(this.mContentTarget);
            this.mContentTarget.style.width = "0px";
            this.mContentTarget.style.height = (this.mBaseCtrl.MyHeight - 20) + "px";
            this.SetElement(this.mBaseCtrl.GetElement());

            cde.MyBaseAssets.RegisterEvent("ThemeSwitched", () => {
                if (!this.GetProperty("Background")) {
                    if (cde.MyBaseAssets.MyServiceHostInfo.IsLiteTheme)
                        this.mBaseCtrl.GetElement().style.background = "rgba(80, 80, 80, 0.1)";
                    else
                        this.mBaseCtrl.GetElement().style.background = "rgba(80, 80, 80, 0.5)";
                }
                this.DoRender();
            });
            return true;
        }

        public SetProperty(pName: string, pValue) {
            super.SetProperty(pName, pValue);

            if (pName === "Background") {
                this.mContentTarget.style.background = pValue;
            } else if (pName === "Foreground") {
                this.mContentTarget.style.color = pValue;
            } else if (pName === "BarClassName") {
                this.mContentTarget.className = pValue;
            } else if (pName === "MaxValue") {
                this.mMaxValue = cde.CInt(pValue);
                this.DoRender();
            } else if (pName === "Value" || pName === "iValue") {
                this.DoRender();
            }
        }

        DoRender() {
            let tLen: number = this.GetProperty("Value");
            if (tLen > this.mMaxValue)
                tLen = this.mMaxValue;
            const tWid: number = (this.mBaseCtrl.MyWidth - 20) / this.mMaxValue * tLen;
            this.mContentTarget.style.width = tWid + "px";
        }

        //legacy support
        public static Create(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pValue?: number, pMaxVal?: number): ctrlProgressBarCool {
            const t: ctrlProgressBarCool = new ctrlProgressBarCool(pTRF);
            t.InitControl(pTargetControl, pTRF);

            if (pMaxVal) {
                t.SetProperty("MaxValue", pMaxVal);
            }
            if (!pValue) pValue = 0;
            t.SetProperty("iValue", pValue);
            return t;
        }

    }


    /**
* Creates a VideoViewer. Target has to be set to zero to creat its own frame. Otherwise it will fill the parent container with the video
*
* (4.1 Ready!)
*/
    export class ctrlVideoViewer extends TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        mVideo: HTMLVideoElement = null;
        mVideoSource: HTMLSourceElement = null;
        divFrame: INMIControl = null;
        mCamBut: INMIControl = null;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.VideoViewer;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.mVideo = document.createElement("video");
            this.mVideo.style.backgroundColor = "black";
            this.mVideo.autoplay = true;
            this.mVideo.style.width = "inherit";
            this.mVideo.style.height = "inherit";
            this.mVideo.onerror = () => { cdeNMI.ShowToastMessage("Cannot play Video"); };
            this.mVideoSource = document.createElement('source');
            this.mVideo.appendChild(this.mVideoSource);

            this.divFrame = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup);
            this.divFrame.InitControl(pTargetControl, this.MyTRF);
            this.divFrame.SetProperty("Background", "gray");
            this.divFrame.SetInitialSize(0);
            this.mCamBut = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(this.divFrame, { PostInitBag: ["Text=MyCam", "TileWidth=1", "TileHeight=1"] });
            this.mCamBut.SetProperty("OnClick", () => {
                this.ShowLiveVideo();
            });
            this.mCamBut.SetProperty("Visibility", false);
            this.divFrame.GetElement().appendChild(this.mVideo);
            this.SetElement(this.divFrame.GetElement());

            return true;
        }

        public SetProperty(pName: string, pValue) {
            super.SetProperty(pName, pValue);
            if ((pName === "Source" || pName === "Value" || pName === "iValue") && this.mVideo) {
                if (pValue === "LIVE")
                    this.ShowLiveVideo();
                else {
                    this.mVideoSource.src = pValue;
                    this.mVideo.play();
                }
            } else if (pName === "ShowCam") {
                this.mCamBut.SetProperty("Visibility", true);
            } else if (pName === "Background") {
                this.mVideo.style.backgroundColor = pValue;
            } else if (pName === "MainBackground") {
                this.divFrame.SetProperty("Background", pValue);
            } else if (pName === "ClassName" && this.mVideo) {
                this.mVideo.className = pValue;
            } else if (pName === "ShowControls" && this.mVideo) {
                if (cde.CBool(pValue))
                    this.mVideo.setAttribute("controls", "");
                else
                    this.mVideo.removeAttribute("controls");
            }
        }

        private ShowLiveVideo() {
            const n = navigator as any;
            n.getUserMedia = n.getUserMedia || n.webkitGetUserMedia || n.mozGetUserMedia || n.msGetUserMedia;

            try {
                if (n.getUserMedia) {
                    this.mVideoSource.src = null;
                    n.getUserMedia({ video: true, audio: true }, (stream) => {
                        this.mVideoSource.src = stream || stream; // Opera.
                        this.mVideo.play();
                    }, (error) => {
                        if (cdeNMI.MyPopUp)
                            cdeNMI.MyPopUp.Show("An Video-Display error occurred: [CODE " + error.code + "]", true);
                    });
                }
                else {
                    if (cdeNMI.MyPopUp)
                        cdeNMI.MyPopUp.Show("Native camera is not supported in this browser!", true);
                }
            }
            catch (e) {
                if (cdeNMI.MyPopUp)
                    cdeNMI.MyPopUp.Show("An Video-Display error occurred: " + e, true);
            }
        }

    }


    /* Creates a single Check Box
    *
    * (4.1 Ready!)
    */
    export class ctrlCheckBox extends TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        static CreateOLD(pTarget: INMIControl, pScreenID: string, pTRF: TheTRF, IsChecked: boolean, pTitle?: string, pIsOverLay?: boolean, pClassName?: string): ctrlCheckBox {
            const tTile: ctrlCheckBox = new ctrlCheckBox(pTRF);
            tTile.InitControl(pTarget, pTRF, null, pScreenID);
            if (pClassName)
                tTile.SetProperty("ClassName", pClassName);
            tTile.SetProperty("iValue", IsChecked);
            if (cde.CBool(pIsOverLay))
                tTile.SetProperty("IsOverlay", pIsOverLay);
            if (pTitle)
                tTile.SetProperty("Title", pTitle);
            return tTile;
        }

        MyCheckBox: HTMLDivElement = null;
        InnerCheck: HTMLDivElement = null;
        InnerText: HTMLSpanElement = null;
        IsCustomCheck = false;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.SingleCheck;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.MyCheckBox = document.createElement("div");
            this.MyCheckBox.className = "ctrlCheckBox";
            this.MyCheckBox.style.width = (cdeNMI.GetSizeFromTile(1) - 4) + "px";
            this.MyCheckBox.style.height = (cdeNMI.GetSizeFromTile(1) - 4) + "px";
            this.InnerCheck = document.createElement("div");
            this.InnerCheck.className = "ctrlCheckBoxInner";
            this.InnerCheck.style.width = (cdeNMI.GetSizeFromTile(1) - 6) + "px";
            this.InnerCheck.style.height = (cdeNMI.GetSizeFromTile(1) - 6) + "px";
            this.InnerCheck.style.pointerEvents = "none";
            this.MyCheckBox.appendChild(this.InnerCheck);

            const tHeader = this.GetSetting("Title");
            if (tHeader)
                this.SetProperty("Title", tHeader);

            this.IsCustomCheck = true;
            this.SetElement(this.MyCheckBox, true);
            this.SetProperty("Disabled", (!this.MyFieldInfo || (this.MyFieldInfo.Flags & 2) === 0));     //TODO: We need a consequent way of doing this!

            if (cde.CBool(this.GetSetting("DefaultValue")))
                this.SetProperty("iValue", true);
            else
                this.SetProperty("iValue", false);

            this.EnableDisable(cde.CBool(this.GetProperty("Disabled")));
            return true;
        }



        public SetProperty(pName: string, pValue) {
            if (pName === "Value" || pName === "iValue") {
                if (cde.CBool(this.GetProperty("IsChecked")) !== cde.CBool(pValue))
                    this.IsDirty = true;
                if (cde.CBool(pValue))
                    this.SetProperty("IsChecked", true);
                else
                    this.SetProperty("IsChecked", false);
                this.ShowToggle();
            } else if (pName === "CheckImage") {
                if (pValue && pValue !== "CDE_NOP") {
                    if ((pValue as string).toLowerCase().indexOf(".png") < 0 &&
                        (pValue as string).toLowerCase().indexOf(".jpg") < 0) {
                        if (!this.InnerText) {
                            this.InnerText = document.createElement("span");
                            this.InnerCheck.appendChild(this.InnerText);
                        }
                        this.InnerText.className = "cdeCheckIcon";
                        this.InnerText.innerHTML = pValue;
                        if (this.GetProperty("Foreground"))
                            this.InnerText.style.color = this.GetProperty("Foreground");
                        else
                            this.InnerText.style.color = "black";
                        this.InnerCheck.style.backgroundImage = "none";
                    } else
                        this.InnerCheck.style.backgroundImage = pValue;
                    this.IsCustomCheck = true;
                    this.InnerCheck.style.display = "";
                } else {
                    this.IsCustomCheck = false;
                    this.InnerCheck.style.display = "";
                    this.InnerCheck.style.backgroundImage = 'url("../Images/cdeInnerCheck.png")';
                    this.InnerText.className = "cdeCheckText";
                    this.InnerText.innerHTML = this.GetProperty("Title");
                    this.ShowToggle();
                }
                this.ShowToggle();
            } else if (pName === "Background" && this.MyCheckBox) {
                this.MyCheckBox.style.background = pValue;
            } else if (pName === "Foreground" && this.InnerText) {
                this.InnerText.style.color = pValue;
            } else if (pName === "AreYouSure") {
                this.UnregisterEvent("PointerUp");
                this.EnableDisable(cde.CBool(this.GetProperty("Disabled")));
            } else if (pName === "Disabled") {
                if ((!this.MyFieldInfo || (this.MyFieldInfo.Flags & 2) === 0))
                    pValue = true;
                this.EnableDisable(cde.CBool(pValue));
            } else if (pName === "IsOverlay") {
                cdeNMI.SetZIndex(this.MyCheckBox, cde.CBool(pValue) ? 1300 : 0);
                cdeNMI.SetZIndex(this.InnerCheck, cde.CBool(pValue) ? 1300 : 0);
            } else if (pName === "Title" && this.InnerCheck) {
                if (!this.InnerText) {
                    this.InnerText = document.createElement("span");
                    this.InnerText.className = "cdeCheckText";
                    this.InnerCheck.appendChild(this.InnerText);
                }
                this.InnerText.innerHTML = pValue;
            }

            super.SetProperty(pName, pValue);
        }



        PostCreate(pTE: INMITileEntry) {
            if (!cde.CBool(pTE.GetProperty("IsInTable"))) {
                this.SetProperty("IsHitTestDisabled", true);
                this.SetProperty("NoClick", true);
            }
            if ((this.MyFieldInfo.Flags & 2) !== 0)
                pTE.MyTEContainer.SetProperty("OnClick", (sender: INMIControl, evt: Event) => {
                    if (!(evt as any).AYSFired && this.GetProperty("AreYouSure")) {
                        if (cdeNMI.MyPopUp)
                            cdeNMI.MyPopUp.Show(this.GetProperty("AreYouSure"),
                                false,
                                null,
                                1,
                                () => {
                                    this.ToggleCheck(null);
                                });
                    } else
                        this.ToggleCheck(evt);
                });
            else
                this.SetProperty("Disabled", true);
        }


        EnableDisable(IsDisabled: boolean) {
            this.UnregisterEvent("PointerUp");
            if (!IsDisabled) {
                this.RegisterEvent("PointerUp", (sender, evt) => {
                    if (this.GetProperty("NoClick") !== true) {
                        if (this.GetProperty("AreYouSure")) {
                            if (cdeNMI.MyPopUp)
                                cdeNMI.MyPopUp.Show(this.GetProperty("AreYouSure"), false, null, 1, () => {
                                    this.ToggleCheck(null);
                                });
                        }
                        else
                            this.ToggleCheck(evt);
                    }
                });
            }
        }

        ToggleCheck(evt) {
            if (!cde.CBool(this.GetProperty("IsChecked")))
                this.SetProperty("IsChecked", true);
            else
                this.SetProperty("IsChecked", false);
            this.ShowToggle();
            if (this.GetProperty("NoClick") === true || this.GetProperty("UpdateTable") === true)
                this.SetProperty("Value", cde.CBool(this.GetProperty("IsChecked")));
            else
                this.SetProperty("iValue", cde.CBool(this.GetProperty("IsChecked")));
        }

        ShowToggle() {
            if (!cde.CBool(this.GetProperty("IsChecked"))) {
                this.InnerCheck.style.opacity = "0.05";
                if (!this.IsCustomCheck)
                    this.InnerCheck.style.display = "none";
            }
            else {
                this.InnerCheck.style.opacity = "1";
                if (!this.IsCustomCheck)
                    this.InnerCheck.style.display = "";
            }
        }

        //backward compat
        static Create(pTarget: INMIControl, pScreenID: string, pTRF: TheTRF, IsChecked: boolean, pTitle?: string, pIsOverLay?: boolean, pClassName?: string): ctrlCheckBox {
            const tTile: ctrlCheckBox = new ctrlCheckBox(pTRF);
            tTile.InitControl(pTarget, pTRF, null, pScreenID);
            if (pClassName)
                tTile.SetProperty("ClassName", pClassName);
            tTile.SetProperty("iValue", IsChecked);
            if (cde.CBool(pIsOverLay))
                tTile.SetProperty("IsOverlay", pIsOverLay);
            if (pTitle)
                tTile.SetProperty("Title", pTitle);
            return tTile;
        }
    }


    /**
    * Creates a row of Check Box fields
    *
    * (4.1 Ready!)
    */
    export class ctrlCheckField extends TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        static CreateOLD(pTarget: INMIControl, pScreenID: string, pTRF: TheTRF, pFldValue: number, pIsOverLay?: boolean, pClassName?: string): ctrlCheckField {
            const tTile: ctrlCheckField = new ctrlCheckField(pTRF);
            tTile.InitControl(pTarget, pTRF, null, pScreenID);
            if (pClassName)
                tTile.SetProperty("ClassName", pClassName);
            tTile.SetProperty("iValue", pFldValue);
            if (cde.CBool(pIsOverLay))
                tTile.SetProperty("IsOverlay", pIsOverLay);
            return tTile;
        }

        MyCheckBoxes: INMIControl[];
        MyLabels: INMIControl[];
        MyTiles: INMIControl[];
        MyDIV: HTMLDivElement = null;
        tSendButton: INMIControl = null;
        tInfo: INMIControl = null;
        BitCount = 1;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.CheckField;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.MyDIV = document.createElement("div");
            this.MyDIV.className = "ctrlCheckField";
            this.SetElement(this.MyDIV);

            let taTitle: string[] = null;
            let HasOptions = false;
            if (this.GetSetting("Options")) {
                taTitle = this.GetSetting("Options").split(';');
                HasOptions = true;
            } else if (this.GetSetting("ImageList")) {
                taTitle = this.GetSetting("ImageList").split(',');
                HasOptions = true;
            }
            const tTileFY = cde.CInt(this.GetSetting("TileFactorY"));
            let tTileX = cdeNMI.GetControlWidth(this);
            if (tTileX < 2) tTileX = 2;

            this.MyCheckBoxes = new Array<INMIControl>();
            this.MyLabels = new Array<INMIControl>();
            this.MyTiles = new Array<INMIControl>();
            if (!this.MyFieldInfo) {
                this.MyCheckBoxes[0] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SingleCheck).Create(this, { ScreenID: pScreenID, TRF: new cdeNMI.TheTRF("", 0, new TheFieldInfo(cdeControlType.SingleCheck, 1, "no TRF", 0)) });
            } else {
                this.BitCount = cde.CInt(this.GetSetting("Bits"));
                if (this.BitCount === 0 && taTitle && taTitle.length > 0)
                    this.BitCount = taTitle.length;
                if (HasOptions) {
                    this.SetProperty("TileHeight", this.BitCount);
                    if (tTileFY > 1)
                        this.SetProperty("TileFactorY", tTileFY);
                }
                //TODO: Here is the loop that creates the CheckBoxes (toggles). Instead of using checkboxes with 1x1 tilewidth can you create another smartlabel behind each toggle for the label 
                for (let i = this.BitCount - 1; i >= 0; i--) {
                    let tTitle: string = (1 << i).toString();
                    if (taTitle && taTitle.length > i) tTitle = taTitle[i];

                    if (HasOptions) {
                        this.MyTiles[i] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup);
                        this.MyTiles[i].InitControl(this);
                        this.MyTiles[i].SetProperty("TileWidth", tTileX);
                        this.MyTiles[i].SetProperty("TileHeight", 1);
                        this.MyTiles[i].SetProperty("Display", "table");

                        this.MyCheckBoxes[i] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SingleCheck).Create(this.MyTiles[i], { ScreenID: pScreenID, TRF: new cdeNMI.TheTRF("", 0, new TheFieldInfo(cdeControlType.SingleCheck, 1, "no TRF", this.MyFieldInfo.Flags & 2)) });
                        this.MyCheckBoxes[i].RegisterEvent("OniValueChanged", () => {
                            this.GetCheckValue("Value");
                        });
                        this.MyLabels[i] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.MyTiles[i], { PreInitBag: ["Element=div"], TRF: new cdeNMI.TheTRF("", 0, new TheFieldInfo(cdeControlType.SmartLabel, 1, "no TRF", 256)) });
                        this.MyLabels[i].SetProperty("Value", tTitle);
                        this.MyLabels[i].SetProperty("TileWidth", tTileX - 1);
                        this.MyLabels[i].SetProperty("Display", "table-cell");
                        this.MyLabels[i].SetProperty("HorizontalAlignment", "left");
                        this.MyLabels[i].SetProperty("VerticalAlignment", "middle");
                        if (tTileFY > 1) {
                            this.MyTiles[i].SetProperty("TileFactorY", tTileFY);
                            this.MyCheckBoxes[i].SetProperty("TileFactorY", tTileFY);
                            this.MyLabels[i].SetProperty("TileFactorY", tTileFY);
                        }
                    }
                    else
                        this.MyCheckBoxes[i] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SingleCheck).Create(this, { ScreenID: pScreenID, TRF: new cdeNMI.TheTRF("", 0, new TheFieldInfo(cdeControlType.SingleCheck, 1, "no TRF", this.MyFieldInfo.Flags & 2)) });
                }
            }
            if (this.MyTRF && this.MyTRF.FldInfo && (this.MyTRF.FldInfo.Flags & 2) !== 0) {
                //this.tSendButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(this, { PreInitBag: ["ControlTW=1", "ControlTH=1"], PostInitBag: ["Title=<span class='fa fa-3x'>&#xf058;</span>", "ClassName=cdeOkButton"] });
                //this.tSendButton.SetProperty("OnClick", (pSender: INMIControl, evt: Event) => {
                //    if (this.IsDisabled) return;
                //    cdeNMI.StopPointerEvents(evt);
                //    this.GetCheckValue("Value");
                //});
                if (this.GetSetting("ResultLabel"))
                    this.tInfo = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this, { PreInitBag: ["ControlTW=2", "ControlTH=1", "NoTE=true"], PostInitBag: ["Text=" + this.GetSetting("ResultLabel"), "ClassName=cdeResultLabel"] });
            }

            this.SetProperty("Disabled", (!this.MyFieldInfo || (this.MyFieldInfo.Flags & 2) === 0));         //TODO: We need a consequent way of doing this!

            if (cdeNMI.MyEngine) {
                if (cde.GuidToString(this.MyFieldInfo.cdeMID) === "DD3DF621ACAC4B77985687165138B028") {
                    cdeNMI.MyEngine.RegisterEvent("NMI_UIDACL", (sender, tsm: cde.TSM) => {
                        if (cde.GuidToString(tsm.OWN) === cde.GuidToString(this.MyFieldInfo.cdeMID))
                            this.SetProperty("iValue", cde.CInt(tsm.PLS));
                    });
                }
            }

            return true;
        }

        public GetProperty(pName: string) {
            if (pName === "iValue" || pName === "Value") {
                this.GetCheckValue("iValue");
            }
            return super.GetProperty(pName);
        }

        public SetProperty(pName: string, pValue) {
            let i: number;
            if (pName === "Value" || pName === "iValue") {
                if (pValue) {
                    const tVal: number = cde.CInt(pValue);
                    if (this.MyFieldInfo) {
                        for (i = cde.CInt(this.MyFieldInfo["Bits"]) - 1; i >= 0; i--) {
                            if ((tVal & (1 << i)) !== 0)
                                this.MyCheckBoxes[i].SetProperty("iValue", true);
                            else
                                this.MyCheckBoxes[i].SetProperty("iValue", false);
                        }
                    } else {
                        this.MyCheckBoxes[0].SetProperty("iValue", false);
                    }
                    if (this.tInfo)
                        this.tInfo.SetProperty("Text", this.GetProperty("ResultLabel") + tVal);
                }
            } else if (pName === "ImageList" && this.MyCheckBoxes) {
                const tImgs: Array<string> = pValue.split(',');
                for (i = 0; i < this.MyCheckBoxes.length; i++) {
                    if (i >= tImgs.length)
                        this.MyCheckBoxes[i].SetProperty("CheckImage", null);
                    else
                        this.MyCheckBoxes[i].SetProperty("CheckImage", tImgs[i]);
                }
            } else if (pName === "IsOverlay") {
                cdeNMI.SetZIndex(this.MyDIV, cde.CBool(pValue) ? 1300 : 0);
                cdeNMI.SetZIndex(this.tSendButton.GetElement(), cde.CBool(pValue) ? 1300 : 0);
                for (i = 0; i < this.MyCheckBoxes.length; i++) {
                    this.MyCheckBoxes[i].SetProperty("IsOverlay", pValue);
                }
            } else if (pName === "Disabled") {
                if ((!this.MyFieldInfo || (this.MyFieldInfo.Flags & 2) === 0))
                    pValue = true;
                this.EnableDisable(cde.CBool(pValue));
            } else if (pName === "FontSize") {
                for (let i = 0; i < this.BitCount; i++) {
                    if (this.MyLabels && this.MyLabels[i])
                        this.MyLabels[i].SetProperty("FontSize", pValue);
                }
            } else if (pName === "Options" && pValue) {
                const taTitle: string = pValue.split(';');
                for (i = cde.CInt(this.MyFieldInfo["Bits"]) - 1; i >= 0; i--) {
                    let tTitle: string = (1 << i).toString();
                    if (taTitle && taTitle.length > i) tTitle = taTitle[i];
                    this.MyCheckBoxes[i].SetProperty("Title", tTitle);
                }
            }
            super.SetProperty(pName, pValue);
        }

        PostCreate(pTE: ctrlTileEntry) {
            if (this.MyFieldInfo["IsInTable"] === true) {
                this.SetProperty("IsOverlay", true);
            }
        }

        GetCheckValue(pName: string): number {
            let tNewValue = 0;
            for (let i = this.BitCount - 1; i >= 0; i--) {
                if (cde.CBool(this.MyCheckBoxes[i].GetProperty("IsChecked")))
                    tNewValue += (1 << i);
            }
            this.SetProperty(pName, tNewValue);
            return tNewValue;
        }

        EnableDisable(IsDisabled: boolean) {
            if (this.tSendButton)
                this.tSendButton.SetProperty("Disabled", IsDisabled);
            for (let i = 0; i < this.MyCheckBoxes.length; i++)
                this.MyCheckBoxes[i].SetProperty("Disabled", IsDisabled);
        }
    }


    /**
* Creates a button that can be pushed to the right side and reveals more buttons underneath
*
* (4.1 Ready!)
*/
    export class ctrlRevealButton extends TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        divPin: HTMLDivElement = null;
        mInnerDiv: HTMLDivElement = null;
        mImgControl: INMIControl = null;
        mMoveDiv: HTMLDivElement = null;
        mlastX = 0;
        mNoFire = false;
        mInsideControls: Array<INMIControl> = null;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.RevealButton;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.divPin = document.createElement("div");
            this.divPin.style.position = "relative";
            this.divPin.style.cssFloat = "left";
            this.PreventDefault = true;
            this.SetElement(this.divPin, true);
            this.SetProperty("IsOpen", false);

            return true;
        }

        public SetProperty(pName: string, pValue) {
            if (pName === "ClassName") {
                this.divPin.className = pValue;
                return;
            } else if (pName === "TabIndex") {
                pValue = cde.CInt(pValue);
                this.SetTabIndex(pValue);
            } else if (pName === "Image") {
                if (pValue) {
                    const t = this;
                    t.mImgControl = pValue;
                    t.GetElement().appendChild(pValue.GetElement());
                    t.mImgControl.SetProperty("Parent", t);
                    //t.mImgControl.RegisterEvent("OnClick", clickEvt);
                    t.mImgControl.GetElement().style.cssFloat = "right";
                    t.mImgControl.HookEvents(false);
                    t.mImgControl.RegisterEvent("PointerUp", (pControl: INMIControl, evt: Event, pPointer: ThePointer) => {
                        t.SetProperty("LastX", -1);
                        const tParent: ctrlRevealButton = pControl.GetProperty("Parent") as ctrlRevealButton;
                        if (!tParent.mNoFire && pPointer.PathLength() < cdeNMI.MyNMISettings.DeadPathLength)
                            pControl.FireEvent(true, "OnClick", evt);
                    });
                    if (this.GetProperty("InsideControls") > 0)
                        this.InitInsides();
                }
            } else if (pName === "ControlArray") {
                if (pValue && pValue.length > 0) {
                    const t = this;
                    t.mInsideControls = pValue;
                    t.mMoveDiv = document.createElement("div");
                    t.mMoveDiv.style.width = "0px";
                    t.mMoveDiv.style.height = cdeNMI.GetSizeFromTile(1) + "px";
                    t.mMoveDiv.style.cssFloat = "left";
                    t.mMoveDiv.style.overflow = "hidden";
                    t.mMoveDiv.id = t.GetProperty("ID");
                    t.divPin.appendChild(t.mMoveDiv);
                    t.mInnerDiv = document.createElement("div");
                    t.mInnerDiv.style.height = cdeNMI.GetSizeFromTile(1) + "px";
                    t.mInnerDiv.style.display = "none";
                    t.mMoveDiv.appendChild(t.mInnerDiv);
                    t.SetProperty("InsideControls", pValue.length);
                    for (let i = 0; i < pValue.length; i++) {
                        t.SetProperty("InsideControl" + i, pValue);
                        t.mInnerDiv.appendChild(pValue[i].GetElement());
                        pValue[i].GetElement().style.verticalAlign = "middle";
                        pValue[i].GetElement().style.display = "table-cell";
                        pValue[i].GetElement().tabIndex = -1;
                    }
                    t.mInnerDiv.style.width = (cdeNMI.GetSizeFromTile(pValue.length) + 1) + "px";
                    t.InitInsides();
                    this.SetTabIndex(-1);
                }
            }
            super.SetProperty(pName, pValue);
        }

        SetTabIndex(startIndex: number) {
            if (!this.mInsideControls) return;
            for (let i = 0; i < this.mInsideControls.length; i++) {
                if (startIndex < 0)
                    this.mInsideControls[i].GetElement().tabIndex = -1;
                else
                    this.mInsideControls[i].GetElement().tabIndex = startIndex++;
            }
        }

        InitInsides() {
            if (this.GetProperty("InsideControls") > 0 && this.mImgControl) {
                this.mImgControl.RegisterEvent("PointerDown", (pControl: INMIControl, evt: Event, pPointer: ThePointer) => {
                    this.SetProperty("LastX", pPointer.AdjPosition.x);
                    const tParent: ctrlRevealButton = pControl.GetProperty("Parent") as ctrlRevealButton;
                    tParent.mNoFire = false;
                });
                this.mImgControl.RegisterEvent("PointerMove", (pControl: INMIControl, evt: Event, pPointer: ThePointer) => {
                    const tParent: ctrlRevealButton = pControl.GetProperty("Parent") as ctrlRevealButton;
                    //var div;      //V4.107: Move to Velocity
                    if (pPointer.Shift.x > 2 && tParent.GetProperty("IsOpen") !== true) {
                        tParent.SetProperty("IsOpen", true);
                        tParent.SetTabIndex(cde.CInt(tParent.GetProperty("TabIndex")) + 1);
                        //div = $("#" + tParent.GetProperty("ID"));
                        tParent.mInnerDiv.style.display = 'table';
                        tParent.mInnerDiv.style.width = cdeNMI.GetSizeFromTile(tParent.GetProperty("InsideControls")) + 2 + 'px';
                        tParent.mMoveDiv.style.width = cdeNMI.GetSizeFromTile(tParent.GetProperty("InsideControls")) + 2 + 'px';
                        //div.animate({ width: cdeNMI.GetSizeFromTile(this.GetProperty("InsideControls")) + 2 + 'px' }, 100, "easeOutBack", () => {
                        //});
                    } else if (pPointer.Shift.x < -2 && tParent.GetProperty("IsOpen") === true) {
                        tParent.SetProperty("IsOpen", false);
                        tParent.SetTabIndex(-1);
                        //div = $("#" + tParent.GetProperty("ID"));
                        //div.animate({ width: '0px' }, 100, "easeOutBack", () => {
                        tParent.mMoveDiv.style.width = "0px";
                        tParent.mInnerDiv.style.width = "0px";
                        tParent.mInnerDiv.style.display = 'none';
                        //});
                    }
                });
            }
            return true;
        }
    }

    export class ctrlImageSlider2 extends cdeNMI.TheNMIBaseControl {
        constructor() {
            super(null, null);
        }

        myControlContainer: INMIControl = null;
        myPropertyBag: string[] = null;
        myGroup: cdeNMI.INMIControl;
        myBar: cdeNMI.ctrlBarChart;
        myImage: cdeNMI.ctrlZoomImage;

        public SetProperty(pName: string, pValue) {
            super.SetProperty(pName, pValue);
            if (pName === "iValue") {
                this.myBar.SetProperty("iValue", pValue);
            }
        }

        public InitControl(pTargetElem: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            super.InitControl(pTargetElem, pTRF, pPropertyBag, pScreenID);
            if (pPropertyBag)
                this.myPropertyBag = pPropertyBag;
            else {
                if (pTRF && pTRF.FldInfo && pTRF.FldInfo.PropertyBag)
                    this.myPropertyBag = pTRF.FldInfo.PropertyBag;
            }
            this.myControlContainer = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(pTargetElem);
            this.myControlContainer.SetInitialSize(0);
            //SIZING: Needs to be the same on all SF Controls
            let tW = cde.CInt(this.MyParentCtrl.GetProperty("ControlTW"));
            if (this.GetSetting("TileWidth"))
                tW = cde.CInt(this.GetSetting("TileWidth"));

            let tH = cde.CInt(this.MyParentCtrl.GetProperty("ControlTH"));
            if (this.GetSetting("TileHeight"))
                tH = cde.CInt(this.GetSetting("TileHeight"));
            ////////////////////////////// To here
            this.SetElement(this.myControlContainer.GetElement(), true, this.myControlContainer.GetElement());

            this.AddMyControls(tW, tH, pTRF);

            cde.MyBaseAssets.RegisterEvent("ThemeSwitched", () => {
                this.SetImg();
            });
            this.SetImg();

            return true;
        }

        SetImg() {
            let bWasSet = false;
            if (cde.MyBaseAssets.MyServiceHostInfo.IsLiteTheme) {
                if (this.GetProperty("LiteSource")) {
                    this.myImage.SetProperty("Source", this.GetProperty("LiteSource"));
                    bWasSet = true;
                }
            } else {
                if (this.GetProperty("DarkSource")) {
                    this.myImage.SetProperty("Source", this.GetProperty("DarkSource"));
                    bWasSet = true;
                }
            }
            if (!bWasSet && this.GetProperty("Source")) {
                this.myImage.SetProperty("Source", this.GetProperty("Source"));
            }
        }


        AddMyControls(tWidth: number, tHeight: number, pTRF: cdeNMI.TheTRF) {
            this.myGroup = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(this.myControlContainer, { TRF: pTRF });
            this.myGroup.SetProperty("ClassName", "cIBGroup")
            this.myImage = cdeNMI.ctrlZoomImage.Create(this.myGroup);
            this.myImage.SetProperty("ControlTW", tWidth);
            this.myImage.SetProperty("ControlTH", tHeight);
            this.myImage.SetProperty("Z-Index", 50);
            this.myImage.SetProperty("IsAbsolute", true);
            this.myImage.SetProperty("Style", "pointer-events: none");
            const tImg = this.GetSetting("Source");
            if (tImg)
                this.myImage.SetProperty("Source", tImg);
            this.myBar = cdeNMI.ctrlBarChart.Create(this.myGroup, pTRF);
            this.myBar.SetProperty("ControlTW", tWidth);
            this.myBar.SetProperty("ControlTH", tHeight);
            this.myBar.SetProperty("IsAbsolute", true);
            this.myBar.SetProperty("iValue", this.GetSetting("Value"));
            cdeNMI.TheNMIBaseControl.SetPropertiesFromBag(this.myBar, this.myPropertyBag);

            this.myBar.RegisterEvent("OnValueChanged", (pBar, evt, pVal) => {
                this.SetProperty("Value", pVal[1]);
            });
        }

        ApplySkin() {
            //overrided if necessary
        }
    }

    export class ctrlToggleButton2 extends TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        static CreateOLD(pTarget: INMIControl, pScreenID: string, pTRF: TheTRF, IsChecked: boolean, pTitle?: string, pIsOverLay?: boolean, pClassName?: string): ctrlCheckBox {
            const tTile: ctrlCheckBox = new ctrlCheckBox(pTRF);
            tTile.InitControl(pTarget, pTRF, null, pScreenID);
            if (pClassName)
                tTile.SetProperty("ClassName", pClassName);
            tTile.SetProperty("iValue", IsChecked);
            if (cde.CBool(pIsOverLay))
                tTile.SetProperty("IsOverlay", pIsOverLay);
            if (pTitle)
                tTile.SetProperty("Title", pTitle);
            return tTile;
        }

        MyCheckBox: HTMLDivElement = null;
        IsCustomCheck = false;
        MyLabel: HTMLLabelElement = null;
        MyToggleSwitch: HTMLLabelElement = null;
        MyCheckBoxSwitch: HTMLInputElement = null;
        InnerToggleDiv: HTMLDivElement = null;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.SingleCheck;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.MyCheckBox = document.createElement("div");
            this.MyCheckBox.className = "cdeToggleSwitch";
            this.MyCheckBox.style.height = (cdeNMI.GetSizeFromTile(1)) + "px";
            this.MyCheckBox.style.width = (cdeNMI.GetSizeFromTile(1)) + "px";

            this.MyLabel = document.createElement("label");
            this.MyLabel.className = "cdeSwitchLabel";
            this.MyLabel.style.maxWidth = (cdeNMI.GetSizeFromTile(1)) + "px";
            const tL = this.GetSetting("Label");
            this.MyLabel.innerHTML = tL ? tL : (cde.CBool(this.GetSetting("IsInTable")) === true ? "" : "&nbsp;");

            this.MyToggleSwitch = document.createElement("label");
            this.MyToggleSwitch.className = "cdeSwitch";

            this.MyCheckBoxSwitch = document.createElement("input");
            this.MyCheckBoxSwitch.type = "checkbox";
            this.MyCheckBoxSwitch.className = "cdeCheckboxInput";

            this.MyToggleSwitch.appendChild(this.MyCheckBoxSwitch);
            this.MyCheckBox.appendChild(this.MyLabel);
            this.MyCheckBox.appendChild(this.MyToggleSwitch);

            this.InnerToggleDiv = document.createElement("div");
            this.InnerToggleDiv.className = "cdeCheckboxInnerDiv";

            this.MyToggleSwitch.appendChild(this.InnerToggleDiv);

            const tHeader = this.GetSetting("Title");
            if (tHeader) {
                this.SetProperty("Title", tHeader);
            }

            this.IsCustomCheck = true;
            this.SetElement(this.MyCheckBox, true);
            this.SetProperty("Disabled", (!this.MyFieldInfo || (this.MyFieldInfo.Flags & 2) === 0));

            if (cde.CBool(this.GetSetting("DefaultValue"))) {
                this.SetProperty("iValue", true);
            }
            else {
                this.SetProperty("iValue", false);
            }

            this.EnableDisable(cde.CBool(this.GetProperty("Disabled")));
            return true;
        }



        public SetProperty(pName: string, pValue) {
            if (pName === "Value" || pName === "iValue") {
                if (cde.CBool(this.GetProperty("IsChecked")) !== cde.CBool(pValue))
                    this.IsDirty = true;
                if (cde.CBool(pValue)) {
                    this.SetProperty("IsChecked", true);
                    this.MyCheckBox.classList.add("toggleChecked");
                }
                else {
                    this.SetProperty("IsChecked", false);
                    this.MyCheckBox.classList.remove("toggleChecked");
                }
            } else if (pName === "Label") {
                this.MyLabel.textContent = pValue;
            } else if (pName === "HideLabel") {
                this.MyLabel.style.display = "none";
            } else if (pName === "TileHeight" || pValue === "ControlTH") {
                let tfy = cde.CInt(this.GetProperty("TileFactorY"));
                if (tfy === 0) tfy = 1;
                this.MyCheckBox.style.height = (cdeNMI.GetSizeFromTile(cde.CInt(pValue)) / tfy) + "px";
            } else if (pName === "TileFactorY") {
                let tfy = cde.CInt(pValue);
                if (tfy < 1) tfy = 1;
                let th = cde.CInt(this.GetProperty("TileHeight"));
                if (th === 0) th = 1;
                this.MyCheckBox.style.height = (cdeNMI.GetSizeFromTile(th) / tfy) + "px";
                if (tfy > 1)
                    this.MyLabel.style.display = "none";
            }
            super.SetProperty(pName, pValue);
            //if (this.MyCheckBox) {
            //    var t = this.MyCheckBox.style.height;
            //}
        }



        PostCreate(pTE: INMITileEntry) {
            if (!cde.CBool(pTE.GetProperty("IsInTable"))) {
                this.SetProperty("IsHitTestDisabled", true);
                this.SetProperty("NoClick", true);
            }
            if ((this.MyFieldInfo.Flags & 2) !== 0)
                pTE.MyTEContainer.SetProperty("OnClick", (sender: INMIControl, evt: Event) => {
                    if (!(evt as any).AYSFired && this.GetProperty("AreYouSure")) {
                        if (cdeNMI.MyPopUp)
                            cdeNMI.MyPopUp.Show(this.GetProperty("AreYouSure"),
                                false,
                                null,
                                1,
                                () => {
                                    this.ToggleCheck(null);
                                });
                    } else
                        this.ToggleCheck(evt);
                });
            else {
                this.SetProperty("Disabled", true);
            }
        }


        EnableDisable(IsDisabled: boolean) {
            this.UnregisterEvent("PointerUp");
            if (!IsDisabled) {
                this.RegisterEvent("PointerUp", (sender, evt) => {
                    if (this.GetProperty("NoClick") !== true) {
                        if (this.GetProperty("AreYouSure")) {
                            if (cdeNMI.MyPopUp)
                                cdeNMI.MyPopUp.Show(this.GetProperty("AreYouSure"), false, null, 1, () => {
                                    this.ToggleCheck(null);
                                });
                        }
                        else
                            this.ToggleCheck(evt);
                    }
                });
            }
        }

        // Sets IsChecked properties and transforms UX toggle based on state
        ToggleCheck(pEvent: Event) {
            if (!cde.CBool(this.GetProperty("IsChecked"))) {
                this.SetProperty("IsChecked", true);
                this.MyCheckBox.classList.add("toggleChecked");
            }
            else {
                this.SetProperty("IsChecked", false);
                this.MyCheckBox.classList.remove("toggleChecked");
            }
            if (this.GetProperty("NoClick") === true || this.GetProperty("UpdateTable") === true) {
                this.SetProperty("Value", cde.CBool(this.GetProperty("IsChecked")));
            }
            else {
                this.SetProperty("iValue", cde.CBool(this.GetProperty("IsChecked")));
            }
        }

        //backward compat
        static Create(pTarget: INMIControl, pScreenID: string, pTRF: TheTRF, IsChecked: boolean, pTitle?: string, pIsOverLay?: boolean, pClassName?: string): ctrlCheckBox {
            const tTile: ctrlCheckBox = new ctrlCheckBox(pTRF);
            tTile.InitControl(pTarget, pTRF, null, pScreenID);
            if (pClassName)
                tTile.SetProperty("ClassName", pClassName);
            tTile.SetProperty("iValue", IsChecked);
            if (cde.CBool(pIsOverLay))
                tTile.SetProperty("IsOverlay", pIsOverLay);
            if (pTitle)
                tTile.SetProperty("Title", pTitle);
            return tTile;
        }
    }
}