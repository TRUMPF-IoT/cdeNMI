// SPDX-FileCopyrightText: 2009-2023 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {
    /**
    * Creates a group of elements in a DIV
    * The pTargetControl will be overlayed by the ctrlDrawOverlay
    * pTRF is handed to ctrlTouchDraw
    *
    * This control is a Container Control
    * (4.1 Ready!)
    */
    export class ctrlTileGroup extends TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        public static Create(pTargetEleme: cdeNMI.INMIControl, pTRF: TheTRF, pPropertyBag?: string[], pScreenID?: string, pCaption?: string, pClassName?: string): ctrlTileGroup {
            const t: ctrlTileGroup = new ctrlTileGroup(pTRF);
            t.InitControl(pTargetEleme, pTRF, pPropertyBag, pScreenID);
            if (pCaption)
                t.SetProperty("Label", pCaption);
            if (pClassName)
                t.SetProperty("ClassName", pCaption);
            return t;
        }

        divTiles: HTMLDivElement = null;
        divDragContent: HTMLDivElement = null;
        h1Title: INMIControl = null;
        dragPosition = { x: 0, y: 0 }

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.TileGroup;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID)
            this.divTiles = document.createElement('div');
            this.divTiles.className = "cdeTiles";
            this.divTiles.style.cssFloat = "left";
            if (pTRF?.FldInfo) {
                this.divTiles.setAttribute("cdefo", cde.CStr(pTRF.FldInfo.FldOrder));
                this.divTiles.setAttribute("cdemid", cde.GuidToString(pTRF.FldInfo.cdeMID));
                if (cde.CBool(this.GetSetting("DisallowEdit")) === false)
                    this.divTiles.setAttribute("cdesel", "true");
            }
            if (cde.CBool(this.GetSetting("AllowDragOld"))) {
                this.divDragContent = document.createElement('div');
                this.divDragContent.style.position = "absolute";
                this.divDragContent.style.overflow = "hidden";
                this.divTiles.style.position = "relative";
                this.divTiles.appendChild(this.divDragContent);
                this.SetElement(this.divTiles, false, this.divDragContent);
            }
            else {
                this.SetElement(this.divTiles);
            }

            return true;
        }

        public SetProperty(pName: string, pValue) {
            super.SetProperty(pName, pValue);
            let tWid: number;
            if (pName === "Caption" || pName === "Label" || pName === "Title" || pName === "Value" || pName === "iValue") {
                if (pValue) {
                    let tNewVal: string = pValue;
                    if (pName === "Caption" || pName === "Label" || pName === "Title")
                        tNewVal = cdeNMI.TL.T(pValue);
                    if (this.GetProperty("Format") && (pName === "Value" || pName === "iValue")) {
                        tNewVal = this.GetProperty("Format").format(pValue);
                    }
                    if (this.MyBaseType !== cdeControlType.CollapsibleGroup && cde.CBool(this.GetProperty("IsDivOnly"))) {
                        if (tNewVal && tNewVal.startsWith("FA") && tNewVal.length === 8) {
                            tNewVal = "<i class='fa faIcon " + (tNewVal.substring(3, 4) === "S" ? "fa-spin " : "") + "fa-" + tNewVal.substring(2, 3) + "x'>&#x" + tNewVal.substring(4) + ";</i>";
                        }
                        this.divTiles.innerHTML = tNewVal;
                        this.divTiles.style.cssFloat = "none";
                    } else {
                        if (!cde.CBool(this.GetProperty("HideCaption"))) {
                            if (!this.h1Title) { 
                                let titleEle = "h1";
                                if (this.GetProperty("LabelElement"))
                                    titleEle = this.GetProperty("LabelElement");
                                this.h1Title = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(null, { PreInitBag: ["Element=" + titleEle] });
                                if (this.GetProperty("LabelClassName"))
                                    this.h1Title.SetProperty("ClassName", this.GetProperty("LabelClassName"));
                                else {
                                    if ((cde.MyBaseAssets.MyServiceHostInfo.WebPlatform !== 5) && (this.GetProperty("IsSmall") || cde.CInt(this.GetProperty("TileFactorY")) > 1))
                                        this.h1Title.SetProperty("ClassName", "cdeTileGroupHeaderSmall");
                                    else
                                        this.h1Title.SetProperty("ClassName", "cdeTileGroupHeader");
                                }
                                this.h1Title.GetElement().style.cssFloat = null;
                                this.divTiles.appendChild(this.h1Title.GetElement());
                            }
                            this.h1Title.SetProperty("iValue", tNewVal);
                        }
                    }
                } else {
                    if (this.h1Title) {
                        this.h1Title.GetElement().parentElement.removeChild(this.h1Title.GetElement());
                        this.h1Title = null;
                    }
                    return;
                }
            } else if (pName === "HideCaption" && this.h1Title && cde.CBool(pValue)) {
                this.h1Title.GetElement().parentElement.removeChild(this.h1Title.GetElement());
                this.h1Title = null;
            } else if (pName === "OnClick" && pValue) {
                this.PreventManipulation = true;
                this.HookEvents(false);
                this.RegisterEvent("OnClick", pValue);
                this.RegisterEvent("PointerUp", this.DoFireClick);
            } else if (pName === "OnHover" && pValue) {
                this.GetElement().addEventListener("mouseenter", (evt) => this.onHover(evt));
                this.RegisterEvent("OnHover", pValue);
            } else if ((pName === "TileWidth" || pName === "TileFactorX") && this.MyRootElement) {
                pValue = this.GetProperty("TileWidth");
                if (!pValue) pValue = 1;
                if (cde.CInt(pValue) > 0) {
                    tWid = this.SetWidth(this.divTiles, cde.CInt(pValue), 0);
                    this.divTiles.style.maxWidth = tWid + "px";
                    if (this.divDragContent) {
                        this.divDragContent.style.width = tWid + "px";
                        this.divDragContent.style.maxWidth = tWid + "px";
                    }
                } else {
                    if (this.divDragContent) {
                        this.divTiles.style.width = this.divDragContent.clientWidth + "px";
                        this.divTiles.style.maxWidth = this.divDragContent.clientWidth + "px";
                    }
                    else {
                        this.divTiles.style.width = "inherit";
                        this.divTiles.style.maxWidth = "inherit";
                    }
                }
                this.SetProperty("ControlTW", pValue);
            } else if ((pName === "TileHeight" || pName === "TileFactorY") && this.MyRootElement) {
                pValue = this.GetProperty("TileHeight");
                if (!pValue) pValue = 1;
                if (cde.CInt(pValue) > 0) {
                    tWid = this.SetHeight(this.divTiles, cde.CInt(pValue), 0);
                    this.divTiles.style.maxHeight = tWid + "px";
                    if (this.divDragContent)
                        this.divDragContent.style.height = tWid + "px";
                } else {
                    if (this.divDragContent) {
                        this.divTiles.style.height = this.divDragContent.clientHeight + "px";
                        this.divTiles.style.maxHeight = this.divDragContent.clientHeight + "px";
                    }
                    else {
                        this.divTiles.style.height = "inherit";
                        this.divTiles.style.maxHeight = "inherit";
                    }
                }
                this.SetProperty("ControlTH", pValue);
            } else if (pName === "MaxTileHeight" && this.MyRootElement) {
                if (cde.CInt(pValue) > 0) {
                    tWid = cdeNMI.GetSizeFromTile(cde.CInt(pValue));
                    if (cde.CInt(this.GetProperty("TileFactorY")) > 1)
                        tWid /= cde.CInt(this.GetProperty("TileFactorY"));
                    this.divTiles.style.maxHeight = tWid + "px";
                } else {
                    this.divTiles.style.maxHeight = "inherit";
                }
            } else if (pName === "Background" && this.MyRootElement && this.MyBaseType !== cdeControlType.CollapsibleGroup) {
                this.divTiles.style.background = pValue;
            } else if (pName === "GroupBackground" && this.MyRootElement) {
                this.divTiles.style.background = pValue;
            } else if (pName === "IsVScrollable" && this.MyRootElement) {
                this.MyRootElement.style.overflowY = "auto";
            } else if (pName === "IsHScrollable" && this.MyRootElement) {
                this.MyRootElement.style.overflowX = "auto";
            } else if (pName === "Overflow" && this.MyRootElement) {
                this.MyRootElement.style.overflow = pValue;
            } else if (pName === "LabelClassName" && this.h1Title) {
                this.h1Title.SetProperty("ClassName", pValue);
            } else if (pName === "CaptionBackground" && this.h1Title) {
                this.h1Title.SetProperty("Background", pValue);
            } else if (pName === "LabelForeground" && this.h1Title) {
                this.h1Title.SetProperty("Foreground", pValue);
            } else if (pName === "LabelFontSize" && this.h1Title) {
                this.h1Title.SetProperty("FontSize", pValue);
            } else if (pName === "PixelHeight") {
                super.SetProperty("PixelHeight", pValue);
                if (this.divDragContent) {
                    if (pValue.toString().endsWith("px") || pValue.toString().endsWith("%") || pValue === "auto")
                        this.divDragContent.style.height = pValue;
                    else
                        this.divDragContent.style.height = pValue + "px";
                    this.divTiles.style.height = this.divDragContent.clientHeight + "px";
                }
            } else if (pName === "LabelFormat") {
                this.SetProperty("Format", pValue);
                this.SetProperty("iValue", this.GetProperty("Value"));
            }
        }

        onHover(evt) {
            this.FireEvent(true, "OnHover", evt);
        }

        public ApplySkin() {
            if (this.divDragContent)
                this.divTiles.style.height = this.divDragContent.clientHeight + "px";
        }

        public AppendChild(pEle: cdeNMI.INMIControl) {
            try {
                this.MyChildren.push(pEle);
                if (pEle.GetElement()) {
                    if (this.GetContainerElement() !== pEle.GetElement())
                        this.GetContainerElement().appendChild(pEle.GetElement());
                    this.ApplySkin();
                }
            }
            catch (eee) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "TileGroup:AppendChild", eee.message + ":" + eee.stack);
            }
        }
        public AppendElement(pEle: HTMLElement) {
            this.GetContainerElement().appendChild(pEle);
            this.ApplySkin();
        }
    }


    /**
    * Creates a Collapsible Tile Group allowing to structure a Form
    *
    * (4.1 Ready!)
    */
    export class ctrlCollapsibleGroup extends cdeNMI.ctrlTileGroup {
        constructor(pTRF?: TheTRF) {
            super(pTRF);
        }

        mTitleGroup: INMIControl;
        mHideOpenButton: INMIControl = null;
        mExpandLeftButton: INMIControl = null;
        mExpandRightButton: INMIControl = null;
        mDragButton: INMIControl = null;
        mContentGroup: INMIControl = null;
        pos1 = 0;
        pos2 = 0;
        pos3 = 0;
        pos4 = 0;
        oldz = "";
        oldBC = "";
        IsDragging = false;
        mDefaultSize = 6;
        IsTesla = false;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.SetTRF(pTRF, pPropertyBag);
            super.InitControl(pTargetControl, null, null, pScreenID);
            this.MyBaseType = cdeControlType.CollapsibleGroup;

            super.SetProperty("ClassName", "cdeCollapsibleGroup");

            if (!this.GetSetting("TileWidth") && this.GetSetting("MinTileWidth"))
                this.SetProperty("TileWidth", this.GetSetting("MinTileWidth"));

            this.IsTesla = false; 

            this.mTitleGroup = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup);
            const tGrpInfo: TheFieldInfo = new TheFieldInfo(cdeControlType.TileGroup, (pTRF && pTRF.FldInfo) ? pTRF.FldInfo.Flags : 2, null);
            tGrpInfo.FldOrder = (pTRF && pTRF.FldInfo) ? pTRF.FldInfo.FldOrder : 0;
            this.mTitleGroup.InitControl(this, new TheTRF(null, 0, tGrpInfo));
            this.mTitleGroup.GetElement().style.width = "100%";
            this.mTitleGroup.GetElement().style.maxWidth = "100%";
            this.mTitleGroup.GetElement().style.cssFloat = null;
            this.mTitleGroup.SetProperty("TileHeight", 1);
            this.SetGroupHeaderSize();
            this.mTitleGroup.HookEvents(false);

            this.RegisterEvent("Resize", (sender, tNewW: number) => {
                let tW = this.GetElement().clientWidth / cdeNMI.GetSizeFromTile(1);
                tW = Math.floor(tW / 6) * this.mDefaultSize;
                if (!cde.CBool(this.GetSetting("AllowHorizontalExpand")) && tNewW !== cde.CInt(this.GetProperty("TileWidth")))
                    return;
                if (tW > tNewW) {
                    if (!this.GetSetting("MinTileWidth") || tNewW >= cde.CInt(this.GetSetting("MinTileWidth"))) {
                        this.SetProperty("TileWidth", tNewW);
                        this.FireResize(tNewW);
                    }
                } else if (tW < tNewW) {
                    if (!this.GetSetting("MaxTileWidth") || tNewW <= cde.CInt(this.GetSetting("MaxTileWidth"))) {
                        this.SetProperty("TileWidth", tNewW);
                        this.FireResize(tNewW);
                    }
                }
            });

            this.mContentGroup = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup);
            this.mContentGroup.InitControl(this);
            this.mContentGroup.SetProperty("ClassName", "cdeInsideCollapsible");
            this.mContentGroup.GetElement().style.width = "inherit";

            const tCloseGroup: INMIControl = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup);
            tCloseGroup.InitControl(this);
            tCloseGroup.GetElement().style.height = (cdeNMI.GetSizeFromTile(1) / 4) + "px";
            tCloseGroup.SetProperty("ClassName", "cdeCloseGroup");
            this.SetElement(this.GetElement(), false, this.mContentGroup.GetElement());

            this.mTitleGroup.RegisterEvent("PointerUp", (pControl: cdeNMI.INMIControl, evt) => {
                if (evt.type === "mousedown" || this.IsDragging)
                    return;
                if (this.MyFieldInfo && (this.MyFieldInfo.Flags & 2) !== 0)
                    this.ToggleDrop(!cde.CBool(cde.CBool(this.GetProperty("IsOpen"))), false);
            });

            let lgsize = "2x";
            if (!this.IsTesla && cde.CBool(this.GetSetting("IsSmall")))
                lgsize = "lg";
            if (cde.CBool(this.GetSetting("AllowHorizontalExpand")) === true && cde.CBool(this.GetSetting("HidePins")) !== true && this.GetSetting("MaxTileWidth")) {
                this.mExpandLeftButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(this.mTitleGroup, { PreInitBag: ["ControlTW=1", "ControlTH=1"], PostInitBag: ["iValue=<span class='fa fa-" + lgsize + " cdeFormPin'>&#xF0A9;<span>"] });
                this.mExpandLeftButton.SetProperty("OnClick", (sender: cdeNMI.INMIControl, evt: Event) => {
                    let tW = this.MyRootElement.clientWidth / cdeNMI.GetSizeFromTile(1);
                    tW = Math.floor(tW / 6) * this.mDefaultSize;
                    if (!this.GetProperty("MaxTileWidth") || tW <= cde.CInt(this.GetProperty("MaxTileWidth")) - this.mDefaultSize && cdeNMI.MyScreenManager && this.SetWidth(null, tW + this.mDefaultSize, 0, true) < cdeNMI.MyScreenManager.DocumentWidth && cdeNMI.MyScreenManager.DocumentWidth > 0) {
                        tW += this.mDefaultSize;
                        this.SetNewWidth(tW);
                        this.ResizeParentsUp(this, tW);
                        this.FireResize(tW);
                    }
                    evt.stopPropagation();
                });
                this.mExpandLeftButton.SetProperty("Float", "right");
                if (!this.IsTesla && cde.CBool(this.GetSetting("IsSmall"))) {
                    this.mExpandLeftButton.SetProperty("TileFactorX", 2);
                    this.mExpandLeftButton.SetProperty("TileFactorY", 2);
                }

                this.mExpandRightButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(this.mTitleGroup, { PreInitBag: ["ControlTW=1", "ControlTH=1"], PostInitBag: ["iValue=<span class='fa fa-" + lgsize + " cdeFormPin'>&#xF0A8;<span>"] });
                this.mExpandRightButton.SetProperty("OnClick", (sender: cdeNMI.INMIControl, evt: Event) => {
                    let tW = this.MyRootElement.clientWidth / cdeNMI.GetSizeFromTile(1);
                    tW = Math.floor(tW / 6) * this.mDefaultSize;
                    if (tW > this.mDefaultSize && (!this.GetProperty("MinTileWidth") || tW >= cde.CInt(this.GetProperty("MinTileWidth")) + this.mDefaultSize) && !this.IsAChildBigger(tW - this.mDefaultSize)) {
                        tW -= this.mDefaultSize;
                        this.SetNewWidth(tW);
                        this.ResizeChildrenDown(this, tW);
                        this.FireResize(tW);
                    }
                    evt.stopPropagation();
                });
                this.mExpandRightButton.SetProperty("Float", "right");
                if (!this.IsTesla && cde.CBool(this.GetSetting("IsSmall"))) {
                    this.mExpandRightButton.SetProperty("TileFactorX", 2);
                    this.mExpandRightButton.SetProperty("TileFactorY", 2);
                }
            }

            if (cde.CBool(this.GetSetting("HidePins")) !== true && (!this.MyFieldInfo || this.MyFieldInfo.Flags === undefined || (this.MyFieldInfo.Flags & 2) !== 0)) {
                this.mHideOpenButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(this.mTitleGroup, { PreInitBag: ["ControlTW=1", "ControlTH=1"], PostInitBag: ["iValue=<span class='fa fa-lg cdeFormPin'>&#xF078;<span>"] });
                this.mHideOpenButton.SetProperty("Float", "left");
                if (!this.IsTesla && cde.CBool(this.GetSetting("IsSmall"))) {
                    this.mHideOpenButton.SetProperty("TileFactorX", 2);
                    this.mHideOpenButton.SetProperty("TileFactorY", 2);
                }
            }

            if (cde.CBool(this.GetSetting("AllowDrag"))) {
                this.mDragButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(this.mTitleGroup, { PreInitBag: ["ControlTW=1", "ControlTH=1"], PostInitBag: ["iValue=<span class='fa fa-lg cdeFormPin'>&#xF0b2;<span>"] });
                this.mDragButton.SetProperty("Float", "right");
                this.mDragButton.SetProperty("HoverClassName", "cdeDragButton");
                if (!this.IsTesla && cde.CBool(this.GetSetting("IsSmall"))) {
                    this.mDragButton.SetProperty("TileFactorX", 2);
                    this.mDragButton.SetProperty("TileFactorY", 2);
                }
                this.mDragButton.SetProperty("OnPointerDown", (sender, e) => {
                    if (this.IsDragging) {
                        this.closeDragElement(e);
                        return;
                    }
                    e = e || window.event;
                    e.preventDefault();
                    this.pos3 = e.clientX;
                    this.pos4 = e.clientY;
                    this.IsDragging = true;
                    document.onpointerup = (evt) => { this.closeDragElement(evt); }
                    this.oldz = this.MyRootElement.style.zIndex;
                    this.MyRootElement.style.zIndex = "4000";
                    this.oldBC = this.GetElement().style.backgroundColor;
                    this.GetElement().style.backgroundColor = "rgba(0,0,0,.4)";
                    document.onpointermove = (evt) => { this.elementDrag(evt); };
                });
            } else {
                this.SetProperty("Overflow", "hidden");
            }
            this.ApplySkin();
            this.ToggleDrop(!cde.CBool(cde.CBool(this.GetProperty("DoClose"))), true);
            return true;
        }

        public SetProperty(pName: string, pValue) {
            if (pName === "UseMargin" && cde.MyBaseAssets.MyServiceHostInfo.WebPlatform !== 1) {
                if (cde.CBool(pValue) === true)
                    super.SetProperty("Margin", cdeNMI.GetSizeFromTile(1) / 4);
                else
                    super.SetProperty("Margin", 0);
                return;
            } else if (pName === "Caption" || pName === "Label" || pName === "Title" || pName === "Value" || pName === "iValue") {
                let tNewVal = pValue;
                if (this.GetProperty("Format") && (pName === "Value" || pName === "iValue")) {
                    tNewVal = this.GetProperty("Format").format(pValue);
                } else {
                    tNewVal = cdeNMI.TL.T(tNewVal);
                }
                this.mTitleGroup.SetProperty(pName, tNewVal);
                if (cde.CBool(this.GetProperty("HideCaption")) || (cde.CBool(this.GetProperty("HidePins")) && cde.IsNotSet(pValue))) {
                    this.mTitleGroup.SetProperty("Visibility", false);
                } else {
                    this.mTitleGroup.SetProperty("Visibility", true);
                }
                return;
            } else if (pName === "HideCaption" && this.mTitleGroup && cde.CBool(pValue)) {
                this.mTitleGroup.SetProperty("Visibility", false);
            } else if (pName === "CaptionBackground") {
                this.mTitleGroup.SetProperty("Background", pValue);
            } else if (pName === "ContentBackground") {
                this.mContentGroup.SetProperty("Background", pValue);
            } else if (pName === "LabelForeground") {
                this.mTitleGroup.SetProperty(pName, pValue);
                if (this.mExpandLeftButton)
                    this.mExpandLeftButton.SetProperty("Foreground", pValue);
                if (this.mExpandRightButton)
                    this.mExpandRightButton.SetProperty("Foreground", pValue);
            } else if (pName === "LabelClassName") {
                this.mTitleGroup.SetProperty("LabelClassName", pValue);
                this.mTitleGroup.SetProperty("ClassName", pValue);
                this.ToggleDrop(!cde.CBool(cde.CBool(this.GetProperty("DoClose"))), true);
                return;
            } else if (pName === "DoClose") {
                this.ToggleDrop(!cde.CBool(pValue), true);
            } else if (pName === "Background" || pName === "GroupBackground" || pName === "IsVScrollable" || pName === "IsHScrollable") {
                super.SetProperty(pName, pValue);
                return;
            } else if (pName === "HidePins") {
                const tHide: boolean = (pName === "HidePins" ? !cde.CBool(pValue) : false);
                if (this.mHideOpenButton && (!tHide || (this.MyFieldInfo && (this.MyFieldInfo.Flags & 2) === 0)))
                    this.mHideOpenButton.SetProperty("Visibility", tHide);
                if (cde.CBool(pValue) && cde.IsNotSet(this.mTitleGroup.GetProperty("Value"))) {
                    this.mTitleGroup.SetProperty("Visibility", false);
                } else {
                    this.mTitleGroup.SetProperty("Visibility", true);
                }
            }
            super.SetProperty(pName, pValue);
            if (pName === "TileHeight" && cde.CBool(cde.CBool(this.GetProperty("DoClose")))) {
                this.ToggleDrop(!cde.CBool(cde.CBool(this.GetProperty("DoClose"))), true);
            } else if (!this.IsTesla && pName === "IsSmall" && this.mTitleGroup) {
                this.SetGroupHeaderSize();
            }
        }

        closeDragElement(e: Event) {
            cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "closedrag", "closed");
            e.stopPropagation();
            e.preventDefault();
            this.IsDragging = false;
            /* stop moving when mouse button is released:*/
            document.onpointermove = null;
            document.onpointerup = null;

            this.MyRootElement.style.zIndex = this.oldz;
            //Snap control infront of the control its on - except it was right infront of it
            this.MyRootElement.style.top = "0px";
            this.MyRootElement.style.left = "0px";
            this.GetElement().style.backgroundColor = this.oldBC;
            this.ApplySkin();
        }

        elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            this.pos1 = this.pos3 - e.clientX;
            this.pos2 = this.pos4 - e.clientY;
            this.pos3 = e.clientX;
            this.pos4 = e.clientY;

            if (this.pos1 === 0 && this.pos2 === 0) {
                this.closeDragElement(e);
                return;
            }
            this.IsDragging = true;
            cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "ElemetDrag", this.pos1 + "," + this.pos2 + "," + this.pos3 + "," + this.pos4);
            // set the element's new position:
            this.MyRootElement.style.top = (this.MyRootElement.offsetTop - this.pos2) + "px";
            this.MyRootElement.style.left = (this.MyRootElement.offsetLeft - this.pos1) + "px";
        }

        public SetNewWidth(tW: number) {
            if (tW > 0) {
                if (!cde.CBool(this.GetSetting("AllowHorizontalExpand")) && tW !== cde.CInt(this.GetProperty("TileWidth")))
                    tW = cde.CInt(this.GetProperty("TileWidth"));
                this.SetProperty("TileWidth", tW);
            }
        }

        ResizeParentsUp(pTargetControl: INMIControl, tW: number) {
            if (!pTargetControl.MyTarget)
                return;
            if (pTargetControl.MyTarget.MyBaseType === cdeControlType.CollapsibleGroup && cde.CBool(pTargetControl.MyTarget.GetProperty("AllowHorizontalExpand")) === true) {
                if (cde.CInt(pTargetControl.MyTarget.GetProperty("TileWidth")) < tW) {
                    pTargetControl.MyTarget.FireEvent(true, "Resize", tW);
                    this.ResizeParentsUp(pTargetControl.MyTarget, tW);
                }
            }
        }


        ResizeChildrenDown(pTargetControl: INMIControl, tW: number) {
            for (const i in pTargetControl.MyChildren) {
                const tChildControl: INMIControl = pTargetControl.MyChildren[i];
                if (tChildControl.MyBaseType === cdeControlType.CollapsibleGroup && cde.CBool(tChildControl.GetProperty("AllowHorizontalExpand")) === true) {
                    if (!tChildControl.GetProperty("TileWidth") || tW < cde.CInt(tChildControl.GetProperty("TileWidth")) && (!tChildControl.GetProperty("MinTileWidth") || tW >= cde.CInt(tChildControl.GetProperty("MinTileWidth")))) {
                        tChildControl.FireEvent(true, "Resize", tW);
                        this.ResizeChildrenDown(tChildControl, tW);
                    }
                }
            }
        }



        IsAChildSmaller(pTarget: INMIControl, tW: number) {
            for (const i in pTarget.MyChildren) {
                if (pTarget.MyChildren[i] && cde.CInt(pTarget.MyChildren[i].GetProperty("TileWidth")) < tW)
                    return true;
            }
            return false;
        }

        FireResize(pSize: number) {
            for (const i in this.MyChildren) {
                this.MyChildren[i].FireEvent(true, "Resize", pSize);
            }
        }


        SetGroupHeaderSize() {
            if (!this.mTitleGroup) return;

            if (!this.IsTesla && (this.GetProperty("IsSmall") || cde.CInt(this.GetProperty("TileFactorY")) > 1)) {
                this.mTitleGroup.GetElement().style.height = (cdeNMI.GetSizeFromTile(1) / 2) + "px";
                this.mTitleGroup.SetProperty("ClassName", "cdeTileGroupHeaderSmall");
                this.mTitleGroup.SetProperty("LabelClassName", "cdeTileGroupHeaderSmall");
            } else {
                this.mTitleGroup.SetProperty("ClassName", "cdeTileGroupHeader");
            }
            this.ToggleDrop(!cde.CBool(this.GetProperty("DoClose")), true);
        }

        ToggleDrop(doClose: boolean, doForce: boolean) {
            if (!doForce && cde.CBool(this.GetProperty("HidePins")))
                return;
            if (!doClose) {
                this.SetProperty("IsOpen", false);
                let tNH: number = (cdeNMI.GetSizeFromTile(1));
                if (!this.IsTesla && this.GetProperty("IsSmall"))
                    tNH /= 2;
                super.SetProperty("Style", "max-height:" + tNH + "px");
                this.colOpen(null);
            } else {
                this.SetProperty("IsOpen", true);
                if (this.mTitleGroup.GetElement().classList.contains("cdeCollapsibleClosed"))
                    this.mTitleGroup.GetElement().classList.remove("cdeCollapsibleClosed");
                this.mTitleGroup.GetElement().classList.add("cdeCollapsibleOpen");
                if (this.mHideOpenButton)
                    this.mHideOpenButton.SetProperty("Title", "<span class='fa fa-lg cdeFormPin'>&#xF077;<span>");
                if (cdeNMI.GetSizeFromTile(super.GetProperty("TileHeight")) > 0) {
                    let tNH: number = (cdeNMI.GetSizeFromTile(super.GetProperty("TileHeight")));
                    if (!this.IsTesla && this.GetProperty("IsSmall"))
                        tNH /= 2;
                    super.SetProperty("Style", "max-height:" + tNH + "px;");
                }
                else {
                    super.SetProperty("Style", "max-height:none;");
                }
                this.OnLoad();
            }
        }

        colOpen = (event: Event) => {
            if (event)
                event.target.removeEventListener("transitionend", this.colOpen);
            if (this.mTitleGroup.GetElement().classList.contains("cdeCollapsibleOpen"))
                this.mTitleGroup.GetElement().classList.remove("cdeCollapsibleOpen");
            if (!this.mTitleGroup.GetElement().classList.contains("cdeCollapsibleOpen"))
                this.mTitleGroup.GetElement().classList.add("cdeCollapsibleClosed");
            if (this.mHideOpenButton)
                this.mHideOpenButton.SetProperty("Title", "<span class='fa fa-lg cdeFormPin'>&#xF078;<span>");
            this.OnUnload();
        }
    }
}