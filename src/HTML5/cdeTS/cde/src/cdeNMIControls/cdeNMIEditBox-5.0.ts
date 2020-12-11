// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {
    /**
* Creates an edit field for many different cdeControlTypes:
* 1: SingleLine
* 5: TextArea
* 10: Password (shows as ****)
* 12: Number
* 16: eMail
* 17: ComboOption   
* 31: URL
* 32: currency
* (4.1 Ready!)
*/
    export class ctrlEditBox extends TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        MyEditBox: HTMLInputElement = null;
        MyConfirmBox: HTMLInputElement = null;
        MyCombo: INMIComboBox = null;
        EnterButton: INMIControl = null;
        DropButton: INMIControl = null;
        MyMotLockButton: INMIControl = null;
        MyMotLockButton2: INMIControl = null;
        MyTextArea: HTMLTextAreaElement = null;
        mFrameDiv: HTMLDivElement = null;
        mMotLoc: INMIControl = null;
        mMotLoc2: INMIControl = null;
        mUpdButton: INMIControl = null;
        mBackDiv: HTMLDivElement = null;
        JustIn = false;
        JustInC = false;
        RequiresUpdateButton = false;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.SingleEnded;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.RequiresUpdateButton = cde.CBool(this.GetProperty("RequireUpdateButton"));

            this.mFrameDiv = document.createElement("div");
            //this.mFrameDiv.style.margin = "auto";
            this.mFrameDiv.style.width = "inherit";
            this.mFrameDiv.style.height = "inherit";
            this.mFrameDiv.className = "ctrlInput";
            this.SetElement(this.mFrameDiv);

            if (this.MyFieldInfo && this.MyFieldInfo.Type === cdeControlType.TextArea) //Text Area
            {
                this.MyTextArea = document.createElement("textarea");
                this.MyTextArea.className = "ctrlTextArea";
                this.MyTextArea.style.cssFloat = "left";
                this.mFrameDiv.appendChild(this.MyTextArea);
                this.MyTextArea.onblur = () => this.EditElement("13", this.MyTextArea);
            } else {
                if (this.MyFieldInfo && (this.MyFieldInfo.Type === cdeControlType.ComboOption) && cde.CInt(this.GetProperty("MultiLines")) > 1) {
                    this.MyTextArea = document.createElement("textarea");
                    this.MyTextArea.className = "ctrlTextArea";
                    this.MyTextArea.style.cssFloat = "left";
                    this.mFrameDiv.appendChild(this.MyTextArea);
                    let tR: number = cde.CInt(this.GetProperty("MultiLines"));
                    if (tR < 2)
                        tR = 2;
                    if (cde.CInt(this.GetSetting("TileFactorY")) > 1 && !this.MyTextArea.classList.contains("cdeSmall"))
                        this.MyTextArea.classList.add("cdeSmall");
                    this.MyTextArea.rows = tR;
                }
                else {
                    this.MyEditBox = document.createElement("input");
                    this.MyEditBox.style.cssFloat = "left";
                    if (!cde.CBool(this.GetProperty("EnableAutoFill")) && !cde.CBool(this.GetProperty("InTemplate"))) {
                        this.MyEditBox.name = "EB" + cde.GuidToString(this.MyFieldInfo.cdeMID) + "_" + Math.floor((Math.random() * 1000) + 1)
                        this.MyEditBox.autocomplete = "new-password";
                    }
                    this.mFrameDiv.appendChild(this.MyEditBox);

                    if (this.MyFieldInfo && this.MyFieldInfo.Type === 12)
                        this.MyEditBox.className = "cdeInputNumber";
                    else
                        this.MyEditBox.className = "cdeInput";
                    if (cde.CInt(this.GetSetting("TileFactorY")) > 1 && !this.MyEditBox.classList.contains("cdeSmall"))
                        this.MyEditBox.classList.add("cdeSmall");
                }
                let tAddEnter = false;
                if (this.MyFieldInfo) {
                    switch (this.MyFieldInfo.Type) {
                        case cdeControlType.Password:
                            tAddEnter = false;
                            this.MyBaseType = cdeControlType.Password;
                            this.MyEditBox.type = "password";
                            this.MyEditBox.addEventListener("focusin", () => {
                                this.JustIn = true;
                            });
                            if (!cde.CBool(this.GetProperty("HideMTL"))) {
                                this.mMotLoc = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.MuTLock).Create(this, { ScreenID: pScreenID, TRF: this.MyTRF });
                                this.mMotLoc.SetProperty("PassField", this);
                                this.mMotLoc.SetProperty("Visibility", cde.CBool(this.GetProperty("AutoShowMTL")));
                                this.mMotLoc.SetProperty("Style", "position:fixed;margin-top:" + cdeNMI.GetSizeFromTile(1) + "px");
                                this.MyMotLockButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(this, { PreInitBag: ["ControlTW=1", "ControlTH=1"], PostInitBag: ["Title=<span class='fa fa-2x'>&#xf00A;</span>", "ClassName=cdeMTL"] });
                                this.MyMotLockButton.SetProperty("Cookie", this);
                                this.MyMotLockButton.SetProperty("OnClick", (pSender: INMIControl, evt: Event) => {
                                    const tEd: ctrlEditBox = pSender.GetProperty("Cookie");
                                    cdeNMI.StopPointerEvents(evt);
                                    if (tEd.mMotLoc.Visibility) {
                                        tEd.mMotLoc.SetProperty("Visibility", false);
                                        if (tEd.MyEditBox.value.length > 0 && cdeNMI.Key13Event)
                                            cdeNMI.Key13Event(evt);
                                    } else {
                                        tEd.mMotLoc.SetProperty("Visibility", true);
                                        tEd.ShowHideMTL(true);
                                    }
                                });
                                this.SetProperty("ShowOverflow", true);
                                this.ShowHideMTL(cde.CBool(this.GetProperty("AutoShowMTL")));
                            }
                            if (cde.CBool(this.GetProperty("EnforceAndConfirm"))) {
                                this.MyConfirmBox = document.createElement("input");
                                this.MyConfirmBox.style.cssFloat = "left";
                                this.MyConfirmBox.className = "cdeInput";
                                this.MyConfirmBox.type = "password";

                                if (!cde.CBool(this.GetProperty("EnableAutoFill")) && !cde.CBool(this.GetProperty("InTemplate"))) {
                                    this.MyConfirmBox.name = "EB" + cde.GuidToString(this.MyFieldInfo.cdeMID) + "_" + Math.floor((Math.random() * 1000) + 1)
                                    this.MyConfirmBox.autocomplete = "new-password";
                                }
                                this.MyConfirmBox.addEventListener("focusin", () => {
                                    this.JustInC = true;
                                });
                                this.mFrameDiv.appendChild(this.MyConfirmBox);
                                if (!cde.CBool(this.GetProperty("HideMTL"))) {
                                    this.mMotLoc2 = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.MuTLock).Create(this, { ScreenID: pScreenID, TRF: this.MyTRF });
                                    this.mMotLoc2.SetProperty("PassField", this);
                                    this.mMotLoc2.SetProperty("Visibility", false);
                                    this.mMotLoc2.SetProperty("Style", "position:fixed;margin-top:" + cdeNMI.GetSizeFromTile(2) + "px");
                                    this.MyMotLockButton2 = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(this, { PreInitBag: ["ControlTW=1", "ControlTH=1"], PostInitBag: ["Title=<span class='fa fa-2x'>&#xf00A;</span>", "ClassName=cdeMTL"] });
                                    this.MyMotLockButton2.SetProperty("Cookie", this);
                                    this.MyMotLockButton2.SetProperty("OnClick", (pSender: INMIControl, evt: Event) => {
                                        const tEd: ctrlEditBox = pSender.GetProperty("Cookie");
                                        cdeNMI.StopPointerEvents(evt);
                                        if (tEd.mMotLoc2.Visibility) {
                                            tEd.mMotLoc2.SetProperty("Visibility", false);
                                            if (tEd.MyConfirmBox.value.length > 0 && cdeNMI.Key13Event)
                                                cdeNMI.Key13Event(evt);
                                        } else {
                                            tEd.mMotLoc2.SetProperty("Visibility", true);
                                            tEd.ShowHideMTL(true, true);
                                        }
                                    });
                                    this.SetProperty("ShowOverflow", true);
                                }
                                if (this.RequiresUpdateButton === true) {
                                    this.mUpdButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(this, { PreInitBag: ["ControlTW=3", "ControlTH=1"], PostInitBag: ["Title=Set Password", "ClassName=cdePWDUpdateButton"] });
                                    this.mUpdButton.SetProperty("Cookie", this);
                                    this.mUpdButton.SetProperty("OnClick", (pSender: INMIControl, evt: Event) => {
                                        const tEd: ctrlEditBox = pSender.GetProperty("Cookie");
                                        cdeNMI.StopPointerEvents(evt);
                                        tEd.CheckAndWriteValue(tEd.MyEditBox, false);
                                    });
                                }
                            }

                            break;
                        case cdeControlType.Number:
                            this.MyEditBox.type = "number";
                            this.MyBaseType = cdeControlType.Number;
                            break;
                        case cdeControlType.URL:
                            this.MyEditBox.type = "url";
                            this.MyBaseType = cdeControlType.URL;
                            break;
                        case cdeControlType.eMail:
                            this.MyEditBox.type = "email";
                            this.MyBaseType = cdeControlType.eMail;
                            break;
                        case cdeControlType.ComboOption: //With Combo
                            {
                                this.MyBaseType = cdeControlType.ComboOption;
                                const tOptions: string = this.MyFieldInfo["Options"];
                                if (this.MyTRF.ModelID || (tOptions && tOptions.indexOf("PROPERTYPICKER") < 0)) {
                                    const tGR: INMIControl = cdeNMI.MyTCF.CreateBaseControl().Create(this, { TRF: pTRF });
                                    const tDiv: HTMLDivElement = document.createElement("div");
                                    tDiv.style.width = "inherit";
                                    tDiv.style.height = "0";
                                    tDiv.id = cde.GuidToString(this.MyTRF.FldInfo.cdeMID) + "_CBODIV";
                                    tGR.SetElement(tDiv);
                                    this.DropButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(this, { PreInitBag: ["ControlTW=1", "ControlTH=1"], PostInitBag: ["Title=<span class='fa fa-3x'>&#xf03a;</span>"] });
                                    if (cde.CInt(this.GetProperty("TileFactorY")) > 1)
                                        this.DropButton.SetProperty("TileFactorY", cde.CInt(this.GetProperty("TileFactorY")));
                                    this.DropButton.SetProperty("OnClick", (pSender: INMIControl, evt: Event) => {
                                        cdeNMI.StopPointerEvents(evt);
                                        try {
                                            this.MyFieldInfo["OptionsLive"] = cdeNMI.GenerateFinalString(this.MyFieldInfo["Options"], cdeNMI.MyNMIModels[this.MyTRF.ModelID].MyStorageMirror[this.MyTRF.TableName][this.MyTRF.RowNo]);
                                        } catch (e) {
                                            //ignored
                                        }
                                        this.MyCombo.ShowComboPicker();
                                    });
                                    this.MyTRF.FldInfo["HideInput"] = true;
                                    this.MyCombo = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.ComboBox).Create(tGR, { ScreenID: pScreenID, TRF: this.MyTRF, PostInitBag: ["ClassName=cdeInvisible", "iValue=" + this.GetProperty("Value")] }) as INMIComboBox;
                                    this.MyCombo.RegisterEvent("OnValueChanged",
                                        (pCtrl, evt, pVal) => {
                                            if (pVal !== "" && pVal !== "CDE_NOP")
                                                this.SetProperty("Value", pVal);
                                        });
                                    this.SetProperty("OnValueChanged", (sender, evt, pval) => {
                                        if (pval)
                                            this.MyCombo.SetProperty("iValue", pval);
                                    });
                                    if (!cde.CBool(this.MyFieldInfo["IsOverlay"]) && !cde.CBool(this.MyFieldInfo["IsInTable"])) {
                                        if (this.MyTextArea)
                                            this.MyTextArea.onblur = () => this.EditElement("13", this.MyTextArea);
                                        else
                                            this.MyEditBox.onblur = () => this.EditElement("13", this.MyEditBox);
                                    }
                                }
                            }
                            break;
                        default:
                            if ((this.MyFieldInfo.Flags & 1) !== 0) {
                                this.MyEditBox.type = "password";
                                this.MyEditBox.addEventListener("focusin", () => {
                                    this.MyEditBox.value = "";
                                });
                            }
                            else
                                this.MyEditBox.type = "text";
                            break;
                    }
                }
                if (tAddEnter) {
                    this.EnterButton = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(this, { PreInitBag: ["ControlTW=1", "ControlTH=1"], PostInitBag: ["Title=<span class='fa fa-3x'>&#xf058;</span>"] });
                    this.EnterButton.SetProperty("OnClick", (pSender: INMIControl, evt: Event) => {
                        cdeNMI.StopPointerEvents(evt);
                        this.CheckAndWriteValue(this.MyEditBox, false);
                    });
                    this.EnterButton.SetProperty("Visibility", false);
                }
                if (!this.MyFieldInfo || (this.MyFieldInfo.Flags & 2) !== 0) {
                    if (this.MyTextArea) {
                        this.MyTextArea.onkeypress = (evt) => this.EditElement(evt, this.MyEditBox);
                        this.MyTextArea.onfocus = () => {
                            cdeNMI.DisableKey36Event = true;
                        }
                    } else {
                        this.MyEditBox.onkeypress = (evt) => this.EditElement(evt, this.MyEditBox);
                        this.MyEditBox.onfocus = () => {
                            cdeNMI.DisableKey36Event = true;
                        }
                    }
                    if (this.MyConfirmBox) {
                        this.MyConfirmBox.onkeypress = (evt) => this.EditElement(evt, this.MyConfirmBox);
                        this.MyConfirmBox.onfocus = () => {
                            cdeNMI.DisableKey36Event = true;
                        }
                    }
                }
            }
            this.SetProperty("iValue", super.GetProperty("Value"));
            if (this.MyFieldInfo && (this.MyFieldInfo.Flags & 2) === 0) this.SetProperty("Disabled", true);
            this.SetProperty("IsOverlay", cde.CBool(this.MyFieldInfo["IsOverlay"]) || cde.CBool(this.MyFieldInfo["IsInTable"]) || cde.CBool(this.GetProperty("AutoShowMTL")));
            if (this.MyFormID && cdeNMI.MyScreenManager) {
                const tScreen: INMIScreen = cdeNMI.MyScreenManager.GetScreenByID(this.MyFormID);
                if (tScreen)
                    tScreen.RegisterEvent("OnLoaded", () => this.ApplySkin());
            }
            return true;
        }

        OnUnload() {
            //New in 4.202.3: Disable any controls under a closed Collapsible Group
            this.SetProperty("Disabled", true);
            super.OnUnload();
        }

        OnLoad() {
            let tW = this.mFrameDiv.clientWidth;
            let setSize = false;
            if (tW > 0) {
                if (this.GetProperty("TileFactorX")) {
                    tW -= (20 / cde.CInt(this.GetProperty("TileFactorX")));
                }
                else
                    tW -= 20;
                setSize = (this.MyBaseType !== cdeControlType.ComboOption);
                if (setSize === true && ((!cde.CBool(this.GetProperty("HideMTL")) && this.MyBaseType === cdeControlType.Password)))
                    setSize = false;
            }
            const tEnable = !(!this.MyTRF || !this.MyTRF.FldInfo || (this.MyTRF.FldInfo.Flags & 2) !== 0);
            this.SetProperty("Disabled", tEnable);
            if (this.MyEditBox) {
                if (setSize)
                    this.MyEditBox.style.width = tW + "px";
            }
            if (this.MyConfirmBox) {
                if (setSize)
                    this.MyConfirmBox.style.width = tW + "px";
            }
            if (this.MyTextArea) {
                if (setSize)
                    this.MyTextArea.style.width = tW + "px";
            }
            super.OnLoad();
        }

        public SetProperty(pName: string, pValue) {
            if ((pName === "Value" || pName === "iValue") && (this.MyEditBox || this.MyTextArea)) {
                if (this.MyFieldInfo && (!pValue || pValue === "" || pValue === "-")) {
                    if (this.MyFieldInfo.Type === 31 && this.MyFieldInfo["DefaultValue"] === "") {
                        pValue = "http://";
                    } else {
                        if (this.MyFieldInfo["DefaultValue"])
                            pValue = this.MyFieldInfo["DefaultValue"];
                        else {
                            if (this.MyFieldInfo.Type === cdeControlType.Number)
                                pValue = 0;
                            else
                                pValue = "";
                        }
                    }
                    if (this.MyEditBox && cdeNMI.HasPlaceholderSupport) {
                        let tHelpText: string = this.MyFieldInfo["HelpText"];
                        if (!tHelpText)
                            tHelpText = this.MyFieldInfo["EditPlaceholder"];
                        if (tHelpText)
                            this.MyEditBox.placeholder = tHelpText;
                    }
                }
                //if (this.MyFieldInfo && this.MyFieldInfo.Type === cdeControlType.ComboOption)
                //    pValue = pValue;
                if (this.MyCombo)
                    this.MyCombo.SetProperty("iValue", pValue);
                if (this.MyTextArea)
                    this.MyTextArea.value = pValue;
                else {
                    this.MyEditBox.value = pValue;
                    if (this.MyConfirmBox)
                        this.MyConfirmBox.value = pValue;
                }
            } else if (pName === "EditPlaceholder" && this.MyEditBox) {
                this.MyEditBox.placeholder = pValue;
            } else if (pName === "Disabled" && this.MyEditBox) {
                if ((!this.MyFieldInfo || (this.MyFieldInfo.Flags & 2) === 0))
                    pValue = true;
                this.MyEditBox.disabled = cde.CBool(pValue);
                if (this.MyConfirmBox)
                    this.MyConfirmBox.disabled = cde.CBool(pValue);
            } else if (pName === "Disabled" && this.MyTextArea) {
                if ((!this.MyFieldInfo || (this.MyFieldInfo.Flags & 2) === 0))
                    pValue = true;
                this.MyTextArea.disabled = cde.CBool(pValue);
            } else if (pName === "Rows" && this.MyTextArea) {
                pValue = cde.CInt(pValue);
                this.MyTextArea.rows = pValue;
            } else if (pName === "Background") {
                if (this.MyTextArea)
                    this.MyTextArea.style.background = pValue;
                if (this.MyEditBox)
                    this.MyEditBox.style.background = pValue;
                if (this.MyConfirmBox)
                    this.MyConfirmBox.style.background = pValue;
            } else if (pName === "Foreground") {
                if (this.MyTextArea)
                    this.MyTextArea.style.color = pValue;
                if (this.MyEditBox)
                    this.MyEditBox.style.color = pValue;
                if (this.MyConfirmBox)
                    this.MyConfirmBox.style.color = pValue;
            } else if (pName === "ControlTW") {
                if (this.MyFieldInfo && ((this.MyFieldInfo.Type === cdeControlType.Password && !cde.CBool(this.GetProperty("HideMTL"))) || this.MyFieldInfo.Type === cdeControlType.ComboOption)) {
                    if (this.MyTextArea)
                        this.MyTextArea.style.width = (cdeNMI.GetSizeFromTile(pValue - 1) - 6) + "px";
                    if (this.MyEditBox)
                        this.MyEditBox.style.width = (cdeNMI.GetSizeFromTile(pValue - 1) - 6) + "px";
                    if (this.MyConfirmBox)
                        this.MyConfirmBox.style.width = (cdeNMI.GetSizeFromTile(pValue - 1) - 6) + "px";
                }
            } else if (pName === "TileFactorY" && this.MyEditBox) {
                this.MyEditBox.style.height = (50 / cde.CInt(pValue)) + "px";
                if (cde.CInt(pValue) > 1) {
                    if (this.MyEditBox && !this.MyEditBox.classList.contains("cdeSmall"))
                        this.MyEditBox.classList.add("cdeSmall");
                    if (this.MyTextArea && !this.MyTextArea.classList.contains("cdeSmall"))
                        this.MyTextArea.classList.add("cdeSmall");
                }
            } else if (pName === "Z-Index" && this.MyCombo) {
                pValue = cde.CInt(pValue);
                this.MyCombo.SetProperty("Z-Index", pValue);
                this.DropButton.SetProperty("Z-Index", pValue);
            } else if (pName === "IsOverlay") {
                if (this.MyTextArea)
                    cdeNMI.SetZIndex(this.MyTextArea, cde.CBool(pValue) ? 1300 : 0);
                if (this.MyEditBox)
                    cdeNMI.SetZIndex(this.MyEditBox, cde.CBool(pValue) ? 1300 : 0);
                if (this.MyConfirmBox)
                    cdeNMI.SetZIndex(this.MyConfirmBox, cde.CBool(pValue) ? 1300 : 0);
                if (this.mMotLoc) {
                    this.ShowHideMTL(pValue);
                }
                if (this.mMotLoc2) {
                    this.ShowHideMTL(pValue, true);
                }
                if (this.DropButton)
                    cdeNMI.SetZIndex(this.DropButton.GetElement(), cde.CBool(pValue) ? 1300 : 0);
                if (this.MyCombo)
                    cdeNMI.SetZIndex(this.MyCombo.GetElement(), cde.CBool(pValue) ? 1300 : 0);
                if (cde.CBool(pValue)) {
                    if (this.EnterButton)
                        this.EnterButton.SetProperty("Visibility", true);
                    if (this.MyEditBox) {
                        cdeNMI.Key27Event = (evt) => this.EditRestore(evt, this.MyEditBox);
                        cdeNMI.Key13Event = (evt) => this.EditElement(evt, this.MyEditBox);
                        if (cdeNMI.MyTouchOverlay)
                            this.MyEditBox.focus();
                    }
                    if (this.MyTextArea) {
                        cdeNMI.Key27Event = (evt) => this.EditRestore(evt, this.MyTextArea);
                        cdeNMI.Key13Event = (evt) => this.EditElement(evt, this.MyTextArea);
                        if (cdeNMI.MyTouchOverlay)
                            this.MyTextArea.focus();
                    }
                    if (this.MyConfirmBox) {
                        cdeNMI.Key27Event = (evt) => this.EditRestore(evt, this.MyConfirmBox);
                        cdeNMI.Key13Event = (evt) => this.EditElement(evt, this.MyConfirmBox);
                    }
                } else {
                    if (!this.MyFieldInfo || (!cde.CBool(this.MyFieldInfo["InTemplate"]) && this.MyFieldInfo.Type !== cdeControlType.ComboOption)) {
                        if (this.MyEditBox)
                            this.MyEditBox.onchange = () => this.EditElement("13", this.MyEditBox);
                        if (this.MyConfirmBox)
                            this.MyConfirmBox.onchange = () => this.EditElement("13", this.MyConfirmBox);
                        if (this.MyTextArea)
                            this.MyTextArea.onchange = () => this.EditElement("13", this.MyTextArea);
                    }
                }
                if (this.EnterButton)
                    cdeNMI.SetZIndex(this.EnterButton.GetElement(), cde.CBool(pValue) ? 1300 : 0);
            } else if (pName === "InnerClassName") {
                if (this.MyEditBox)
                    this.MyEditBox.className = pValue;
                if (this.MyConfirmBox)
                    this.MyConfirmBox.className = pValue;
                if (this.MyTextArea)
                    this.MyTextArea.className = pValue;
            } else if (pName === "InnerStyle") {
                if (this.MyEditBox)
                    this.MyEditBox.style.cssText = pValue;
                if (this.MyConfirmBox)
                    this.MyConfirmBox.style.cssText = pValue;
                if (this.MyTextArea)
                    this.MyTextArea.style.cssText = pValue;
            } else if (pName === "TabIndex") {
                if (this.MyEditBox)
                    this.MyEditBox.tabIndex = pValue;
                if (this.MyConfirmBox)
                    this.MyConfirmBox.tabIndex = pValue;
                if (this.MyTextArea)
                    this.MyTextArea.tabIndex = pValue;
            } else if (pName === "LiveOptions" && this.MyCombo) {
                this.MyCombo.SetProperty(pName, pValue);
            }
            super.SetProperty(pName, pValue);
        }


        ShowHideMTL(pValue: boolean, IsSecond = false) {
            if (cde.CBool(IsSecond) === true) {
                if (this.MyMotLockButton2) {
                    cdeNMI.SetZIndex(this.MyMotLockButton2.GetElement(), cde.CBool(pValue) ? 1300 : 0);
                    this.mMotLoc2.SetProperty("IsOverlay", pValue);
                }
            }
            else {
                cdeNMI.SetZIndex(this.MyMotLockButton.GetElement(), cde.CBool(pValue) ? 1300 : 0);
                this.mMotLoc.SetProperty("IsOverlay", pValue);
            }
        }

        public SetTE(pTE: INMITileEntry) {
            super.SetTE(pTE);
            if (this.MyCombo)
                this.MyCombo.SetTE(pTE);
        }

        EditRestore(pEvent: Event, pEle: HTMLElement) {
            const tModel: cdeNMI.TheScreenInfo = cdeNMI.MyNMIModels[this.MyScreenID];
            cdeNMI.ResetKeyCorder();

            if (this.MyTRF && this.MyTRF.TableName && this.MyTRF.TableName !== "" && tModel) {
                const tFldContent = cdeNMI.GetFldContent(tModel.MyStorageMirror[this.MyTRF.TableName][this.MyTRF.RowNo], this.MyFieldInfo, false, false);
                this.FireEvent(false, "OnValueChanged", pEvent, tFldContent, this.MyTRF);
            }
        }
        EditElement(pEvent, pEle) {
            let chCode;
            if (typeof pEvent === 'string')
                chCode = cde.CInt(pEvent);
            else
                chCode = ('keyCode' in pEvent) ? pEvent.keyCode : pEvent.charCode;
            //cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "KeyCode:HandleEvent", chCode);
            if (chCode === 13) {
                cdeNMI.StopPointerEvents(pEvent);
                this.CheckAndWriteValue(pEle, this.RequiresUpdateButton);
                cdeNMI.ResetKeyCorder();
            } else if (chCode === 27) {
                this.EditRestore(pEvent, pEle);
            } else if (this.JustIn && pEle === this.MyEditBox) {
                this.JustIn = false;
                this.MyEditBox.value = ""; // pEvent.key;
            } else if (this.JustInC && pEle === this.MyConfirmBox) {
                this.JustInC = false;
                this.MyConfirmBox.value = ""; // pEvent.key;
            }
        }

        public CheckAndWriteValue(pEle, pValidateOnly = false) {
            switch (this.MyFieldInfo.Type) {
                case cdeControlType.Number:
                    if (cde.CInt(this.GetProperty("MaxValue")) > 0 && cde.CInt(pEle.value) > cde.CInt(this.GetProperty("MaxValue"))) {
                        cdeNMI.ShowToastMessage("Entry is too High. Max Value=" + cde.CInt(this.GetProperty("MaxValue")));
                        this.SetProperty("iValue", super.GetProperty("Value"));
                        return;
                    }
                    if (cde.CInt(pEle.value) < cde.CInt(this.GetProperty("MinValue"))) {
                        cdeNMI.ShowToastMessage("Entry is too low. Min Value=" + cde.CInt(this.GetProperty("MaxValue")));
                        this.SetProperty("iValue", super.GetProperty("Value"));
                        return;
                    }
                    break;
                case cdeControlType.eMail:
                    if (!cdeNMI.Check4ValidEmail(pEle.value)) {
                        cdeNMI.ShowToastMessage("Entry is not a valid Email Address");
                        this.SetProperty("AddClassName", "cdeValidateError");
                        return;
                    }
                    this.SetProperty("RemoveClassName", "cdeValidateError");
                    break;
                case cdeControlType.IPAddress:
                    if (!cdeNMI.ValidateIPaddress(pEle.value)) {
                        cdeNMI.ShowToastMessage("Entry is not a valid IP-Address");
                        this.SetProperty("AddClassName", "cdeValidateError");
                        return;
                    }
                    this.SetProperty("RemoveClassName", "cdeValidateError");
                    break;
                case cdeControlType.Password:
                    if (this.MyConfirmBox) {
                        if (!cdeNMI.IsSamePassword(this.MyEditBox.value, this.MyConfirmBox.value, true)) {
                            this.SetProperty("AddClassName", "cdeValidateError");
                            if (cdeNMI.MyToast)
                                cdeNMI.MyToast.ShowToastMessage("Passwords are not matching, please update")
                            return;
                        } else if (!cdeNMI.Check4ValidPassword(this.MyEditBox.value)) {
                            this.SetProperty("AddClassName", "cdeValidateError");
                            if (cdeNMI.MyToast)
                                cdeNMI.MyToast.ShowToastMessage("Password is too short or is not strong enough. Must be at least 8 characters")
                            return;
                        }
                        this.SetProperty("RemoveClassName", "cdeValidateError");
                    }
                    break;
                default:
                    {
                        if (!pEle.value || pEle.value.length === 0 || !this.GetProperty("Validator"))
                            break;
                        const ipformat = new RegExp(this.GetProperty("Validator"));
                        if (!pEle.value.match(ipformat)) {
                            let tValText: string = this.GetProperty("ValidateErrorText");
                            if (!tValText)
                                tValText = "Entry does not validate. Please verify your entry";
                            cdeNMI.ShowToastMessage(tValText);
                            this.SetProperty("AddClassName", "cdeValidateError");
                            return;
                        }
                        this.SetProperty("RemoveClassName", "cdeValidateError");
                    }
                    break;
            }
            if (pValidateOnly === true)
                return;
            if (this.MyFieldInfo.Type === cdeControlType.Password && cdeNMI.MyToast) {
                if (this.GetProperty("ReturnClicked"))
                    this.GetProperty("ReturnClicked")();
                else
                    cdeNMI.MyToast.ShowToastMessage("Password was set successfully");
            }

            this.IsDirty = true;
            this.FireEvent(false, "OnValueChanged", "CheckAndWriteValue", pEle.value, this.MyTRF);
            this.FireEvent(false, "OnPropertyChanged", "CheckAndWriteValue", pEle.value, "Value");
        }

        public ApplySkin() {
            if (this.MyFieldInfo &&
                ((this.MyFieldInfo.Type === cdeControlType.Password && !cde.CBool(this.GetProperty("HideMTL"))) || this.MyFieldInfo.Type === cdeControlType.ComboOption)) {
                if (this.MyTextArea && this.MyTextArea.parentElement && this.MyTextArea.parentElement.clientWidth > 0)
                    this.MyTextArea.style.width = this.MyTextArea.parentElement.clientWidth - (cdeNMI.GetSizeFromTile(1) + 6) + "px";
                if (this.MyEditBox && this.MyEditBox.parentElement && this.MyEditBox.parentElement.clientWidth > 0)
                    this.MyEditBox.style.width = this.MyEditBox.parentElement.clientWidth - (cdeNMI.GetSizeFromTile(1) + 6) + "px";
                if (this.MyConfirmBox)
                    this.MyConfirmBox.style.width = this.MyConfirmBox.parentElement.clientWidth - (cdeNMI.GetSizeFromTile(1) + 6) + "px";
            }
        }

        GetProperty(pName: string) {
            if (pName === "Value") {
                if (this.MyEditBox)
                    return this.MyEditBox.value;
                else if (this.MyTextArea)
                    return this.MyTextArea.value;
            }
            return super.GetProperty(pName);
        }

        //Backwards Conpat

        static Create(pTargetControl: cdeNMI.INMIControl, pScreenID: string, pTRF: TheTRF, pContent?: string, pShowOverlay?: boolean, pClassName?: string): ctrlEditBox {
            const tTile: ctrlEditBox = new ctrlEditBox(pTRF);
            tTile.InitControl(pTargetControl, pTRF, null, pScreenID);

            if (pContent)
                tTile.SetProperty("iValue", pContent);
            if (cde.CBool(pShowOverlay))
                tTile.SetProperty("IsOverlay", true);
            else
                tTile.SetProperty("IsOverlay", false);
            if (pClassName)
                tTile.SetProperty("InnerClassName", pClassName);
            return tTile;
        }
    }
}