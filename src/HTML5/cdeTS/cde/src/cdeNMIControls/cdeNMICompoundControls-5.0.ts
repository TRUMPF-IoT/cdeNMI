// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {


    export class ctrlStatusLight extends cdeNMI.TheNMIBaseControl {
        constructor() {
            super(null, null);
        }

        ///elements
        statusLightHolder: cdeNMI.ctrlTileGroup;
        statusLightTitle: cdeNMI.ctrlSmartLabel;
        bIsOn = false;
        Blinker;

        mShape: cdeNMI.ctrlShape;
        myShapeDraw: cdeNMI.TheDrawingObject[];

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.statusLightHolder = new cdeNMI.ctrlTileGroup(pTRF);
            this.statusLightHolder.InitControl(pTargetControl);
            this.statusLightHolder.SetProperty("ClassName", "cdeFlexRow cdeFlexCenter");
            this.statusLightHolder.MyRootElement.style.width = "inherit";
            this.statusLightHolder.MyRootElement.style.height = "inherit";

            let tWid = cde.CInt(this.GetSetting("TileWidth"));
            let tHei = cde.CInt(this.GetSetting("TileHeight"));
            let tIsInTable = false;
            if (pTRF && pTRF.FldInfo) {
                if (pTRF.FldInfo["ControlTW"]) {
                    tWid = pTRF.FldInfo["ControlTW"];
                    this.statusLightHolder.SetProperty("TileWidth", tWid);
                }
                if (pTRF.FldInfo["ControlTH"]) {
                    tHei = pTRF.FldInfo["ControlTH"];
                    this.statusLightHolder.SetProperty("TileHeight", tHei);
                }
                tIsInTable = cde.CBool(pTRF.FldInfo["IsInTable"]);
            }
            if (!tIsInTable) {
                this.statusLightTitle = new cdeNMI.ctrlSmartLabel();
                this.statusLightTitle.InitControl(this.statusLightHolder);
                this.statusLightTitle.SetProperty("Visibility", false);
            }

            this.mShape = new cdeNMI.ctrlShape();
            this.mShape.MyFieldInfo = new TheFieldInfo(cdeControlType.StatusLight, tWid, null, 0);
            this.mShape.SetProperty("AutoAdjust", true);
            this.mShape.InitControl(this.statusLightHolder);
            if (tWid)
                this.mShape.SetProperty("ControlTW", tWid);
            if (tHei)
                this.mShape.SetProperty("ControlTH", tHei);
            let tFX = cde.CInt(this.GetSetting("TileFactorX"));
            if (tFX > 1)
                this.mShape.SetProperty("TileFactorX", tFX);
            tFX = cde.CInt(this.GetSetting("TileFactorY"));
            if (tFX > 1) {
                this.mShape.SetProperty("TileFactorY", tFX);
            }

            this.SetProperty("iValue", 0);

            this.SetElement(this.statusLightHolder.GetElement());
            if (this.MyFormID && cdeNMI.MyScreenManager) {
                const tScreen: INMIScreen = cdeNMI.MyScreenManager.GetScreenByID(this.MyFormID);
                if (tScreen)
                    tScreen.RegisterEvent("OnLoaded", () => this.ApplySkin());
            }
            return true;
        }

        public SetProperty(pName: string, pValue) {
            let bIsDirty = false;

            if ((pName === "Value" || pName === "iValue" || pName === "LightColor")) {
                bIsDirty = true;
            } else if (pName === "SubTitle" && this.statusLightTitle) {
                this.statusLightTitle.SetProperty("Text", pValue);
                this.statusLightTitle.SetProperty("Visibility", true);
            } else if (pName === "Foreground" && this.statusLightTitle) {
                this.statusLightTitle.SetProperty(pName, pValue);
            } else if (pName === "IsBlinking" && cde.CInt(pValue) > 0) {
                if (!this.Blinker) {
                    this.Blinker = setInterval(() => {
                        if (cde.CInt(this.GetProperty("IsBlinking")) === 0) {
                            clearInterval(this.Blinker);
                            this.Blinker = null;
                            return;
                        }
                        if (this.bIsOn)
                            this.SetProperty("Opacity", "0.1");
                        else
                            this.SetProperty("Opacity", "1");
                        this.bIsOn = !this.bIsOn;
                    }, cde.CInt(pValue));
                }
            } else if ((pName === "ControlTW" || pName === "ControlTH" || pName === "TileWidth" || pName === "TileHeight" || pName === "TileFactorX" || pName === "TileFactorY") && this.mShape && this.mShape) {
                pValue = cde.CInt(pValue);
                this.mShape.SetProperty(pName, pValue);
                bIsDirty = true;
            }
            super.SetProperty(pName, pValue);

            if (bIsDirty && this.mShape && this.mShape.mCanvas) {
                const tL = this.mShape.mCanvas.MyWidth;
                const tH = this.mShape.mCanvas.MyHeight;
                if (tL === 0 || tH === 0) return;
                let tW = tL;
                if (tH < tL) tW = tH;
                let tM = 5;
                if (this.GetProperty("SubTitle"))
                    tM = 20;
                const tFillColor: string = this.GetProperty("LightColor");
                if (tFillColor) {
                    this.myShapeDraw = [{ Type: 4, Fill: tFillColor, Width: (tW / 2) - tM, Top: tH / 2, Left: tL / 2, Visibility: true, IsTemp: true }] as cdeNMI.TheDrawingObject[];
                } else {
                    switch (cde.CInt(this.GetProperty("Value")) % 8) {
                        default:
                            this.myShapeDraw = [{
                                Type: 4, Fill: "gradientc(#808080, #FFFFFF)", Width: (tW / 2) - tM, Top: tH / 2, Left: tL / 2, Visibility: true, IsTemp: true
                            }] as cdeNMI.TheDrawingObject[];
                            break;
                        case 1:
                            this.myShapeDraw = [{ Type: 4, Fill: "gradientc(#008000, #00FF00)", Width: (tW / 2) - tM, Top: tH / 2, Left: tL / 2, Visibility: true, IsTemp: true }] as cdeNMI.TheDrawingObject[];
                            break;
                        case 2:
                            this.myShapeDraw = [{ Type: 4, Fill: "gradientc(#808000, #FFFF00)", Width: (tW / 2) - tM, Top: tH / 2, Left: tL / 2, Visibility: true, IsTemp: true }] as cdeNMI.TheDrawingObject[];
                            break;
                        case 3:
                            this.myShapeDraw = [{ Type: 4, Fill: "gradientc(#800000, #FF0000)", Width: (tW / 2) - tM, Top: tH / 2, Left: tL / 2, Visibility: true, IsTemp: true }] as cdeNMI.TheDrawingObject[];
                            break;
                        case 4:
                            this.myShapeDraw = [{ Type: 4, Fill: "gradientc(#000080, #0000FF)", Width: (tW / 2) - tM, Top: tH / 2, Left: tL / 2, Visibility: true, IsTemp: true }] as cdeNMI.TheDrawingObject[];
                            break;
                        case 5:
                            this.myShapeDraw = [{ Type: 4, Fill: "gradientc(#000000, #6f4200)", Width: (tW / 2) - tM, Top: tH / 2, Left: tL / 2, Visibility: true, IsTemp: true }] as cdeNMI.TheDrawingObject[];
                            break;
                        case 6:
                            this.myShapeDraw = [{ Type: 4, Fill: "gradientc(#400080, #8000FF)", Width: (tW / 2) - tM, Top: tH / 2, Left: tL / 2, Visibility: true, IsTemp: true }] as cdeNMI.TheDrawingObject[];
                            break;
                        case 7:
                            this.myShapeDraw = [{ Type: 4, Fill: "gradientc(#000000, #808080)", Width: (tW / 2) - tM, Top: tH / 2, Left: tL / 2, Visibility: true, IsTemp: true }] as cdeNMI.TheDrawingObject[];
                            break;
                    }
                }
                if (this.mShape) {
                    this.mShape.SetProperty("DataContext", this.myShapeDraw);
                }
            }
        }

        OnLoad() {
            this.ApplySkin();
        }

        ApplySkin() {
            this.mShape.ApplySkin();
            this.SetProperty("iValue", this.GetProperty("Value"));
        }
    }

    /**
* Creates the standard About Button
V3.2 Ready
*/
    export class ctrlAboutButton extends cdeNMI.TheNMIBaseControl {
        constructor() {
            super(null, null);
        }

        aboutButtonContainer: cdeNMI.ctrlTileGroup;
        topName: cdeNMI.ctrlTileGroup;
        pluginName: cdeNMI.INMIControl;
        serviceName: cdeNMI.INMIControl;
        middleBox: cdeNMI.ctrlTileGroup;
        leftSquare: cdeNMI.ctrlTileGroup;
        mdlSquare: cdeNMI.ctrlTileGroup;
        mdlText: cdeNMI.ctrlSmartLabel;
        rightSquare: cdeNMI.ctrlTileGroup;
        copyrightText: cdeNMI.ctrlSmartLabel;
        versionText: cdeNMI.INMIControl;
        rightBottom: cdeNMI.ctrlTileGroup;
        iconImage: cdeNMI.ctrlZoomImage;
        iconText: cdeNMI.ctrlSmartLabel;
        currentStatusLabel: cdeNMI.ctrlSmartLabel;
        statusShape: ctrlStatusLight;
        adTile: cdeNMI.ctrlTileGroup;
        advertise: cdeNMI.ctrlSmartLabel;
        notice: cdeNMI.ctrlSmartLabel;
        collaBox: cdeNMI.ctrlCollapsibleGroup;
        leftTopGroup: cdeNMI.ctrlTileGroup;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.SetProperty("NoTE", true);
            this.SetProperty("MinTileHeight", -1);
            this.SetProperty("MinTileWidth", 6);
            //container
            this.aboutButtonContainer = new cdeNMI.ctrlTileGroup(pTRF);

            this.aboutButtonContainer.InitControl(pTargetControl);
            this.aboutButtonContainer.SetProperty("TileWidth", 6);
            this.aboutButtonContainer.SetProperty("Background", "rgba(128,128,128,.1)");
            this.aboutButtonContainer.SetProperty("ClassName", "cdeFlexCol cdeAboutBox");
            //top line
            this.topName = new cdeNMI.ctrlTileGroup();
            this.topName.InitControl(this.aboutButtonContainer);
            this.topName.SetProperty("TileWidth", 6);
            this.topName.SetProperty("TileHeight", 2);
            this.topName.SetProperty("ClassName", "cdeFlexRow cdeFlexCenter");
            this.topName.HookEvents(true);
            this.topName.RegisterEvent("PointerUp", () => {
                if (this.GetProperty("TargetLink") && cdeNMI.MyScreenManager) {
                    cdeNMI.MyScreenManager.TransitToScreen(this.GetProperty("TargetLink"));
                }
            });
            this.statusShape = new ctrlStatusLight();
            this.statusShape.InitControl(this.topName);
            this.statusShape.SetProperty("TileWidth", 2);
            this.statusShape.SetProperty("TileHeight", 2);

            this.leftTopGroup = new cdeNMI.ctrlTileGroup();
            this.leftTopGroup.InitControl(this.topName);
            this.leftTopGroup.SetProperty("TileWidth", 4);
            this.leftTopGroup.SetProperty("ClassName", "cdeFlexCol");
            this.pluginName = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.leftTopGroup, { ScreenID: pScreenID, PreInitBag: ["Element=div"] });
            //cdeNMI.ctrlSmartLabel.Create(this.leftTopGroup, pScreenID, null, null, "div");
            this.pluginName.SetProperty("TileWidth", 4);
            this.pluginName.SetProperty("TileHeight", 1);
            this.pluginName.SetProperty("Style", "font-size:30px;");
            this.serviceName = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.leftTopGroup, { ScreenID: pScreenID, PreInitBag: ["Element=div"] });
            //cdeNMI.ctrlSmartLabel.Create(this.leftTopGroup, pScreenID, null, null, "div");
            this.serviceName.SetProperty("TileWidth", 4);
            this.serviceName.SetProperty("TileHeight", 1);
            this.serviceName.SetProperty("Style", "overflow-y:auto;overflow-x:hidden;font-size:16px;");

            //middle
            this.collaBox = new cdeNMI.ctrlCollapsibleGroup();
            const tF: TheFieldInfo = new TheFieldInfo(cdeControlType.CollapsibleGroup, 0, null, 2);
            tF.PropertyBag = ["IsSmall=true"];
            this.collaBox.InitControl(this.aboutButtonContainer, new TheTRF("NONE", 0, tF));
            this.collaBox.SetProperty("TileWidth", 6);
            this.collaBox.SetProperty("Title", "About...");
            this.collaBox.SetProperty("IsSmall", true);
            this.collaBox.SetProperty("DoClose", true);

            this.middleBox = new cdeNMI.ctrlTileGroup();
            this.middleBox.InitControl(this.collaBox);
            this.middleBox.SetProperty("TileWidth", 6);
            this.middleBox.SetProperty("TileHeight", 1);

            this.middleBox.SetProperty("ClassName", "cdeFlexRow");

            this.mdlSquare = new cdeNMI.ctrlTileGroup();
            this.mdlSquare.InitControl(this.middleBox);
            this.mdlSquare.SetProperty("TileWidth", 5);
            this.mdlSquare.SetProperty("TileHeight", 1);
            this.mdlSquare.SetProperty("ClassName", "cdeFlexRow cdeFlexCenter");
            this.mdlText = new cdeNMI.ctrlSmartLabel();
            this.mdlText.InitControl(this.mdlSquare);

            this.leftSquare = new cdeNMI.ctrlTileGroup();
            this.leftSquare.InitControl(this.middleBox);
            this.leftSquare.SetProperty("TileWidth", 1);
            this.leftSquare.SetProperty("TileHeight", 1);
            this.leftSquare.SetProperty("ClassName", "cdeFlexRow cdeFlexCenter");
            this.iconImage = new cdeNMI.ctrlZoomImage();
            this.iconImage.InitControl(this.leftSquare);
            this.iconImage.SetProperty("TileWidth", 1);
            this.iconImage.SetProperty("TileHeight", 1);
            this.iconImage.SetProperty("Visibility", false);
            this.iconText = new cdeNMI.ctrlSmartLabel();
            this.iconText.InitControl(this.leftSquare);
            this.iconText.SetProperty("TileWidth", 1);
            this.iconText.SetProperty("Visibility", false);

            //Next Line
            this.rightSquare = new cdeNMI.ctrlTileGroup();
            this.rightSquare.InitControl(this.collaBox);
            this.rightSquare.SetProperty("TileWidth", 6);
            this.rightSquare.SetProperty("TileHeight", 1);
            this.rightSquare.SetProperty("ClassName", "cdeFlexRow cdeFlexCenter");
            this.rightSquare.SetProperty("Style", "-webkit-align-content: flex-start; -ms-flex-line-pack: start; align-content:flex-start;")
            this.versionText = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.rightSquare, { ScreenID: pScreenID, TRF: cdeNMI.TheTRF.SetFlagsOnly(256), PreInitBag: ["Element=div"] });
            //cdeNMI.ctrlSmartLabel.Create(this.rightSquare, pScreenID, null, null, "div");
            this.versionText.SetProperty("TileWidth", 3);
            this.copyrightText = new cdeNMI.ctrlSmartLabel();
            this.copyrightText.InitControl(this.rightSquare);
            this.copyrightText.SetProperty("TileWidth", 3);
            //bottom
            this.adTile = new cdeNMI.ctrlTileGroup();
            this.adTile.InitControl(this.collaBox);
            this.adTile.SetProperty("TileWidth", 6);
            this.adTile.SetProperty("TileHeight", 1);
            this.adTile.SetProperty("ClassName", "cdeFlexRow cdeFlexCenter");
            this.advertise = new cdeNMI.ctrlSmartLabel();
            this.advertise.InitControl(this.adTile);

            this.SetElement(this.aboutButtonContainer.GetElement());
            if (this.MyFormID && cdeNMI.MyScreenManager) {
                const tScreen: INMIScreen = cdeNMI.MyScreenManager.GetScreenByID(this.MyFormID);
                if (tScreen)
                    tScreen.RegisterEvent("OnLoaded", () => this.ApplySkin());
            }
            return true;
        }

        public SetProperty(pName: string, pValue) {
            super.SetProperty(pName, pValue);

            if (!this.aboutButtonContainer) return;
            //setting properties
            //Title
            if (pName === "Title") {
                this.pluginName.SetProperty("iValue", pValue);
            } else if (pName === "SubTitle") {
                this.serviceName.SetProperty("iValue", pValue);
            } else if (pName === "Background") {
                this.aboutButtonContainer.SetProperty(pName, pValue);
                if (pValue === "black") {
                    this.mdlText.SetProperty("Foreground", "white");
                    this.pluginName.SetProperty("Foreground", "white");
                    this.mdlText.SetProperty("Foreground", "white");
                    this.copyrightText.SetProperty("Foreground", "white");
                    this.versionText.SetProperty("Foreground", "white");
                    this.advertise.SetProperty("Foreground", "white");
                    this.statusShape.SetProperty("Foreground", "white");
                    this.iconText.SetProperty("Foreground", "white");
                }
            } else if (pName === "Foreground") {
                this.aboutButtonContainer.SetProperty(pName, pValue);
                this.mdlText.SetProperty("Foreground", pValue);
                this.pluginName.SetProperty("Foreground", pValue);
                this.mdlText.SetProperty("Foreground", pValue);
                this.copyrightText.SetProperty("Foreground", pValue);
                this.versionText.SetProperty("Foreground", pValue);
                this.advertise.SetProperty("Foreground", pValue);
                this.statusShape.SetProperty("Foreground", pValue);
                this.iconText.SetProperty("Foreground", pValue);
            } else if (pName === "Value" || pName === "iValue") {
                this.statusShape.SetProperty("iValue", pValue);
            }
            else if (pName === "Description") {
                this.mdlText.SetProperty("Text", pValue);
            } else if (pName === "Copyright") {
                this.copyrightText.SetProperty("Text", pValue + "<BR>" + this.GetProperty("Author"));
            } else if (pName === "Author") {
                this.copyrightText.SetProperty("Text", this.GetProperty("Copyright") + "<BR>" + pValue);
            } else if (pName === "Version" || pName === "NodeText") {
                this.versionText.SetProperty("Text", "Current Version: " + this.GetProperty("Version") + "</br><span style='font-size:10px'>" + this.GetProperty("NodeText") + "</span>");
            } else if (pName === "Icon") {
                this.iconImage.SetProperty("iValue", pValue);
                this.iconImage.SetProperty("Visibility", true);
            } else if (pName === "IconText") {
                this.iconText.SetProperty("Text", pValue);
                this.iconText.SetProperty("Visibility", true);
            } else if (pName === "AdText") {
                this.advertise.SetProperty("Text", "To learn more visit</br><a href=" + pValue + " target='_blank'>" + pValue + "</a>");
            } else if (pName === "StatusText") {
                this.statusShape.SetProperty("Title", pValue);
            } else if (pName === "LastMessage") {
                this.serviceName.SetProperty("Text", pValue);
            }
        }

        ApplySkin() {
            this.statusShape.ApplySkin();
        }
    }

    /**
* Creates a MuTLock (Multi-Touch Lock for Password Code)
*
* (3.2 Ready!)
*/
    export class ctrlMoTLock extends TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        divMoTLock: INMIControl = null;
        hControl: HTMLHeadElement = null;
        mMoTLockCode = "";
        mMoTLockDigits = "";
        mShowOverlay = false;
        mTouched = 0;
        mPassField: ctrlEditBox = null;
        k1: ctrlTileButton = null;
        k2: ctrlTileButton = null;
        k3: ctrlTileButton = null;
        k4: ctrlTileButton = null;
        k5: ctrlTileButton = null;
        k6: ctrlTileButton = null;
        k7: ctrlTileButton = null;
        k8: ctrlTileButton = null;
        k9: ctrlTileButton = null;
        k0: ctrlTileButton = null;
        kreset: ctrlTileButton = null;
        kenter: ctrlTileButton = null;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.MuTLock;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            const tHead = "Enter Pin";
            this.divMoTLock = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(pTargetControl, { TRF: pTRF }); //ctrlTileGroup.Create(pTargetControl, pTRF);
            this.divMoTLock.SetProperty("LabelClassName", "cdeMutLock");
            this.divMoTLock.SetProperty("Label", tHead);
            this.divMoTLock.GetElement().style.marginLeft = "0px";
            this.divMoTLock.GetElement().style.position = "fixed";
            this.divMoTLock.GetElement().style.zIndex = "50";
            this.divMoTLock.GetElement().style.backgroundColor = "black";
            this.divMoTLock.SetProperty("TileWidth", 3);
            this.divMoTLock.SetProperty("OnClick", () => {
                if (this.mPassField === null && this.MyTE !== null) {
                    if (this.MyTE.MyTEContainer.GetContainerElement().style.overflow === "initial")
                        this.MyTE.MyTEContainer.GetContainerElement().style.overflow = "hidden";
                    else
                        this.MyTE.MyTEContainer.GetContainerElement().style.overflow = "initial";
                }
            });

            this.k7 = cdeNMI.ctrlTileButton.Create(this.divMoTLock, null, "7", 1, 1);
            this.k7.PreventManipulation = true;
            this.k7.PreventDefault = true;
            this.k7.SetProperty("OnTileDown", () => this.SetDigit(7));
            this.k7.SetProperty("OnClick", (sender, evt) => this.CombiDone(evt));
            this.k7.SetProperty("ClassName", "cdeMutButton");
            this.k7.SetProperty("FontSize", 42);

            this.k8 = cdeNMI.ctrlTileButton.Create(this.divMoTLock, null, "8", 1, 1);
            this.k8.PreventManipulation = true;
            this.k8.PreventDefault = true;
            this.k8.SetProperty("OnTileDown", () => this.SetDigit(8));
            this.k8.SetProperty("OnClick", (sender, evt) => this.CombiDone(evt));
            this.k8.SetProperty("ClassName", "cdeMutButton");
            this.k8.SetProperty("FontSize", 42);

            this.k9 = cdeNMI.ctrlTileButton.Create(this.divMoTLock, null, "9", 1, 1);
            this.k9.PreventManipulation = true;
            this.k9.PreventDefault = true;
            this.k9.SetProperty("OnTileDown", () => this.SetDigit(9));
            this.k9.SetProperty("OnClick", (sender, evt) => this.CombiDone(evt));
            this.k9.SetProperty("ClassName", "cdeMutButton");
            this.k9.SetProperty("FontSize", 42);


            this.k4 = cdeNMI.ctrlTileButton.Create(this.divMoTLock, null, "4", 1, 1);
            this.k4.PreventManipulation = true;
            this.k4.PreventDefault = true;
            this.k4.SetProperty("OnTileDown", () => this.SetDigit(4));
            this.k4.SetProperty("OnClick", (sender, evt) => this.CombiDone(evt));
            this.k4.SetProperty("ClassName", "cdeMutButton");
            this.k4.SetProperty("FontSize", 42);

            this.k5 = cdeNMI.ctrlTileButton.Create(this.divMoTLock, null, "5", 1, 1);
            this.k5.PreventManipulation = true;
            this.k5.PreventDefault = true;
            this.k5.SetProperty("OnTileDown", () => this.SetDigit(5));
            this.k5.SetProperty("OnClick", (sender, evt) => this.CombiDone(evt));
            this.k5.SetProperty("ClassName", "cdeMutButton");
            this.k5.SetProperty("FontSize", 42);

            this.k6 = cdeNMI.ctrlTileButton.Create(this.divMoTLock, null, "6", 1, 1);
            this.k6.PreventManipulation = true;
            this.k6.PreventDefault = true;
            this.k6.SetProperty("OnTileDown", () => this.SetDigit(6));
            this.k6.SetProperty("OnClick", (sender, evt) => this.CombiDone(evt));
            this.k6.SetProperty("ClassName", "cdeMutButton");
            this.k6.SetProperty("FontSize", 42);

            this.k1 = cdeNMI.ctrlTileButton.Create(this.divMoTLock, null, "1", 1, 1);
            this.k1.PreventManipulation = true;
            this.k1.PreventDefault = true;
            this.k1.SetProperty("OnTileDown", () => this.SetDigit(1));
            this.k1.SetProperty("OnClick", (sender, evt) => this.CombiDone(evt));
            this.k1.SetProperty("ClassName", "cdeMutButton");
            this.k1.SetProperty("FontSize", 42);

            this.k2 = cdeNMI.ctrlTileButton.Create(this.divMoTLock, null, "2", 1, 1);
            this.k2.PreventManipulation = true;
            this.k2.PreventDefault = true;
            this.k2.SetProperty("OnTileDown", () => this.SetDigit(2));
            this.k2.SetProperty("OnClick", (sender, evt) => this.CombiDone(evt));
            this.k2.SetProperty("ClassName", "cdeMutButton");
            this.k2.SetProperty("FontSize", 42);

            this.k3 = cdeNMI.ctrlTileButton.Create(this.divMoTLock, null, "3", 1, 1);
            this.k3.PreventManipulation = true;
            this.k3.PreventDefault = true;
            this.k3.SetProperty("OnTileDown", () => this.SetDigit(3));
            this.k3.SetProperty("OnClick", (sender, evt) => this.CombiDone(evt));
            this.k3.SetProperty("ClassName", "cdeMutButton");
            this.k3.SetProperty("FontSize", 42);

            this.k0 = cdeNMI.ctrlTileButton.Create(this.divMoTLock, null, "0", 1, 1);
            this.k0.PreventManipulation = true;
            this.k0.PreventDefault = true;
            this.k0.SetProperty("OnTileDown", () => this.SetDigit(0));
            this.k0.SetProperty("OnClick", (sender, evt) => this.CombiDone(evt));
            this.k0.SetProperty("ClassName", "cdeMutButton");
            this.k0.SetProperty("FontSize", 42);

            this.kreset = cdeNMI.ctrlTileButton.Create(this.divMoTLock, null, "Reset", 2, 1);
            this.kreset.PreventManipulation = true;
            this.kreset.PreventDefault = true;
            this.kreset.SetProperty("ClassName", "cdeMutButton");
            this.kreset.SetProperty("OnClick", (sender, evt, tps) => {
                if (tps > 0) {
                    cdeNMI.StopPointerEvents(evt);
                    this.mMoTLockCode = "";
                    this.mTouched = 0;
                    this.mMoTLockDigits = "";

                    if (this.mPassField) {
                        if (!this.mShowOverlay)
                            this.mPassField.SetProperty("Value", this.mMoTLockCode);
                        else
                            this.mPassField.SetProperty("iValue", this.mMoTLockCode);
                    }
                    else
                        this.SetProperty("Value", this.mMoTLockCode);
                }
            });


            this.kenter = cdeNMI.ctrlTileButton.Create(this.divMoTLock, null, "Enter", 3, 1);
            this.kenter.PreventManipulation = true;
            this.kenter.PreventDefault = true;
            this.kenter.SetProperty("Visibility", false);
            this.kenter.SetProperty("ClassName", "cdeMutButton");
            this.kenter.SetProperty("OnClick", (sender, evt) => {
                if (this.mPassField) {
                    this.mPassField.IsDirty = true;
                    this.mPassField.FireEvent(false, "OnValueChanged", evt, this.mMoTLockCode);
                }
                else
                    this.SetProperty("Value", this.mMoTLockCode);
            });

            this.PreventManipulation = true;
            this.SetElement(this.divMoTLock.GetElement());

            return true;
        }

        public SetProperty(pName: string, pValue) {
            super.SetProperty(pName, pValue);
            if (pName === "PassField") {
                this.mPassField = pValue;
                this.divMoTLock.GetElement().style.position = "fixed";
            } else if (pName === "Background") {
                if (this.divMoTLock)
                    this.divMoTLock.GetElement().style.backgroundColor = pValue;
            } else if (pName === "IsOverlay") {
                this.mShowOverlay = cde.CBool(pValue);
                this.divMoTLock.GetElement().style.zIndex = (cde.CBool(this.mShowOverlay) ? 1300 : 0).toString();
                cdeNMI.SetZIndex(this.k7.GetElement(), cde.CBool(this.mShowOverlay) ? 1300 : 0);
                cdeNMI.SetZIndex(this.k8.GetElement(), cde.CBool(this.mShowOverlay) ? 1300 : 0);
                cdeNMI.SetZIndex(this.k9.GetElement(), cde.CBool(this.mShowOverlay) ? 1300 : 0);
                cdeNMI.SetZIndex(this.k4.GetElement(), cde.CBool(this.mShowOverlay) ? 1300 : 0);
                cdeNMI.SetZIndex(this.k5.GetElement(), cde.CBool(this.mShowOverlay) ? 1300 : 0);
                cdeNMI.SetZIndex(this.k6.GetElement(), cde.CBool(this.mShowOverlay) ? 1300 : 0);
                cdeNMI.SetZIndex(this.k1.GetElement(), cde.CBool(this.mShowOverlay) ? 1300 : 0);
                cdeNMI.SetZIndex(this.k2.GetElement(), cde.CBool(this.mShowOverlay) ? 1300 : 0);
                cdeNMI.SetZIndex(this.k3.GetElement(), cde.CBool(this.mShowOverlay) ? 1300 : 0);
                cdeNMI.SetZIndex(this.k0.GetElement(), cde.CBool(this.mShowOverlay) ? 1300 : 0);
                cdeNMI.SetZIndex(this.kreset.GetElement(), cde.CBool(this.mShowOverlay) ? 1300 : 0);
                this.kenter.SetProperty("Visibility", this.mShowOverlay);
                cdeNMI.SetZIndex(this.kenter.GetElement(), cde.CBool(this.mShowOverlay) ? 1300 : 0);
            }
        }

        public SetDigit(digit: number) {
            this.mTouched++;
            this.mMoTLockDigits += digit.toString();
        }

        public CombiDone(evt) {
            if (this.mTouched > 0) {
                this.mTouched = 0;
                if (this.mMoTLockCode.length > 0)
                    this.mMoTLockCode += ";";
                this.mMoTLockCode += this.mMoTLockDigits;
                this.mMoTLockDigits = "";
                cdeNMI.StopPointerEvents(evt);
                if (this.mPassField) {
                    if (!this.mShowOverlay)
                        this.mPassField.SetProperty("Value", this.mMoTLockCode);
                    else
                        this.mPassField.SetProperty("iValue", this.mMoTLockCode);
                }
            }
        }

        //backwards compat
        public static Create(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPassField?: cdeNMI.ctrlEditBox, pSize?: number, pShowOverlay?: boolean): ctrlMoTLock {
            const t: ctrlMoTLock = new ctrlMoTLock(pTRF);
            if (pPassField)
                t.SetProperty("PassField", pPassField);
            t.InitControl(pTargetControl, pTRF);
            if (cde.CBool(pShowOverlay))
                t.SetProperty("IsOverlay", pShowOverlay);
            if (pSize)
                t.SetProperty("TileWidth", pSize);

            return t;
        }
    }

    /**
* Creates a Mesh-Picker picker dialog for users that have access to multiple meshes
*
* (4.1 Ready!)
*/
    export class ctrlMeshPicker extends TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        mPickerGroup: cdeNMI.INMIControl = null;
        mMeshList: cdeNMI.INMIControl = null;
        mNodesFld: cdeNMI.INMITileEntry = null;
        MyMeshes: Array<cde.TheMeshPicker> = null;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.MuTLock;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.mPickerGroup = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileGroup).Create(this, { PostInitBag: ["TileWidth=12", "ClassName=cdeLoginBlock"] }) as INMIControl;
            TheControlFactory.AddAdHocSmartControl(this.mPickerGroup, "HEADER", cdeNMI.cdeControlType.SmartLabel, "", 0, ["NoTE=true", "TileHeight=1", "TileWidth=12", "iValue=Please choose a mesh", "FontSize=36"]);

            const tMeshListFrame = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileGroup).Create(this.mPickerGroup, { PostInitBag: ["TileWidth=6", "TileHeight=6"] }) as INMITileEntry;
            const tSearch = TheControlFactory.AddAdHocSmartControl(tMeshListFrame, "SEARCH", cdeNMI.cdeControlType.SingleEnded, "Search for Mesh", 2, ["TileHeight=1", "TileFactorY=2", "TileWidth=5"]);
            tSearch.MyNMIControl.RegisterEvent("OnValueChanged", (sender, evt, pval) => {
                this.SetProperty("Filter", pval);
            });

            this.mMeshList = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileGroup).Create(tMeshListFrame, { PostInitBag: ["TileWidth=6", "TileHeight=5", "Style=overflow-y: auto;"] }) as INMIControl;

            const tExplainer = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileGroup).Create(this.mPickerGroup, { PostInitBag: ["TileWidth=6", "TileHeight=6"] });
            TheControlFactory.AddAdHocSmartControl(tExplainer, "NIM", cdeNMI.cdeControlType.SmartLabel, "", 0, ["NoTE=true", "TileHeight=1", "TileFactorY=2", "TileWidth=6", "iValue=Nodes in the Mesh"]);
            this.mNodesFld = TheControlFactory.AddAdHocSmartControl(tExplainer, "NODES", cdeNMI.cdeControlType.SmartLabel, "", 256, ["NoTE=true", "TileHeight=5"]);

            this.SetElement(this.mPickerGroup.GetElement());
            return true;
        }

        public SetMesh(pMeshes: Array<cde.TheMeshPicker>) {
            if (pMeshes)
                this.MyMeshes = pMeshes;
            if (!this.MyMeshes)
                return;

            if (this.mMeshList) {
                this.mMeshList.GetElement().innerHTML = null;
                this.mNodesFld.SetProperty("iValue", "");

                const pFilter: string = cde.CStr(this.GetProperty("Filter"));

                for (let i = 0; i < this.MyMeshes.length; i++) {
                    if (!this.MyMeshes[i].HomeNode)
                        this.MyMeshes[i].HomeNode = "";
                    if (pFilter && this.MyMeshes[i].MeshHash.indexOf(pFilter) < 0 && this.MyMeshes[i].HomeNode.indexOf(pFilter) < 0 && this.MyMeshes[i].NodeNames.join().indexOf(pFilter) < 0)
                        continue;
                    this.CreateMeshButton(i);
                }
            }
        }

        public SetProperty(pName: string, pValue) {
            if (pName === "SetMesh") {
                this.SetMesh(pValue);
                return;
            }
            super.SetProperty(pName, pValue);
            if (pName === "Filter") {
                this.SetMesh(null);
            }
        }

        private CreateMeshButton(i: number) {
            const tMeshBut = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileGroup).Create(this.mMeshList, { PostInitBag: ["TileHeight=3", "TileFactorY=2", "TileWidth=11", "TileFactorX=2", "Style=box-shadow: rgba(0,0,0,.3) 0 1px 1px;"] }) as INMITileEntry;
            tMeshBut.SetProperty("Mesh", this.MyMeshes[i]);
            tMeshBut.SetProperty("OnClick", (pSender: INMIControl) => {
                const tM: cde.TheMeshPicker = pSender.GetProperty("Mesh");
                this.mNodesFld.SetProperty("FontSize", "36");
                this.mNodesFld.SetProperty("iValue", "Loading Mesh (" + tM.MeshHash + ")...");
                if (cdeNMI.MyEngine)
                    cdeNMI.MyEngine.SelectMesh(tM.cdeMID);
            });
            tMeshBut.SetProperty("OnHover", (pSender: INMIControl) => {
                const tM: cde.TheMeshPicker = pSender.GetProperty("Mesh");
                if (tM) {
                    let tNs = "<bl style='font-size:24px;'>";
                    for (let j = 0; j < tM.NodeNames.length; j++) {
                        //if (tNs.length > 0) tNs += "</br>";
                        tNs += "<li>" + tM.NodeNames[j] + "</li>";
                    }
                    tNs += "</bl>";
                    this.mNodesFld.SetProperty("iValue", tNs);
                }
            });
            cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileGroup).Create(tMeshBut, { PostInitBag: ["TileWidth=5", "TileHeight=1", "TileFactorY=4"] });
            TheControlFactory.AddAdHocSmartControl(tMeshBut, "ICON" + i, cdeNMI.cdeControlType.HashIcon, "", 0, ["NoTE=true", "TileHeight=1", "TileWidth=1", "iValue=" + this.MyMeshes[i].MeshHash]);
            TheControlFactory.AddAdHocSmartControl(tMeshBut, "LABEL" + i, cdeNMI.cdeControlType.SmartLabel, "", 256, ["NoTE=true", "TileHeight=1", "TileWidth=4", "iValue=" + this.MyMeshes[i].HomeNode + "<br>(" + this.MyMeshes[i].MeshHash + ")", "ClassName=cdePickerLabel"]);
        }
    }
}