// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {

    /**
    * Creates a smart Label 
    * SetProperty("Element") before InitControl to use any other element then <span> for the smart logo
    *
    * (4.1 Ready!)
    * 
    * Requires "IsInTable" and "Element" in PreInitBag
    */
    export class ctrlSmartLabel extends TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        MyLabelDiv: HTMLElement = null;
        MyLabelTextDiv: HTMLElement = null;
        MyEditControl: INMIControl = null;
        MyAnchor: HTMLAnchorElement = null;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.SmartLabel;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            if (this.MyFieldInfo) {
                this.SetProperty("Format", this.GetSetting("Format"));
                this.SetProperty("IsInTable", this.GetSetting("IsInTable"));
            }

            const HookEvents = false;

            if (this.MyFieldInfo) {
                if (this.GetSetting("Element"))
                    this.MyLabelDiv = document.createElement(this.GetSetting("Element")) as HTMLElement;
                else {
                    this.MyLabelDiv = document.createElement("div");
                    this.MyLabelDiv.style.width = "100%";
                }
            }
            else {
                if (this.GetSetting("Element"))
                    this.MyLabelDiv = document.createElement(this.GetSetting("Element")) as HTMLElement;
                else
                    this.MyLabelDiv = document.createElement("span");
            }
            const tS: string = this.GetSetting("ValueTitle");
            if (tS) {
                this.MyLabelTextDiv = document.createElement("div");
                this.MyLabelTextDiv.style.width = "100%";
                this.MyLabelTextDiv.innerHTML = tS;
                if (this.GetSetting("ValueTitleColor"))
                    this.MyLabelTextDiv.style.color = this.GetSetting("ValueTitleColor");
                if (this.GetSetting("ValueTitleSize"))
                    this.MyLabelTextDiv.style.fontSize = this.GetSetting("ValueTitleSize") + "px";
            }
            this.MyLabelDiv.innerHTML = "&nbsp;";
            this.SetElement(this.MyLabelDiv, HookEvents);
            if (this.MyLabelTextDiv)
                this.MyLabelDiv.parentElement.insertBefore(this.MyLabelTextDiv, this.MyLabelDiv);

            return true;
        }

        public SetProperty(pName: string, pValue) {
            if (cde.CBool(super.GetProperty("IsInTable")) && (pName === "TileHeight" || pName === "TileWidth" || pName === "TileLeft" || pName === "TileTop"))
                return;
            super.SetProperty(pName, pValue);
            if (pName === "Value" || pName === "Text" || pName === "iValue") {
                if (pName === "Text")
                    pValue = cdeNMI.TL.T(pValue);
                pValue = cdeNMI.GenerateFinalString(pValue, this.GetProperty("Cookie"))
                if (this.MyLabelDiv) {
                    if (this.GetProperty("ThingFriendlyName"))
                        this.MyLabelDiv.innerHTML = this.GetProperty("ThingFriendlyName");
                    else {
                        if (cde.CBool(super.GetProperty("IsInTable")))
                            this.GetToolTip(this.MyLabelDiv, this.ShowFieldContent(!cde.IsNotSet(pValue) ? pValue.toString() : '', this.MyFieldInfo, this.MyScreenID));
                        else
                            this.MyLabelDiv.innerHTML = this.ShowFieldContent(!cde.IsNotSet(pValue) ? pValue.toString() : '', this.MyFieldInfo, this.MyScreenID);
                    }
                }
                if (this.MyEditControl)
                    this.MyEditControl.SetProperty(pName, pValue);
            } else if (pName === "Format") {
                if (this.MyLabelDiv) {
                    const tValue = super.GetProperty("Value");
                    if (cde.CBool(super.GetProperty("IsInTable")))
                        this.GetToolTip(this.MyLabelDiv, this.ShowFieldContent(!cde.IsNotSet(tValue) ? tValue.toString() : '', this.MyFieldInfo, this.MyScreenID));
                    else
                        this.MyLabelDiv.innerHTML = this.ShowFieldContent(!cde.IsNotSet(pValue) ? pValue.toString() : '', this.MyFieldInfo, this.MyScreenID);
                }
            } else if (pName === "UXID" && this.MyFieldInfo.Type === cdeControlType.ThingPicker) {
                if (cdeNMI.MyEngine) {
                    cdeNMI.MyEngine.PublishToNMI('NMI_GET_DATA:THINGRESOLVE:' + this.GetProperty("ID") + ':' + this.GetProperty("UXID") + ';20:' + this.GetProperty("Value"), '', this.MyFieldInfo ? this.MyFieldInfo.cdeN : null); //fld Type instead of fldorder  + this.MyFieldInfo.FldOrder
                }
            } else if (pName === "ThingFriendlyName") {
                this.MyLabelDiv.innerHTML = pValue;
            } else if (pName === "ID") {
                if (this.MyLabelDiv)
                    this.MyLabelDiv.id = pValue;
            } else if (pName === "MainBackground" || pName === "MainClassName" || pName === "ContainerClassName") {
                if (this.MyTE)
                    this.MyTE.SetProperty(pName, pValue);
            } else if (pName === "Background") {
                if (this.MyTE)
                    this.MyTE.SetProperty("MainBackground", pValue);
                else {
                    if (this.MyLabelDiv)
                        this.MyLabelDiv.style.background = pValue;
                }
            } else if (pName === "Foreground") {
                if (this.MyLabelDiv)
                    this.MyLabelDiv.style.color = pValue;
            } else if (pName === "TileWidth") {
                if (this.MyLabelDiv) {
                    this.MyLabelDiv.style.width = cdeNMI.GetSizeFromTile(this.GetProperty("TileWidth")).toString() + "px";
                    if (cde.CBool(this.GetProperty("Truncate")))
                        this.MyLabelDiv.style.maxWidth = cdeNMI.GetSizeFromTile(this.GetProperty("TileWidth")).toString() + "px";
                }
            } else if (pName === "TileHeight") {
                if (this.MyLabelDiv)
                    this.MyLabelDiv.style.height = cdeNMI.GetSizeFromTile(this.GetProperty("TileHeight")).toString() + "px";
            } else if (pName === "Disabled") {
                if (this.MyEditControl)
                    this.MyEditControl.SetProperty(pName, pValue);
            } else if (pName === "Truncate" && cde.CBool(pValue) === true) {
                if (this.MyLabelDiv) {
                    this.MyLabelDiv.style.textOverflow = "ellipsis";
                    this.MyLabelDiv.style.overflow = "hidden";
                    this.MyLabelDiv.style.maxWidth = cdeNMI.GetSizeFromTile(this.GetProperty("TileWidth")).toString() + "px";
                }
            }
        }


        GetToolTip(pHTMLCtrl: HTMLElement, pContent: string) {
            if (!cdeNMI.MyToolTip || !pContent || pContent.length === 0 || !cde.MyBaseAssets.MyCommStatus.UserPref || cde.MyBaseAssets.MyCommStatus.UserPref.ShowToolTipsInTable === false) {
                pHTMLCtrl.innerHTML = pContent;
                return;
            }
            if (pContent.length > cde.CInt(this.GetSetting("FldWidth")) * 7 && pContent.indexOf('-') < 0 && pContent.indexOf(' ') < 0) {
                pHTMLCtrl.innerHTML = "";
                if (!this.MyAnchor) {
                    const tAnchor: string = "a_" + this.GetProperty("ID");
                    this.MyAnchor = document.createElement("a") as HTMLAnchorElement;
                    this.MyAnchor.id = tAnchor;
                    this.MyAnchor.innerHTML = "<i class='fa'>&#xf103;</i>";
                    this.MyAnchor.addEventListener("mouseenter", () => {
                        if (cdeNMI.MyToolTip)
                            cdeNMI.MyToolTip.Show(tAnchor, this.GetProperty("ToolTip") ? this.GetProperty("ToolTip") : (this.GetProperty("Text") ? this.GetProperty("Text") : this.GetProperty("Value")));
                    }, false);
                }
                pHTMLCtrl.appendChild(this.MyAnchor);
                pHTMLCtrl.insertAdjacentHTML('beforeend', pContent);
            } else {
                pHTMLCtrl.innerHTML = pContent;
            }
        }

        sinkValueChanged(pCtrl: INMIControl, pValue: string) {
            // bug fix #1263: ThingFiendlyName property of this control was updated only once on initialization.
            if (pCtrl.MyBaseType === cdeControlType.ThingPicker) {
                this.SetProperty("ThingFriendlyName", pCtrl.GetProperty("ThingFriendlyName")); // bug #1263: let's keep it updated,
            }
            this.restoreValue(pCtrl, pValue);
            this.SetProperty("Value", pValue);
        }
        restoreValue(pCtrl: INMIControl, pValue: string) {
            cdeNMI.ResetKeyCorder();
            if (cdeNMI.MyTouchOverlay) {
                cdeNMI.MyTouchOverlay.UnregisterEvent("Touched", null);
                this.DeleteControl(cdeNMI.MyTouchOverlay);
                cdeNMI.MyTouchOverlay = null;
            }
            if (this.MyEditControl) {
                this.DeleteControl(this.MyEditControl);
                this.MyEditControl = null;
            }
            this.SetProperty("IsUnhooked", false);
            const pStr: string = pCtrl.ShowFieldContent(pValue, this.MyFieldInfo);
            try {
                if (cde.CBool(super.GetProperty("IsInTable")))
                    this.GetToolTip(this.MyLabelDiv, pStr);
                else
                    this.MyLabelDiv.innerHTML = pStr;
            }
            catch {
                //ignored
            }
        }

        public EditControl(evt: Event, pPointer: ThePointer, pCtrl: INMIControl) {
            if (this.MyFieldInfo.Type === cdeNMI.cdeControlType.SingleCheck) {
                if (cde.CBool(this.GetSetting("IsReadOnly")) || this.IsDisabled)
                    return;
                if (pPointer.IsOnObject) {
                    cdeNMI.StopPointerEvents(evt);
                    if (!cdeNMI.MyTouchOverlay) {
                        this.MyLabelDiv.innerHTML = "";
                        cdeNMI.MyTouchOverlay = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TouchOverlay).Create(this) as INMITouchOverlay; 
                        cdeNMI.MyTouchOverlay.RegisterEvent("Touched", () => this.restoreValue(this, cde.CStr(this.GetProperty("Value"))));
                        this.MyEditControl = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SingleCheck).Create(this, { ScreenID: this.MyScreenID, TRF: this.MyTRF })
                        cdeNMI.MyTouchOverlay.CurrentControl = this;
                        this.MyEditControl.SetProperty("UpdateTable", true);
                        this.MyEditControl.SetProperty("OnValueChanged", (pCtrl, evt, pVal) => this.sinkValueChanged(pCtrl, pVal));
                    }
                }
            }
            else {
                if ((this.MyFieldInfo.Flags & 2) !== 0 && this.MyFieldInfo.Type !== cdeNMI.cdeControlType.SmartLabel) {
                    if (this.GetSetting("IsReadOnly") === true || this.IsDisabled || (cde.CBool(this.GetSetting("WriteOnce")) === true && cde.CStr(this.GetProperty("Value"))))
                        return;
                    if (!cdeNMI.MyTouchOverlay) {
                        cdeNMI.StopPointerEvents(evt);
                        if (this.MyFieldInfo.Type === cdeNMI.cdeControlType.TileButton) {
                            this.FireEvent(false, "OnClick");
                            return;
                        }
                        this.SetProperty("IsUnhooked", true);
                        this.MyLabelDiv.innerHTML = "";
                        cdeNMI.MyTouchOverlay = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TouchOverlay).Create(this) as INMITouchOverlay;
                        cdeNMI.MyTouchOverlay.RegisterEvent("Touched", () => this.restoreValue(this, cde.CStr(this.GetProperty("Value"))));
                        cdeNMI.MyTouchOverlay.SetProperty("PreventDefault", true);
                        const tE: INMITileEntry = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileEntry) as INMITileEntry;
                        this.MyTRF.FldInfo["IsInTable"] = this.GetSetting("IsInTable");
                        tE.MyDataView = this.MyDataView;
                        tE.InitControl(this, this.MyTRF, null, this.MyScreenID);
                        tE.SetProperty("Z-Index", 1300);
                        tE.SetProperty("NoTE", true);
                        switch (this.MyTRF.FldInfo.Type) {
                            case cdeControlType.CheckField:
                                tE.SetProperty("TileWidth", this.MyTRF.FldInfo["Bits"]);
                                break;
                            case cdeControlType.ComboOption:
                                tE.SetProperty("TileWidth", cde.CInt(this.MyTRF.FldInfo["FldWidth"]) - 1);
                                break;
                            default:
                                tE.SetProperty("TileWidth", this.MyTRF.FldInfo["FldWidth"]);
                                break;
                        }
                        tE.CreateControl("inTableClick", (pNewControl: INMIControl) => {
                            pNewControl.SetProperty("Z-Index", 1300);
                            pNewControl.SetProperty("OnValueChanged",
                                (pCtrl, evtName, pVal) => {
                                    if (!cdeNMI.MyTouchOverlay)
                                        return;
                                    this.SetProperty("LiveOptions", pCtrl.GetProperty("LiveOptions"));
                                    if (this.MyNMIControl) {
                                        this.MyNMIControl.SetProperty("Value", pVal);
                                    }
                                    this.sinkValueChanged(pCtrl, pVal);
                                });;
                        });
                        this.MyEditControl = tE;
                    }
                }
            }
        }

        //Backwards Compat

        public static Create(pTargetControl: cdeNMI.INMIControl, pScreenID: string, pTRF: TheTRF, pLabelText: string, pHElement?: string, pIsReadOnly?: boolean, pClass?: string, pCookie?, pParent?, pIsInTable?: boolean): ctrlSmartLabel {
            const t: ctrlSmartLabel = new ctrlSmartLabel(pTRF);
            if (pHElement)
                t.SetProperty("Element", pHElement);

            t.SetProperty("IsInTable", cde.CBool(pIsInTable));

            t.InitControl(pTargetControl, pTRF, null, pScreenID);

            if (cde.CBool(pIsReadOnly))
                t.SetProperty("IsReadOnly", pIsReadOnly);

            if (pParent)
                t.SetProperty("Parent", pParent);
            if (pCookie)
                t.SetProperty("Cookie", pCookie);
            if (pLabelText)
                t.SetProperty("iValue", pLabelText);
            if (pClass)
                t.SetProperty("ClassName", pClass);
            return t;
        }
    }
}