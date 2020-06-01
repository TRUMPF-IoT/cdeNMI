// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {


    /**
* Creates a Tile Entry used in Forms
*
* (3.2 Ready!)
*/
    export class ctrlTileEntry extends TheNMIBaseControl implements INMITileEntry {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        MyControlTypeName: string = null;
        public MyTEContainer: INMIControl = null;
        public MyTEContent: INMIControl = null; // ctrlTileGroup = null;

        mOldClassName: string = null;
        mTELabel: INMIControl = null; // ctrlTileGroup = null;
        mTEContentOuter: INMIControl = null;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.TileEntry;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.MyTEContainer = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(pTargetControl, { ScreenID: pScreenID });
            this.MyTEContainer.SetProperty("ClassName", "cdeFlexRow cdeFlexCenter cdeTileContainer");
            if (pTRF && pTRF.FldInfo) {
                this.MyTEContainer.GetElement().setAttribute("cdefo", cde.CStr(pTRF.FldInfo.FldOrder));
                this.MyTEContainer.GetElement().setAttribute("cdemid", cde.GuidToString(pTRF.FldInfo.cdeMID));
            }
            //this.MyTEContainer.GetElement().style.zoom = cde.MyBaseAssets.MyServiceHostInfo.TileScale.toString();

            this.mTELabel = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(this.MyTEContainer, { ScreenID: pScreenID });
            this.mTELabel.SetProperty("LabelElement", "span");
            this.mTELabel.SetProperty("LabelClassName", "cdeTileEntryLabel");
            this.mTELabel.SetProperty("ClassName", "cdeFlexLabel");

            this.mTEContentOuter = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(this.MyTEContainer, { ScreenID: pScreenID });
            this.mTEContentOuter.SetProperty("ClassName", "cdeFlexRow cdeFlexCenter cdeFlexStart cdeControlContainer");
            this.MyTEContent = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(this.mTEContentOuter, { ScreenID: pScreenID });
            this.MyTEContent.SetProperty("ClassName", "cdeTileEntryText");

            this.SetElement(this.MyTEContainer.GetElement(), false, this.MyTEContent.GetElement(), true);
            if (pTRF.FldInfo["RenderTarget"]) {
                this.SetProperty("Visibility", false);
            }

            let tTileWidth: number = cde.CInt(this.GetSetting("TileWidth"));
            if (tTileWidth <= 0) {
                if (cde.CBool(this.GetSetting("InheritWidth"))) {
                    if (pTargetControl.GetProperty("ControlTW"))
                        tTileWidth = pTargetControl.GetProperty("ControlTW");
                    else
                        tTileWidth = Math.round(pTargetControl.GetElement().clientWidth / cdeNMI.GetSizeFromTile(1));
                } else {
                    if (tTileWidth === 0)
                        tTileWidth = 6;
                }
            }
            //if (cde.CInt(this.GetSetting("TileWidth")) >= 0)
            this.SetProperty("TileWidth", tTileWidth);


            let tTileHeight = 1;
            if (cde.CInt(this.GetSetting("TileHeight")) > 0)
                tTileHeight = this.GetSetting("TileHeight");
            if (cde.CInt(this.GetSetting("TileHeight")) >= 0)
                this.SetProperty("TileHeight", tTileHeight);

            this.MyControlTypeName = pTRF.FldInfo["ControlType"];
            if (this.MyControlTypeName) {
                const tN: string = cdeNMI.MyTCF.GetControlByName(this.MyControlTypeName);
                if (tN) {
                    const tNA = tN.split(':');
                    this.MyControlTypeName = tNA[0];
                    if (tNA.length > 1)
                        this.MyEngineName = tNA[1];
                }
            }
            if (cde.CInt(this.MyControlTypeName) > 0) {
                this.MyControlTypeName = cdeNMI.MyTCF.GetControlType(pTRF.FldInfo.Type);
            }
            if (!this.MyEngineName)
                this.MyEngineName = pTRF.FldInfo["EngineName"];
            if (pTRF.FldInfo.Type !== cdeControlType.UserControl) {
                this.MyEngineName = cdeNMI.eTheNMIEngine;
                this.MyControlTypeName = cdeNMI.MyTCF.GetControlType(pTRF.FldInfo.Type);
                if (!this.MyControlTypeName)
                    this.MyControlTypeName = "cdeNMI.ctrlEditBox";
            }
            if (!this.MyControlTypeName || this.MyControlTypeName === "")
                this.MyControlTypeName = pTRF.FldInfo["DefaultValue"];

            if (!this.MyControlTypeName) {
                this.SetProperty("PlaceHolder", "Missing Type for UserControl");
                return true;
            }

            if (!pTRF.FldInfo["RenderTarget"] && !pTRF.FldInfo["PlaceHolder"])
                this.SetProperty("PlaceHolder", "(Waiting for control #" + pTRF.FldInfo.FldOrder + ": " + this.MyControlTypeName + ")");
            else {
                if (!pTRF.FldInfo["PlaceHolder"])
                    this.SetProperty("PlaceHolder", pTRF.FldInfo["PlaceHolder"]);
            }

            switch (pTRF.FldInfo.Type) { //TODO: I dont want this here but in the ctrlTable - it needs to decide how it looks inside 
                case cdeControlType.Table:
                    if (cde.IsNotSet(pTRF.FldInfo["ClassName"]))
                        pTRF.FldInfo["ClassName"] = "CMyTable";
                    break;
                default:
                    break;
            }

            pTargetControl.RegisterEvent("OnLoaded", () => {
                this.MyTEContent.FireEvent(true, "OnLoaded");
            });

            this.RegisterEvent("Resize", (sender, newSize) => {
                if (this.MyNMIControl)
                    this.MyNMIControl.FireEvent(true, "Resize", newSize);
            });

            return true;
        }

        public SetProperty(pName: string, pValue) {
            if (pName === "IsOwnerDown") {
                if (pValue === true) {
                    if (this.GetProperty(pName) === true)
                        return;
                    this.mOldClassName = this.MyTEContainer.GetElement().className;
                    this.MyTEContainer.GetElement().className += " cdeNodeGone";
                }
                else {
                    if (this.GetProperty(pName) !== true)
                        return;
                    this.MyTEContainer.GetElement().className = this.mOldClassName;
                }
            }
            //Properties only on TE not propagated anywhere
            if (pName === "IsInTable") {
                super.SetProperty(pName, pValue);
                return;
            }
            if (pName === "Visibility") {
                this.MyTEContainer.SetProperty(pName, pValue);
                return;
            }
            if (pName === "MinTileWidth" && cde.CInt(pValue) > 0) {
                super.SetProperty(pName, pValue);
                pName = "TileWidth";
            } else if (pName === "MinTileHeight" && pValue) {
                super.SetProperty(pName, pValue);
                pName = "TileHeight";
            }
            //Properties on TE but will be propageted
            if (pName === "NoTE" || pName === "TileWidth" || pName === "TileHeight") {
                super.SetProperty(pName, pValue);
            } else if (pName === "Z-Index" && this.MyTEContent) {
                pValue = cde.CInt(pValue);
                this.MyTEContent.SetProperty("Z-Index", pValue);
            }

            ///Properties for Forms but not Tables
            if (pName === "IsAbsolute" || pName === "Top" || pName === "Left" || pName === "TileTop" || pName === "TileLeft") {
                if (cde.CBool(this.GetProperty("IsInTable")))
                    return;
                super.SetProperty(pName, pValue);
                return;
            }

            if (pName === "TileWidth" || pName === "NoTE") {
                if (cde.CInt(this.GetProperty("TileWidth")) < cde.CInt(this.GetProperty("MinTileWidth")))
                    return;

                let tScale = 1;
                if (cde.CInt(this.GetProperty("TileFactorX")) > 1)
                    tScale = cde.CInt(this.GetProperty("TileFactorX"));

                if (cde.CBool(this.GetProperty("NoTE")) || cde.CInt(this.GetProperty("TileWidth")) < (3 * tScale)) {
                    this.mTELabel.SetProperty("Visibility", false);
                    this.MyTEContainer.SetProperty("TileWidth", cde.CInt(this.GetProperty("TileWidth")));
                    this.mTEContentOuter.SetProperty("TileWidth", cde.CInt(this.GetProperty("TileWidth")));
                    super.SetProperty("ControlTW", cde.CInt(this.GetProperty("TileWidth")));
                }
                else {
                    this.mTELabel.SetProperty("Visibility", true);
                    this.mTELabel.SetProperty("TileWidth", 2);
                    this.mTEContentOuter.SetProperty("TileWidth", cde.CInt(this.GetProperty("TileWidth")) - 2);
                    super.SetProperty("ControlTW", cde.CInt(this.GetProperty("TileWidth")) - 2);
                }
                if (this.MyNMIControl) {
                    this.MyNMIControl.SetProperty("ControlTW", cde.CInt(this.GetProperty("ControlTW")));
                }
                return;
            } else if (pName === "TileHeight") {
                if (cde.CInt(pValue) < cde.CInt(this.GetProperty("MinTileHeight")))
                    return;
                this.MyTEContainer.SetProperty("TileHeight", cde.CInt(pValue));
                this.mTEContentOuter.SetProperty("TileHeight", cde.CInt(pValue));
                this.mTELabel.SetProperty("TileHeight", cde.CInt(pValue));
                super.SetProperty("ControlTH", cde.CInt(this.GetProperty("TileHeight")));
                if (this.MyNMIControl) {
                    this.MyNMIControl.SetProperty("ControlTH", cde.CInt(this.GetProperty("ControlTH")));
                }
                return;
            } else if (pName === "TileFactorX") {
                this.MyTEContainer.SetProperty("TileFactorX", cde.CInt(pValue));
                this.mTEContentOuter.SetProperty("TileFactorX", cde.CInt(pValue));
                this.mTELabel.SetProperty("TileFactorX", cde.CInt(pValue));
                //return;
            } else if (pName === "TileFactorY") {
                this.MyTEContainer.SetProperty("TileFactorY", cde.CInt(pValue));
                this.mTEContentOuter.SetProperty("TileFactorY", cde.CInt(pValue));
                this.mTELabel.SetProperty("TileFactorY", cde.CInt(pValue));
                //return;
            } else if (pName === "ContainerStyle" && this.mTELabel) {
                this.MyTEContainer.SetProperty("Style", pValue);
            } else if (pName === "ContainerClassName" && this.MyTEContainer) {
                this.MyTEContainer.SetProperty("ClassName", pValue);
                return;
            } else if (pName === "LabelClassName" && this.mTELabel) {
                this.mTELabel.SetProperty("ClassName", pValue);
                this.mTELabel.SetProperty("LabelClassName", pValue);
                return;
            } else if (pName === "LabelForeground" && this.mTELabel) {
                this.mTELabel.SetProperty("LabelForeground", pValue);
                return;
            } else if (pName === "LabelFontSize" && this.mTELabel) {
                this.mTELabel.SetProperty("LabelFontSize", pValue);
                return;
            } else if ((pName === "LabelBackground" || pName === "CaptionBackground") && this.mTELabel) {
                this.mTELabel.SetProperty("CaptionBackground", pValue);
                return;
            } else if (pName === "ContentOuterClassName" && this.mTEContentOuter) {
                this.mTEContentOuter.SetProperty("ClassName", pValue);
                return;
            } else if (pName === "MainClassName" && this.MyTEContent) {
                this.MyTEContent.SetProperty("ClassName", pValue);
                return;
            } else if (pName === "MainBackground" && this.MyTEContent) {
                this.MyTEContent.SetProperty("Background", pValue);
                return;
            } else if (pName === "VerticalAlignment" && this.MyTEContent && pValue) {
                this.MyTEContent.GetElement().className = 'cdeTileEntryText cdeFlexRow';
                switch (pValue.toString().toLowerCase()) {
                    case "top":
                        this.MyTEContent.GetElement().style.alignItems = 'flex-start';
                        break;
                    case "bottom":
                        this.MyTEContent.GetElement().style.alignItems = 'flex-end';
                        break;
                    default:
                        this.MyTEContent.GetElement().style.alignItems = 'center';
                        break;
                }
                return;
            } else if ((pName === "Label" || pName === "Title") && this.mTELabel) {
                this.mTELabel.SetProperty("Label", pValue);
                if (!cde.CBool(this.GetProperty("NoTE")))
                    return;
            } else if (pName === "PlaceHolder" && this.MyTEContent) {
                this.MyTEContent.SetProperty("Label", pValue);
                return;
            }
            if (this.MyNMIControl) {
                this.MyNMIControl.SetProperty(pName, pValue);
            }
        }

        OnLoad(bIsVisible?: boolean) {
            if (this.MyNMIControl)
                this.MyNMIControl.OnLoad(bIsVisible);
            super.OnLoad(bIsVisible);
        }

        OnUnload() {
            if (this.MyNMIControl)
                this.MyNMIControl.OnUnload();
            super.OnUnload();
        }

        public GetProperty(pName) {
            if ((pName === "DataItem" || pName === "iValue" || pName === "Value") && this.MyNMIControl) {
                return this.MyNMIControl.GetProperty(pName);
            }
            return super.GetProperty(pName);
        }

        public CreateControl(tFldID: string, callback?): INMIControl {
            if (!cdeNMI.MyTCF) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "TileEntry:CreateControl", "MyTCF not initialized!");
                return null;
            }
            return cdeNMI.MyTCF.CreateControlLazy(this, this.MyEngineName, this.MyControlTypeName, (tgtCtrl: INMIControl, e: INMIControl, cookieTFldID: string) => {
                if (e.InitControl(tgtCtrl, this.MyTRF, null, this.MyScreenID)) {
                    try {
                        e.SetTE(this);
                        cdeNMI.MyTCF.SetControlEssentials(this, e);
                        this.SetProperty("PlaceHolder", null);
                        cdeNMI.AddFieldComment(this.MyTEContent.GetElement(), this.MyFieldInfo);
                        e.PostCreate(this);
                        if (callback)
                            callback(e, cookieTFldID);
                    }
                    catch (eee) {
                        this.SetProperty("PlaceHolder", eee);
                    }
                }
            }, tFldID);
        }

        public ApplySkin() {
            if (this.MyNMIControl)
                this.MyNMIControl.ApplySkin();
        }

        //Backward compat

        public static Create(pTargetControl: cdeNMI.INMIControl, pTRF: TheTRF, pPropertyBag?: string[], pScreenID?: string): INMITileEntry {
            const tTile: ctrlTileEntry = new ctrlTileEntry(pTRF);
            if (pTRF && pTRF.FldInfo && (!pTRF.FldInfo.Type || pTRF.FldInfo.Type === 0))
                pTRF.FldInfo.Type = cdeControlType.SingleEnded; //If no Type is specified use 1 (Edit). Might be removed!
            tTile.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);
            return tTile;
        }
    }
}