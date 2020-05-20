// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {
    /////////////////////////////////////////////////////////////
    /// NMI HTML5 Controls
    /////////////////////////////////////////////////////////////

    /** 
    Base NMI Control ALL controls inherit from
    */
    export class TheNMIBaseControl extends cde.TheThing implements INMIControl {
        constructor(pTarget?: INMIControl, pTRF?: TheTRF) {
            super();
            this.MyDataItems = [];
            this.PropertyBag = [];
            if (pTarget) {
                this.MyTarget = pTarget;
                this.MyFormID = pTarget.MyFormID;
            }
            this.MyTRF = pTRF;
            if (pTRF) {
                this.MyFieldInfo = pTRF.FldInfo;
                if (pTRF.FldInfo)
                    this.PropertyBag["ID"] = cde.GuidToString(pTRF.FldInfo.cdeMID);
                else
                    this.PropertyBag["ID"] = "CNMIC" + cdeNMI.MyNMISettings.IDCounter++;
                if (pTRF.FldInfo && !this.MyFormID)
                    this.MyFormID = pTRF.FldInfo.FormID;
            }
            else
                this.PropertyBag["ID"] = "CNMIC" + cdeNMI.MyNMISettings.IDCounter++;
            this.PropertyBag["Disabled"] = false;
            this.PropertyBag["TouchPoints"] = 0;
            this.PreventManipulation = false;
            this.PropertyBag["AreEventsHooked"] = false;

            return;
        }

        public MyTarget: INMIControl = null;  //The parent Control
        public MyParentCtrl: INMIControl = null; //The surrounding Tile Entry Control
        public MyDataView: INMIDataView = null; //The owning Form/Table (DataView)
        public MyNMIControl: INMIControl = null; //First SubControl
        public MyTE: INMITileEntry = null; /// ctrlTileEntry = null;      //If the control is inside a TE the instance of the TE is found here - V4.107: Any control can be container of another control
        public MyBaseType: cdeControlType = cdeControlType.BaseControl; //cdeControl Type of the control
        public MyScreenID: string = null;       //The Screen ID (Model) Associated with the Control
        public MyFormID: string = null;         //Form that contains the Control
        public MyEngineName: string = null;     //The Plugin (Engine) associated with the control
        public MyRootElement: HTMLElement;      //The Root HTML Element of the Control
        public MyContainerElement: HTMLElement; //If the control can be used as a container for another control, this is the element where the child(ren) will be appended to
        public MyTRF: TheTRF = null;            //TheTRF (Table Row Field) definition of the Control
        public MyFieldInfo: TheFieldInfo = null;    //TheFieldInfo of the Control
        public TouchPoints = 0;
        public PreventManipulation = false;
        public PreventDefault = false;
        public Visibility = true;
        public IsDisabled = false;
        public Is3DObject = false;
        public IsDirty = false;
        public HasFacePlate = false;
        public MyWidth = 0;
        public MyHeight = 0;
        public MyDataItems: [];
        private lastXYById: ThePointer[] = [];
        public MyChildren: INMIControl[] = [];
        public MySubControls: Array<TheControlBlock> = [];
        public MyRC: number;
        mOldClassName: string;

        public SetTRF(pTRF?: TheTRF, pPropertyBag?: string[]) {
            if (pTRF) {
                this.MyTRF = pTRF;
                if (pTRF.FldInfo) {
                    this.MyFieldInfo = pTRF.FldInfo;
                    if (this.MyFieldInfo.FormID)
                        this.MyFormID = this.MyFieldInfo.FormID;
                    ThePB.ConvertPropertiesFromBag(this.MyFieldInfo, pPropertyBag);
                }
            } else {
                if (!this.MyFieldInfo && pPropertyBag) {
                    this.MyFieldInfo = new TheFieldInfo(this.MyBaseType);
                    this.MyTRF = new TheTRF("", 0, this.MyFieldInfo);
                    ThePB.ConvertPropertiesFromBag(this.MyFieldInfo, pPropertyBag);
                }
            }
        }

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            if (pTargetControl) {
                this.MyTarget = pTargetControl;
                this.MyTarget.MyChildren.push(this);
            }
            this.SetTRF(pTRF, pPropertyBag);
            if (pScreenID)
                this.MyScreenID = cde.GuidToString(pScreenID);
            if (!this.MyFormID && pTargetControl)
                this.MyFormID = pTargetControl.MyFormID;

            this.RegisterEvent("NMI_SHAPE_RECOGNIZED", (pSend: INMIControl, pName: string, pScore: number) => { this.eventShapeRecognized(pSend, pName, pScore); });
            return true;
        }

        public eventShapeRecognized(sender: INMIControl, pName: string, pScore: number) {
            if (!cde.MyBaseAssets.MyServiceHostInfo.RedPill)
                return;
            //TODO: New Feature: Control Updates and new controls
            if (pScore > 1) {
                cdeNMI.ShowToastMessage("Name: " + pName + " Score:" + pScore.toFixed(2));
                if (cde.MyEventLogger)
                    cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "ShapeRecognizer", "Name: " + pName + " Score:" + pScore.toFixed(2));
                switch (pName) {
                    case "circle":
                    case "rightmouse": {
                        //TODO: Send Properties of control to NMI Editor
                        this.SetProperty("Background", "pink");
                        const tSideBar = document.getElementById("cdeSideBarRight") as HTMLDivElement;
                        if (tSideBar && !tSideBar.classList.contains("cde-animate-right")) {
                            tSideBar.classList.add("cde-animate-right");
                            tSideBar.style.display = '';
                        }
                        break;
                    }
                }
            } else {
                cdeNMI.ShowToastMessage("Guess is : " + pName + " but Score too low:" + pScore.toFixed(2));
            }
        }

        public SetProperty(pName: string, pValue) {
            if (pName === "PreventManipulation") {
                if (typeof pValue === "undefined" || cde.CBool(pValue)) {
                    pValue = true;
                }
                this.PreventManipulation = pValue;
                return;
            }
            if (pName === "PreventDefault" || pName === "EnableMT") {
                if (typeof pValue === "undefined" || cde.CBool(pValue)) {
                    pValue = true;
                }
                this.PreventDefault = pValue;
                return;
            }

            let tOldValue = this.PropertyBag[pName];

            if (pName === "iValue") {
                tOldValue = this.PropertyBag["Value"];
                this.PropertyBag["Value"] = pValue;
                if (pValue !== tOldValue) {
                    this.FireEvent(false, "OniValueChanged", "SetProperty", pValue, pName);
                }
                return;
            }
            else
                this.PropertyBag[pName] = pValue;

            if (pName === "OnThingEvent") {
                this.RegisterSetP((pControl: cdeNMI.INMIControl, pMsg: cde.TheProcessMessage) => {
                    if (pMsg.Message.TXT.substr(0, 4) === "SETP" || pMsg.Message.TXT.substr(0, 5) === "SETFP") {  //ThingProperties only
                        const tProps: string[] = pMsg.Message.PLS.split(":;:");
                        for (let i = 0; i < tProps.length; i++) {
                            const pos: number = tProps[i].indexOf("=");
                            let tPropName = "";
                            let tPropValue: any=true;
                            if (pos < 0) {
                                tPropName = tProps[i];
                                tPropValue = true;
                            } else {
                                if (pos > 0 && pos < tProps[i].length) {
                                    tPropName = tProps[i].substr(0, pos);
                                    if (pos < tProps[i].length + 1)
                                        tPropValue = tProps[i].substr(pos + 1);
                                    if (tPropName.substr(0, 11) === "&^CDESP1^&:")
                                        continue;
                                }
                            }
                            if (tPropName.length > 0) {
                                if (tPropName === pControl.GetProperty("OnThingEvent")) {
                                    pControl.SetProperty("iValue", tPropValue);
                                    if (pControl.MyTRF && (pControl.MyTRF.ModelID || pControl.MyScreenID)) {
                                        const tModel: cdeNMI.TheScreenInfo = cdeNMI.MyNMIModels[pControl.MyTRF.ModelID ? pControl.MyTRF.ModelID : pControl.MyScreenID];
                                        if (tModel && tModel.MyStorageMirror[pControl.MyTRF.TableName])
                                            cdeNMI.UpdFldContent(tModel.MyStorageMirror[pControl.MyTRF.TableName][pControl.MyTRF.RowNo], pControl.MyFieldInfo, tPropValue, null);
                                    } else {
                                        const tCtrl: INMIControl = pControl.MyNMIControl;
                                        if (tCtrl && tCtrl.MyTRF && tCtrl.MyScreenID) {
                                            const tIModel: cdeNMI.TheScreenInfo = cdeNMI.MyNMIModels[tCtrl.MyScreenID];
                                            if (tIModel && tIModel.MyStorageMirror[tCtrl.MyTRF.TableName])
                                                cdeNMI.UpdFldContent(tIModel.MyStorageMirror[tCtrl.MyTRF.TableName][tCtrl.MyTRF.RowNo], tCtrl.MyFieldInfo, tPropValue, null);
                                        }
                                    }
                                    this.FireEvent(true, "OnPropertyChanged", "SetProperty", tPropValue, "iValue");
                                }
                            }
                        }
                    }
                });
            }

            if (pName === "OniValueChanged") {
                this.RegisterEvent("OniValueChanged", pValue);
                this.FireEvent(true, "OniValueChanged", "SetProperty", this.PropertyBag["Value"], "Value");
            } else if (pName === "OnValueChanged") {
                this.RegisterEvent("OnValueChanged", pValue);
                return;
            } else if (pName === "OnPropertyChanged") {
                this.RegisterEvent("OnPropertyChanged", pValue);
                return;
            } else if (pName === "OnPropertySet") {
                this.RegisterEvent("OnPropertySet", pValue);
                return;
            } else if (pName === "RegisterEvent") {
                const tPara: string[] = pValue.split(":;:");
                if (tPara.length > 1) {
                    this.RegisterEvent(tPara[0], tPara[1]);
                }
            } else if (pName === "Value") {
                if (pValue !== tOldValue) {
                    this.IsDirty = true;
                    this.FireEvent(true, "OnValueChanged", "SetProperty", pValue, this.MyTRF);
                    this.FireEvent(true, "OniValueChanged", "SetProperty", pValue, pName);
                }
            } else if (pName === "Visibility" && this.MyRootElement) {
                pValue = cde.CBool(pValue);
                this.Visibility = pValue;
                if (typeof pValue === "undefined" || pValue) {
                    this.MyRootElement.style.display = '';
                    this.OnLoad();
                }
                else {
                    this.MyRootElement.style.display = 'none';
                    this.OnUnload();
                }
            } else if (pName === "IsOwnerDown") {
                if (pValue === true) {
                    if (this.GetProperty(pName) === true)
                        return;
                    this.mOldClassName = this.MyRootElement.className;
                    this.MyRootElement.className += " cdeNodeGone";
                }
                else {
                    if (this.GetProperty(pName) !== true)
                        return;
                    this.MyRootElement.className = this.mOldClassName;
                }
            } else if (pName === "Disabled" && this.MyRootElement) {
                this.IsDisabled = cde.CBool(pValue);
                if (this.IsDisabled) {
                    this.MyRootElement.style.opacity = "0.5";
                }
                else {
                    this.MyRootElement.style.opacity = "1.0";
                }
            } else if (pName === "Draggable") {
                this.MyRootElement.draggable = cde.CBool(pValue);
            } else if (pName === "TID") {
                this.PropertyBag["ID"] = pValue; //Set ID to ThingID without setting root ID of the field - required for table updates
            } else if ((pName === "ID" || pName === "MID") && pValue && this.MyRootElement) {
                this.MyRootElement.id = cde.GuidToString(pValue);
                this.PropertyBag["ID"] = pValue; //TODO: TEST table Update scenarios
            } else if (pName === "ClassName" && (pValue || pValue === "") && this.MyRootElement) {
                this.MyRootElement.className = pValue;
            } else if (pName === "AddClassName" && (pValue || pValue === "") && this.MyRootElement) {
                if (!this.MyRootElement.classList.contains(pValue))
                    this.MyRootElement.classList.add(pValue);
            } else if (pName === "RemoveClassName" && (pValue || pValue === "") && this.MyRootElement) {
                if (this.MyRootElement.classList.contains(pValue))
                    this.MyRootElement.classList.remove(pValue);
            } else if (pName === "TEClassName" && (pValue || pValue === "")) {
                if (this.MyTE && this.MyTE.MyNMIControl)
                    this.MyTE.MyNMIControl.SetProperty("ClassName", pValue);
            } else if (pName === "Display" && pValue && this.MyRootElement) {
                this.MyRootElement.style.display = pValue;
            } else if (pName === "Style" && pValue && this.MyRootElement) {
                this.MyRootElement.style.cssText += pValue;
            } else if (pName === "Opacity" && this.MyRootElement) {
                this.MyRootElement.style.opacity = pValue;
            } else if (pName === "HorizontalAlignment" && this.MyRootElement) {
                this.MyRootElement.style.textAlign = pValue.toLowerCase();
            } else if (pName === "VerticalAlignment" && this.MyRootElement) {
                this.MyRootElement.style.verticalAlign = pValue.toLowerCase();
            } else if (pName === "Float" && this.MyRootElement) {
                this.MyRootElement.style.cssFloat = pValue;
            } else if (pName === "FontSize" && this.MyRootElement) {
                this.MyRootElement.style.fontSize = pValue + "px";
            } else if (pName === "Margin" && this.MyRootElement) {
                this.MyRootElement.style.margin = pValue + "px";
            } else if (pName === "Z-Index" && this.MyRootElement) {
                //this.MyRootElement.style.position = "relative";       //V4.107: Why?????
                this.MyRootElement.style.zIndex = pValue.toString();
            } else if (pName === "PixelWidth" && this.MyRootElement) {
                if (pValue) {
                    if (pValue.toString().endsWith("px") || pValue.toString().endsWith("%") || pValue === "auto")
                        this.MyRootElement.style.width = pValue;
                    else
                        this.MyRootElement.style.width = pValue + "px";
                }
            } else if (pName === "PixelHeight" && this.MyRootElement) {
                if (pValue) {
                    if (pValue.toString().endsWith("px") || pValue.toString().endsWith("%") || pValue === "auto")
                        this.MyRootElement.style.height = pValue;
                    else
                        this.MyRootElement.style.height = pValue + "px";
                }
            } else if (pName === "TileFactorX" && this.MyRootElement) {
                this.SetInitialWidth(1);
            } else if (pName === "TileFactorY" && this.MyRootElement) {
                this.SetInitialHeight(1);
            } else if (pName === "TileWidth" && this.MyRootElement) {
                pValue = cde.CInt(pValue);
                if (pValue === 0) pValue = 1;
                const tScrolRes = 0;
                this.SetWidth(this.MyRootElement, pValue, this.MyBaseType === cdeNMI.cdeControlType.Screen ? tScrolRes : (this.MyBaseType === cdeNMI.cdeControlType.TileEntry ? 0 : 1));
                //this.MyRootElement.style.width = cdeNMI.GetSizeFromTile(pValue).toString() + "px";
            } else if (pName === "TileHeight" && this.MyRootElement) {
                pValue = cde.CInt(pValue);
                if (pValue < 0)
                    this.MyRootElement.style.height = "inherit";
                else {
                    if (pValue < 1) pValue = 1;
                    this.SetHeight(this.MyRootElement, pValue, this.MyBaseType === cdeNMI.cdeControlType.Screen ? 0 : (this.MyBaseType === cdeNMI.cdeControlType.TileEntry ? 0 : 1));
                    //this.MyRootElement.style.height = cdeNMI.GetSizeFromTile(pValue).toString() + "px";
                }
            } else if (pName === "MaxTileWidth" && this.MyRootElement) {
                pValue = cde.CInt(pValue);
                let tMaxWid: number = cdeNMI.GetSizeFromTile(pValue);
                if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform !== 1 && this.MyBaseType === cdeNMI.cdeControlType.CollapsibleGroup && this.MyFieldInfo && this.MyFieldInfo.FldOrder === 1 && cde.CBool(this.GetProperty("UseMargin")) === true) {
                    const tSegments: number = Math.floor(pValue / 6);
                    if (tSegments > 0)
                        tMaxWid += GetSizeFromTile(tSegments) / 2;
                }
                if (cdeNMI.MyScreenManager && cdeNMI.MyScreenManager.DocumentWidth > 0 && tMaxWid > cdeNMI.MyScreenManager.DocumentWidth)
                    tMaxWid = cdeNMI.MyScreenManager.DocumentWidth - (GetSizeFromTile(1));
                this.MyRootElement.style.maxWidth = tMaxWid + "px";
            } else if (pName === "BackgroundImage" && this.MyRootElement) {
                if (pValue.substr(0, 1) === "{") {
                    let tPlanar: cdeNMI.ThePlanarImage = null;
                    tPlanar = JSON.parse(pValue);
                    this.MyRootElement.style.backgroundImage = "url('data:image/jpeg;base64," + tPlanar.Bits + "')";
                } else {
                    this.MyRootElement.style.backgroundImage = "url('" + pValue + "')";
                }
            } else if (pName === "TileLeft" && this.MyRootElement) {
                pValue = cde.CInt(pValue);
                this.MyRootElement.style.left = ((cdeNMI.GetSizeFromTile(1) * pValue) + (cdeNMI.MyNMISettings.TileMargin * ((pValue * 2) + 1))).toString() + "px";
            } else if (pName === "TileTop" && this.MyRootElement) {
                pValue = cde.CInt(pValue);
                this.MyRootElement.style.top = ((cdeNMI.GetSizeFromTile(1) * pValue) + (cdeNMI.MyNMISettings.TileMargin * ((pValue * 2) + 1))).toString() + "px";
            } else if (pName === "Top" && this.MyRootElement) {
                pValue = cde.CInt(pValue);
                this.MyRootElement.style.top = pValue.toString() + "px";
            } else if (pName === "Left" && this.MyRootElement) {
                pValue = cde.CInt(pValue);
                this.MyRootElement.style.left = pValue.toString() + "px";
            } else if (pName === "Right" && this.MyRootElement) {
                pValue = cde.CInt(pValue);
                this.MyRootElement.style.right = pValue.toString() + "px";
            } else if (pName === "IsAbsolute" && this.MyRootElement) {
                if (cde.CBool(pValue)) {
                    this.MyRootElement.style.position = "absolute";
                }
                else
                    this.MyRootElement.style.position = "relative";
            } else if (pName === "IsHitTestDisabled" && this.MyRootElement) {
                if (cde.CBool(pValue))
                    this.MyRootElement.style.pointerEvents = 'none';
                else
                    this.MyRootElement.style.pointerEvents = '';
            } else if (pName === "NUITags" && pValue && cdeNMI.MyEngine) {
                const t: string[] = pValue.toString().split(';');
                for (let i = 0; i < t.length; i++)
                    cdeNMI.MyNMINUITags[t[i]] = this;
            } else if (pName === "EngineName" && pValue && pValue !== "") {
                this.MyEngineName = pValue;
            }

            if (pValue !== tOldValue) {
                this.FireEvent(true, "OnPropertyChanged", "SetProperty", pValue, pName);
                const tS: cdeNMI.TheControlBlock = this.GetProperty(pName + "_TCB");
                if (tS) {
                    const tSpan: HTMLSpanElement = document.getElementById(tS.TargetID);
                    if (tSpan) {
                        tSpan.innerHTML = pValue;
                    }
                }
            }
            this.FireEvent(true, "OnPropertySet", "SetProperty", pValue, pName);
        }

        public SetToDefault(bOnlyIfEmpty: boolean) {
            if (bOnlyIfEmpty && !cde.IsNotSet(this.GetProperty("Value")))
                return null;
            if (this.MyFieldInfo && this.MyFieldInfo["DefaultValue"]) {
                this.SetProperty("iValue", this.MyFieldInfo["DefaultValue"]);
                return this.MyFieldInfo["DefaultValue"];
            }
            else {
                this.SetProperty("iValue", null);
            }
            return null;
        }

        public toJSON() {
            const myarray = [];
            const propertyBag = this.PropertyBag;
            for (const tID in propertyBag) {
                if (propertyBag.hasOwnProperty(tID)) {
                    const item = {
                        "N": tID,
                        "V": propertyBag[tID]
                    };
                    myarray.push(item);
                }
            }
            const t = {
                "PropertyBag": myarray,
                "ScreenID": this.MyScreenID,
                "TRF": this.MyTRF,
                "EngineName": this.MyEngineName,
                "BaseType": this.MyBaseType,
                "FieldInfo": this.MyFieldInfo
            };
            return t;
        }

        /**
            Registers an event on the current Control derived from The NMIBaseControl
        */
        public RegisterIncomingMessage(pEngineName: string, eventHandler) {
            const tID: string = this.RegisterNMIControl();
            this.MyEngineName = pEngineName;
            if (cdeNMI.MyEngine)
                cdeNMI.MyEngine.RegisterIncomingMsg(this, tID, pEngineName);
            this.RegisterEvent("IncomingMessage", eventHandler);
        }

        public RegisterNMIControl(): string {
            let tOWN: string = this.GetProperty("UXID");
            if (!tOWN) {
                if (this.MyFieldInfo && this.MyFieldInfo.cdeMID)
                    tOWN = this.MyFieldInfo.cdeMID;
                else
                    return null;
            }
            tOWN = cde.GuidToString(tOWN);
            const tID: string = cde.GuidToString(this.GetProperty("ID"));
            if (cdeNMI.MyTCF) {
                cdeNMI.MyTCF.RegisterControl(tOWN, tID, this);
                //if (!cdeNMI.MyTCF.MyNMIControls[tOWN])
                //    cdeNMI.MyTCF.MyNMIControls[tOWN] = [];
                //cdeNMI.MyTCF.MyNMIControls[tOWN][tID] = this;
            }
            return tID;
        }

        public RegisterThingSetP(pOWN: string, pName: string) {
            const tOWN: string = cde.GuidToString(pOWN);
            const tID: string = cde.GuidToString(this.GetProperty("ID"));
            this.SetProperty("MyThing", tOWN);
            if (!cdeNMI.MyNMIThingEvents[tOWN])
                cdeNMI.MyNMIThingEvents[tOWN] = [];
            cdeNMI.MyNMIThingEvents[tOWN][tID] = this;
            this.SetProperty("OnThingEvent", pName);
        }

        public RegisterSetP(eventHandler) {
            this.RegisterNMIControl();
            this.RegisterEvent("SETP", eventHandler);   //ThingProperties:SETP
        }

        public WasClicked = false;

        public Create(pTargetControl: INMIControl, pOptions?: TheNMIC): INMIControl {
            try {
                if (pOptions) {
                    if (pOptions.Cookie)
                        this.SetProperty("Cookie", pOptions.Cookie);
                    this.InitControl(pTargetControl, pOptions.TRF, pOptions.PreInitBag, pOptions.ScreenID);
                    if (pOptions.PostInitBag) {
                        ThePB.SetPropertiesFromBag(this, pOptions.PostInitBag);
                    }
                }
                else {
                    this.InitControl(pTargetControl);
                }
            }
            catch (exe) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "BaseControl:Create", "Failed with Exception:" + exe);
                return null;
            }
            return this;
        }

        public SetTE(pTE: INMITileEntry) {
            this.MyTE = pTE;
        }
        public GetTE(): INMITileEntry {
            return this.MyTE;
        }

        public ReloadData(): boolean {
            return false;
        }

        public ToggleDrop(doClose: boolean, doForce: boolean) {
            //overrride if required
        }

        public SetElement(pRootControl: HTMLElement, pHookEvents?: boolean, pContainerElement?: HTMLElement, NoFireOnLoad?: boolean) {
            if (pRootControl)
                this.MyRootElement = pRootControl;
            else {
                if (this.MyTarget)
                    this.MyRootElement = this.MyTarget.GetContainerElement();
            }
            if (pContainerElement) {
                this.MyContainerElement = pContainerElement;
            }
            if (this.MyTarget && this.MyTarget.GetContainerElement() && this.MyTarget.GetContainerElement() !== this.MyRootElement) {
                this.MyTarget.AppendElement(pRootControl);
            }
            if (pHookEvents && this.GetSetting("Disabled") !== true) {
                this.HookEvents(false);
            }
            if (this.MyFieldInfo && cde.CBool(NoFireOnLoad) !== true) {
                if (this.GetSetting("OnLoaded") && cdeNMI.MyEngine) {   //OnLoaded OK
                    cdeNMI.MyEngine.PublishToNMI("NMI_FLD_LOADED:" + this.MyFieldInfo.cdeMID, this.GetSetting("OnLoaded"), this.cdeN);  //OnLoaded OK
                }
            }
        }

        public DeleteControl(tControl: INMIControl) {
            if (!tControl) return;

            if (this.GetContainerElement() && tControl.GetContainerElement().parentElement === this.MyRootElement)
                this.GetContainerElement().removeChild(tControl.GetElement());
        }

        public AppendChild(pChild: INMIControl) {
            if (pChild && this.GetContainerElement())
                this.GetContainerElement().appendChild(pChild.GetElement());
        }

        public RemoveChild(pChild: INMIControl) {
            if (pChild) {
                this.GetContainerElement().removeChild(pChild.GetElement());
            }
        }


        public AppendElement(pEle: HTMLElement) {
            this.GetContainerElement().appendChild(pEle);
        }

        public HookEvents(bDoCapture: boolean) {
            if (this.PropertyBag["AreEventsHooked"] === true)
                return;
            this.PropertyBag["AreEventsHooked"] = true;

            this.MyRootElement.addEventListener("selectstart", (e) => { cdeNMI.StopPointerEvents(e); }, bDoCapture);
            this.MyRootElement.addEventListener("contextmenu", (e) => { cdeNMI.StopPointerEvents(e); }, bDoCapture);
            this.MyRootElement.addEventListener("MSHoldVisual", (e) => { cdeNMI.StopPointerEvents(e); }, bDoCapture);

            this.MyRootElement.addEventListener("keyup", (evt) => this.sinkDoKey(evt), bDoCapture);
            this.MyRootElement.addEventListener("keydown", (evt) => this.sinkDoKey(evt), bDoCapture);

            if (cdeNMI.MyNMISettings.SupportsPointer) {
                //  W3C pointer model = IE11
                this.MyRootElement.addEventListener("pointerdown", (evt) => this.sinkDoEvent(evt), bDoCapture);
                this.MyRootElement.addEventListener("pointermove", (evt) => this.sinkDoEvent(evt), bDoCapture);
                this.MyRootElement.addEventListener("pointerup", (evt) => this.sinkDoEvent(evt), bDoCapture);
                this.MyRootElement.addEventListener("pointercancel", (evt) => this.sinkDoEvent(evt), bDoCapture);
                if (this.PropertyBag["IsPointerOutAllowed"] !== true) {
                    this.MyRootElement.addEventListener("pointerout", (evt) => this.sinkDoEvent(evt), bDoCapture);
                }
            } else if (window.navigator.msPointerEnabled) {
                //  Microsoft pointer model = IE10
                this.MyRootElement.addEventListener("MSPointerDown", (evt) => this.sinkDoEvent(evt), bDoCapture);
                this.MyRootElement.addEventListener("MSPointerMove", (evt) => this.sinkDoEvent(evt), bDoCapture);
                this.MyRootElement.addEventListener("MSPointerUp", (evt) => this.sinkDoEvent(evt), bDoCapture);
                this.MyRootElement.addEventListener("MSPointerCancel", (evt) => this.sinkDoEvent(evt), bDoCapture);
                if (this.PropertyBag["IsPointerOutAllowed"] !== true) {
                    this.MyRootElement.addEventListener("MSPointerOut", (evt) => this.sinkDoEvent(evt), bDoCapture);
                }
            }
            else if (this.MyRootElement.addEventListener) {
                //  iOS touch model
                this.MyRootElement.addEventListener("touchstart", (evt) => this.sinkDoEvent(evt), bDoCapture);
                this.MyRootElement.addEventListener("touchmove", (evt) => this.sinkDoEvent(evt), bDoCapture);
                this.MyRootElement.addEventListener("touchend", (evt) => this.sinkDoEvent(evt), bDoCapture);
                this.MyRootElement.addEventListener("touchcancel", (evt) => this.sinkDoEvent(evt), bDoCapture);
                //  mouse model
                this.MyRootElement.addEventListener("mousedown", (evt) => this.sinkDoEvent(evt), bDoCapture);
                this.MyRootElement.addEventListener("mousemove", (evt) => this.sinkDoEvent(evt), bDoCapture);
                this.MyRootElement.addEventListener("mouseup", (evt) => this.sinkDoEvent(evt), bDoCapture);
                if (this.PropertyBag["IsPointerOutAllowed"] !== true) {
                    this.MyRootElement.addEventListener("mouseleave", (evt) => this.sinkDoEvent(evt), bDoCapture);
                }
            }
        }

        public PreventDefaultManipulationAndMouseEvent(evtObj) {
            let MyControlstyle: CSSStyleDeclaration;
            if (this.PreventDefault) {
                cdeNMI.StopPointerEvents(evtObj);
                //if (typeof this.MyRootElement.style.msContentZooming !== 'undefined')
                //    this.MyRootElement.style.msContentZooming = "none";
                //if (typeof this.MyRootElement.style.msTouchAction !== 'undefined')
                //    this.MyRootElement.style.msTouchAction = "none";
                MyControlstyle = this.MyRootElement.style;
                MyControlstyle.touchAction = "none";
            }
            else {
                //if (typeof this.MyRootElement.style.msContentZooming !== 'undefined')
                //    this.MyRootElement.style.msContentZooming = "zoom";
                //if (typeof this.MyRootElement.style.msTouchAction !== 'undefined')
                //    this.MyRootElement.style.msTouchAction = "auto";
                MyControlstyle = this.MyRootElement.style;
                MyControlstyle.touchAction = "auto";
            }

            if (evtObj && this.PreventManipulation) {
                if (evtObj.preventManipulation)
                    evtObj.preventManipulation();

                if (evtObj.preventMouseEvent)
                    evtObj.preventMouseEvent();
            }
        }

        public static GetControlXY(o) {
            let z = o, x = 0, y = 0, c;
            while (z && !isNaN(z.offsetLeft) && !isNaN(z.offsetTop)) {
                const anyWindow: any = window;
                c = anyWindow.globalStorage ? null : window.getComputedStyle(z, null);
                x += z.offsetLeft - z.scrollLeft + (c ? parseInt(c.getPropertyValue('border-left-width'), 10) : 0);
                y += z.offsetTop - z.scrollTop + (c ? parseInt(c.getPropertyValue('border-top-width'), 10) : 0);
                z = z.offsetParent;
            }
            return { x: o.X = x, y: o.Y = y };
        }

        public static findPos(obj, foundScrollLeft, foundScrollTop) {
            let curleft = 0;
            let curtop = 0;
            if (obj.offsetLeft) curleft += parseInt(obj.offsetLeft);
            if (obj.offsetTop) curtop += parseInt(obj.offsetTop);
            if (obj.scrollTop && obj.scrollTop > 0) {
                curtop -= parseInt(obj.scrollTop);
                foundScrollTop = true;
            }
            if (obj.scrollLeft && obj.scrollLeft > 0) {
                curleft -= parseInt(obj.scrollLeft);
                foundScrollLeft = true;
            }
            let pos: { x: number; y: number };
            if (obj.offsetParent) {
                pos = TheNMIBaseControl.findPos(obj.offsetParent, foundScrollLeft, foundScrollTop);
                curleft += pos.x;
                curtop += pos.y;
            } else if (obj.ownerDocument) {
                let thewindow = obj.ownerDocument.defaultView;
                if (!thewindow && obj.ownerDocument.parentWindow)
                    thewindow = obj.ownerDocument.parentWindow;
                if (thewindow) {
                    if (!foundScrollTop && thewindow.scrollY && thewindow.scrollY > 0) curtop -= parseInt(thewindow.scrollY);
                    if (!foundScrollLeft && thewindow.scrollX && thewindow.scrollX > 0) curleft -= parseInt(thewindow.scrollX);
                    if (thewindow.frameElement) {
                        pos = TheNMIBaseControl.findPos(thewindow.frameElement, 0, 0);
                        curleft += pos.x;
                        curtop += pos.y;
                    }
                }
            }

            return { x: curleft, y: curtop };
        }

        EnsurePageXY(eventObj) {
            if (typeof eventObj.pageX === 'undefined') {
                const tDoc: TheDrawingPoint = ThePointer.ComputeDocumentToElementDelta(this.MyRootElement);
                eventObj.pageX = eventObj.offsetX + tDoc.x;
                eventObj.pageY = eventObj.offsetY + tDoc.y;
            }
        }

        private GetTouchPointer(pID: number): ThePointer {
            const lastXyById = this.lastXYById;
            for (const index in lastXyById) {
                if (lastXyById.hasOwnProperty(index)) {
                    if (lastXyById[index] && lastXyById[index].Identifier === pID)
                        return lastXyById[index];
                }
            }
            return null;
        }
        private GetTouchPointerIdx(pID: number): number {
            const lastXyById = this.lastXYById;
            for (const index in lastXyById) {
                if (lastXyById.hasOwnProperty(index)) {
                    if (lastXyById[index] && lastXyById[index].Identifier === pID)
                        return parseInt(index);
                }
            }
            return -1;
        }

        private sinkDoKey(pKeyEvt: KeyboardEvent) {
            switch (pKeyEvt.type) {
                case "keyup":
                    this.FireEvent(true, "KeyUp", pKeyEvt);
                    break;
                case "keydown":
                    this.FireEvent(true, "KeyDown", pKeyEvt);
                    break;
            }
        }

        private sinkDoEvent(pEvtObj: Event) {
            if (cde.CBool(this.GetProperty("IsHitTestDisabled")) || cde.CBool(this.GetProperty("IsUnhooked")))
                return;

            if (pEvtObj.type === "mousemove" && this.lastXYById.length === 0 && !cde.CBool(this.GetProperty("AllowMoveWithoutDown")))
                return;

            const IsTouchDown: boolean = pEvtObj.type.match(/(start|down)$/i) !== null;
            const IsTouchMove: boolean = pEvtObj.type.match(/move$/i) !== null;
            const IsTouchEnd: boolean = pEvtObj.type.match(/(up|end|cancel|out|leave)$/i) !== null;
            const IsTouchCancel: boolean = pEvtObj.type.match(/(cancel|out|leave)$/i) !== null;

            if (IsTouchDown && (pEvtObj as any).buttons === 1) {
                cdeNMI.IsMouseDown = true;
            }
            if (IsTouchEnd && (pEvtObj as any).buttons === 0) {
                cdeNMI.IsMouseDown = false;
            }

            let tEvtType: cdeInputEvent = cdeInputEvent.IDLE;
            if (IsTouchDown)
                tEvtType = cdeInputEvent.START;
            else if (IsTouchMove)
                tEvtType = cdeInputEvent.MOVE;
            else
                tEvtType = cdeInputEvent.END;

            if (this.PreventManipulation || this.PreventDefault) //IsTouchDown
                this.PreventDefaultManipulationAndMouseEvent(pEvtObj);

            const pointerList = (pEvtObj as any).changedTouches ? (pEvtObj as any).changedTouches : [pEvtObj];

            let tPS: number = this.lastXYById.length;
            if (IsTouchDown)
                tPS += pointerList.length;
            this.TouchPoints = tPS;

            for (let i = 0; i < pointerList.length; ++i) {
                const pointerObj: any = pointerList[i];
                const pointerId: number = (typeof pointerObj.identifier !== 'undefined') ? pointerObj.identifier : (typeof pointerObj.pointerId !== 'undefined') ? pointerObj.pointerId : 1;
                this.EnsurePageXY(pointerObj);

                let tTouchObj: ThePointer = null;
                if (this.GetProperty("IsOverlay") === true)
                    tTouchObj = new ThePointer(this.MyRootElement, pointerId, pointerObj.clientX, pointerObj.clientY, 0, this.GetStrokeWidth(pEvtObj), this.GetEventType(pEvtObj), tEvtType, (pEvtObj as any).buttons);
                else
                    tTouchObj = new ThePointer(this.MyRootElement, pointerId, pointerObj.pageX, pointerObj.pageY, 0, this.GetStrokeWidth(pEvtObj), this.GetEventType(pEvtObj), tEvtType, (pEvtObj as any).buttons);
                let lastTouchObj: ThePointer = this.GetTouchPointer(pointerId);
                let idx: number;
                if (IsTouchDown) {
                    if (lastTouchObj) {
                        idx = this.GetTouchPointerIdx(lastTouchObj.Identifier);
                        this.lastXYById.splice(idx, 1);
                        if (this.HasEvent("PointerUp") && pEvtObj.currentTarget !== document) {
                            lastTouchObj.Update(this.MyRootElement, tTouchObj.Position);
                            lastTouchObj.pointerEvent = cdeInputEvent.END;
                            if (!cdeNMI.MyNMISettings.IsScrolling)
                                this.FireEvent(true, "PointerUp", pEvtObj, lastTouchObj)
                        }
                    }
                    else
                        lastTouchObj = tTouchObj;

                    //  init last page positions for this pointer
                    this.lastXYById.push(lastTouchObj);
                    if (this.HasEvent("PointerDown") && (pEvtObj.type === "mousedown" || pEvtObj.currentTarget !== document)) {
                        lastTouchObj.Update(this.MyRootElement, tTouchObj.Position);
                        lastTouchObj.pointerEvent = tTouchObj.pointerEvent;
                        if (!cdeNMI.MyNMISettings.IsScrolling)
                            this.FireEvent(true, "PointerDown", pEvtObj, lastTouchObj);
                        if (this.PreventDefault)
                            cdeNMI.StopPointerEvents(pEvtObj);
                    }
                }
                else if (IsTouchMove) {
                    if (lastTouchObj && !(lastTouchObj.Position.x === tTouchObj.Position.x && lastTouchObj.Position.y === tTouchObj.Position.y)) {
                        lastTouchObj.Update(this.MyRootElement, tTouchObj.Position);
                        lastTouchObj.pointerEvent = tTouchObj.pointerEvent;
                        if (this.HasEvent("PointerMove") && (pEvtObj.type === "mousemove" || pEvtObj.currentTarget !== document)) {
                            if (!cdeNMI.MyNMISettings.IsScrolling)
                                this.FireEvent(true, "PointerMove", pEvtObj, lastTouchObj);
                            if (this.PreventDefault)
                                cdeNMI.StopPointerEvents(pEvtObj);
                        }
                    } else if (!lastTouchObj && cde.CBool(this.GetProperty("AllowMoveWithoutDown"))) {
                        lastTouchObj = tTouchObj;
                        this.lastXYById.push(lastTouchObj);
                        if (this.HasEvent("PointerMove") && (pEvtObj.type === "mousemove" || pEvtObj.currentTarget !== document)) {
                            if (!cdeNMI.MyNMISettings.IsScrolling)
                                this.FireEvent(true, "PointerMove", pEvtObj, tTouchObj);
                            if (this.PreventDefault)
                                cdeNMI.StopPointerEvents(pEvtObj);
                        }
                    }
                }
                else if (IsTouchEnd) {
                    if (lastTouchObj) {
                        if (cdeNMI.MyTouchOverlay && (!cdeNMI.MyTouchOverlay.CurrentControl || !(cdeNMI.MyTouchOverlay.CurrentControl === this || (cdeNMI.MyTouchOverlay.CurrentControl).MyNMIControl === this))) {  //V4.107: MyEditControl is now in MyFirstChild
                            if (cdeNMI.MyTouchOverlay.MyBaseType === this.MyBaseType || cde.CInt(this.GetElement().style.zIndex) < 1000) {
                                if (this.PreventDefault)
                                    cdeNMI.StopPointerEvents(pEvtObj);
                                if (!cdeNMI.MyNMISettings.IsScrolling)
                                    cdeNMI.MyTouchOverlay.FireEvent(false, "Touched");
                                idx = this.GetTouchPointerIdx(lastTouchObj.Identifier);
                                this.lastXYById.splice(idx, 1);
                                break;
                            }
                        }

                        if (this.HasEvent("PointerUp") && !IsTouchCancel && (pEvtObj.type === "mouseup" || pEvtObj.currentTarget !== document)) {
                            lastTouchObj.Update(this.MyRootElement, tTouchObj.Position);
                            lastTouchObj.pointerEvent = tTouchObj.pointerEvent;
                            if (!cdeNMI.MyNMISettings.IsScrolling)
                                this.FireEvent(true, "PointerUp", pEvtObj, lastTouchObj);
                            cdeNMI.StopPointerEvents(pEvtObj);
                        } else if (this.HasEvent("PointerCancel") && IsTouchCancel && (pEvtObj.type === "mouseup" || pEvtObj.currentTarget !== document)) {
                            lastTouchObj.Update(this.MyRootElement, tTouchObj.Position);
                            lastTouchObj.pointerEvent = tTouchObj.pointerEvent;
                            if (!cdeNMI.MyNMISettings.IsScrolling)
                                this.FireEvent(true, "PointerCancel", pEvtObj, lastTouchObj);
                            if (this.PreventDefault)
                                cdeNMI.StopPointerEvents(pEvtObj);
                        }
                        idx = this.GetTouchPointerIdx(lastTouchObj.Identifier);
                        this.lastXYById.splice(idx, 1);
                    }
                }
            }
            this.TouchPoints = this.lastXYById.length;
        }

        public GetEventType(pEvent: Event): cdeInputEventType {
            const msEvent: any = pEvent;
            if (msEvent.mozInputSource) {
                switch (msEvent.mozInputSource) { //Pen
                    case 6: //keyboard
                        return cdeInputEventType.KEYBOARD;
                    case 3: //Erasor
                        return cdeInputEventType.ERASER;
                    case 2: //Pen
                        return cdeInputEventType.PEN;
                    case 5: //Touch
                        return cdeInputEventType.TOUCH;
                    case 1: //Mouse
                        return cdeInputEventType.MOUSE;
                    default:
                        return cdeInputEventType.UNKOWN;
                }
            }
            else if (msEvent.pointerType) {
                if (msEvent.buttons && (msEvent.buttons & 32) !== 0)
                    return cdeInputEventType.ERASER;
                if (typeof msEvent.pointerType === "string") {
                    switch (msEvent.pointerType) {
                        case "touch":
                            return cdeInputEventType.TOUCH;
                        case "pen":
                            return cdeInputEventType.PEN;
                        case "mouse":
                            return cdeInputEventType.MOUSE;
                        default:
                            return cdeInputEventType.UNKOWN;
                    }
                }
                else {
                    switch (msEvent.pointerType) {
                        case msEvent.MSPOINTER_TYPE_TOUCH:
                            return cdeInputEventType.TOUCH;
                        case msEvent.MSPOINTER_TYPE_PEN:
                            return cdeInputEventType.PEN;
                        case msEvent.MSPOINTER_TYPE_MOUSE:
                            return cdeInputEventType.MOUSE;
                        default:
                            return cdeInputEventType.UNKOWN;
                    }
                }
            }
            return cdeInputEventType.MOUSE;
        }

        private GetStrokeWidth(pEvent: Event): number {
            let tStroke = 20;
            const msEvent: any = pEvent;
            if (msEvent.mozInputSource) {
                let tPressure = 0.5;
                if (msEvent.mozPressure)
                    tPressure = msEvent.mozPressure;
                switch (msEvent.mozInputSource) { //Pen
                    case 3: //Erasor
                        tStroke = tPressure * 50;
                        break;
                    case 2: //Pen
                        tStroke = tPressure * 20;
                        break;
                    case 5: //Touch
                        tStroke = 20 * tPressure;
                        break;
                    case 1: //Mouse
                        tStroke = 5;
                        break;
                    default:
                        break;
                }
            }
            else if (msEvent.pointerType) {
                if (typeof msEvent.pointerType === "string") {
                    switch (msEvent.pointerType) {
                        case "touch":
                            tStroke = 20 * msEvent.pressure;
                            if (tStroke < 1)
                                tStroke = 20;
                            break;
                        case "pen":
                            tStroke = msEvent.pressure * 20;
                            if (tStroke < 1)
                                tStroke = 1;
                            break;
                        case "mouse":
                            tStroke = 5;
                            break;
                    }
                }
                else {
                    switch (msEvent.pointerType) {
                        case msEvent.MSPOINTER_TYPE_TOUCH:
                            tStroke = 20 * msEvent.pressure;
                            if (tStroke < 1)
                                tStroke = 20;
                            break;
                        case msEvent.MSPOINTER_TYPE_PEN:
                            tStroke = msEvent.pressure * 20;
                            if (tStroke < 1)
                                tStroke = 1;
                            break;
                        case msEvent.MSPOINTER_TYPE_MOUSE:
                            tStroke = 5;
                            break;
                    }
                }
            }
            if (msEvent.touches && msEvent.touches.length > 0 && msEvent.touches[0].force) {
                tStroke = 20 * msEvent.touches[0].force;
                if (tStroke < 1)
                    tStroke = 1;
            }
            return tStroke;
        }

        public DoFireClick(pTargetObj: INMIControl, pEvent?: Event, pPointer?: ThePointer) {
            if (!pTargetObj || !pTargetObj.HasEvent("OnClick"))
                return;
            const TPs: number = pTargetObj.GetProperty("TouchPoints");
            if (!pPointer || ((pPointer.IsOnObject || cde.CBool(pTargetObj.GetProperty("IgnoreHitTarget"))) && pPointer.PathLength() < cdeNMI.MyNMISettings.DeadPathLength)) {
                pTargetObj.WasClicked = true;
                window.setTimeout(() => {
                    pTargetObj.FireEvent(true, "OnClick", pEvent, TPs, pTargetObj.GetProperty("Cookie"), pTargetObj.GetProperty("Parent"));
                }, 100);
            }
        }


        public SetDataItem(pName: string, pValue: string) {
            this.MyDataItems[pName] = pValue;
        }

        public OnLoad() {
            this.SetProperty("IsUnloaded", false);
            for (const tdx in this.MyChildren) {
                this.MyChildren[tdx].SetProperty("TabIndex", this.MyChildren[tdx].MyFieldInfo ? this.MyChildren[tdx].MyFieldInfo.FldOrder + 101 : 100);
                this.MyChildren[tdx].OnLoad();
            }
        }
        public OnUnload() {
            this.SetProperty("IsUnloaded", true);
            for (const tdx in this.MyChildren) {
                this.MyChildren[tdx].SetProperty("TabIndex", -1);
                this.MyChildren[tdx].OnUnload();
            }
        }

        public GetSetting(pName: string, pDefault?, CompileAsJSON?: boolean) {
            let res = null;
            if (this.MyFieldInfo) {
                res = this.MyFieldInfo[pName];
                if (res && CompileAsJSON === true) {
                    try {
                        res = JSON.parse(res);
                    }
                    catch { res = null; }
                }
                if (!res && this.MyFieldInfo.PropertyBag) {
                    res = cdeNMI.ThePB.GetValueFromBagByName(this.MyFieldInfo.PropertyBag, pName);
                    if (res && CompileAsJSON === true) {
                        try {
                            res = JSON.parse(res);
                        }
                        catch { res = null; }
                    }
                }
            }
            if (!res && pDefault)
                res = pDefault;
            return res;
        }

        public GetProperty(pName: string) {
            if (pName === "PreventManipulation") {
                return this.PreventManipulation;
            }
            if (pName === "PreventDefault" || pName === "EnableMT") {
                return this.PreventDefault;
            }
            if (pName === "TouchPoints")
                return this.TouchPoints;

            if (this.PropertyBag[pName] !== undefined)
                return this.PropertyBag[pName];
            else {
                if (this.MyFieldInfo && this.MyFieldInfo[pName])
                    return this.MyFieldInfo[pName];
            }
            return null;
        }

        public GetElement(): HTMLElement {
            return this.MyRootElement;
        }

        public GetContainerElement(): HTMLElement {
            if (!this.MyContainerElement)
                return this.MyRootElement;
            else
                return this.MyContainerElement;
        }

        public ApplySkin() {
            //override if needed
        }

        public PostCreate(pTE: INMITileEntry) {
            //override if needed
        }

        public OnNUITag(pTag: string, pCookie: string) {
            //override if needed
        }

        public FindRenderTarget(pTarget: string) {
            if (!this.MyRootElement)
                return;
            this.MyRenderTarget = document.getElementById(pTarget);
            if (this.MyRenderTarget) {
                this.MyRootElement.parentNode.removeChild(this.MyRootElement);
                if (this.MyRenderTarget.children.length === 0) {
                    this.MyRenderTarget.appendChild(this.MyRootElement);
                    this.SetProperty("Visibility", true);
                }
            } else {
                setTimeout(() => {
                    if (!this.MyRenderTarget)
                        this.FindRenderTarget(pTarget);
                },
                    1000);
            }
        }

        MyRenderTarget: HTMLElement = null;

        public ShowFieldContent(pContent: string, pFieldInfo?: cdeNMI.TheFieldInfo, pScreenID?: string): string {
            if (!pFieldInfo)
                pFieldInfo = this.MyFieldInfo;
            if (!pScreenID)
                pScreenID = this.MyScreenID;
            if (pFieldInfo && (pFieldInfo.Flags & 1) !== 0) {
                if (!pContent || pContent.length === 0)
                    return "";
                else
                    return "*****";
            }
            else {
                if (!cde.IsNotSet(pContent)) {
                    if (pFieldInfo) {
                        let tOptions;
                        let tFormat;
                        switch (pFieldInfo.Type) {
                            case cdeControlType.Curreny:
                                if (!pContent)
                                    pContent = "Zero";
                                else
                                    pContent = "$" + parseFloat(pContent).toFixed(2);
                                break;
                            case cdeControlType.DateTime:
                                if (!pContent) pContent = "&nbsp;"; else {
                                    const mDate: Date = cdeNMI.cdeJsonDate2JSDate(pContent);
                                    if (mDate.toString() !== "Invalid Date") {
                                        if (mDate.getFullYear() < 2) {
                                            pContent = "";
                                        }
                                        else {
                                            try {
                                                if (pFieldInfo["Format"])
                                                    pContent = cdeNMI.FormatDate(mDate, pFieldInfo["Format"]);
                                                else
                                                    pContent = cdeNMI.FormatDate(mDate, "YYYY-MM-DD HH:mm:ss");
                                            }
                                            catch (ex) {
                                                pContent = mDate.toLocaleDateString() + " " + mDate.toLocaleTimeString();
                                            }
                                        }
                                    }
                                }
                                break;
                            case cdeControlType.Number:
                                if (pContent) {
                                    tFormat = pFieldInfo["Format"];
                                    if (!cde.IsNotSet(tFormat)) {
                                        pContent = parseFloat(pContent).toFixed(parseInt(tFormat));
                                    }
                                }
                                else
                                    pContent = "0";
                                break;
                            case cdeControlType.SingleCheck:
                                {
                                    tOptions = null;
                                    tOptions = pFieldInfo["Options"];
                                    if (!tOptions)
                                        tOptions = "true;false";
                                    const tOpts: string[] = tOptions.split(';');
                                    if (cde.CBool(pContent))
                                        pContent = tOpts[0];
                                    else
                                        pContent = tOpts.length > 1 ? tOpts[1] : "";
                                }
                                break;
                            //case cdeControlType.ThingPicker:
                            case cdeControlType.ComboLookup:
                                {
                                    const tTableName: string = cde.GuidToString(this.GetSetting("StorageTarget"));
                                    let tScreenid: string = pScreenID;
                                    if (this.GetSetting("ModelID")) tScreenid = this.GetSetting("ModelID");
                                    const tScreenInfo: TheScreenInfo = cdeNMI.MyNMIModels[cde.GuidToString(tScreenid)];
                                    if (!tScreenInfo || !tScreenInfo.MyStorageMirror[tTableName])
                                        return pContent;
                                    else {
                                        for (let row = 0; row < tScreenInfo.MyStorageMirror[tTableName].length; row++) {
                                            const tRow = tScreenInfo.MyStorageMirror[tTableName][row];
                                            const tName: string = cdeNMI.GetFldContentByName(tRow, this.GetSetting("ValueFld"), false);
                                            if (tName && cde.GuidToString(tName) === cde.GuidToString(pContent))
                                                return cdeNMI.GetFldContentByName(tRow, this.GetSetting("NameFld"), false);
                                        }
                                    }
                                }
                                break;
                            case cdeControlType.ComboBox:
                                tOptions = this.GetProperty("OptionsLive");
                                if (!tOptions)
                                    tOptions = this.GetSetting("OptionsLive");
                                if (!tOptions)
                                    tOptions = this.GetProperty("Options");
                                if (!tOptions)
                                    tOptions = this.GetSetting("Options");
                                if (tOptions) {
                                    if (tOptions.substr(0, 6) === "LOOKUP") {
                                        let tParas: string[] = tOptions.split(':');
                                        if (tParas.length === 2) {
                                            switch (tParas[1]) {
                                                case "THINGPICKER":
                                                    tParas = "LOOKUP:b510837f-3b75-4cf2-a900-d36c19113a13:MyPropertyBag.FriendlyName.Value:cdeMID:MyPropertyBag.DeviceType.Value:FAFA22FF-96AC-42CF-B1DB-7C073053FC39".split(':');
                                                    break;
                                                case "PROPERTYPICKER":
                                                    break;
                                            }
                                        }
                                        if (tParas.length < 3) {
                                            break;
                                        } else {
                                            const tTableName: string = cde.GuidToString(tParas[1]);
                                            let tScreenid: string = pScreenID;
                                            if (tParas.length > 5) tScreenid = tParas[5];
                                            const tScreenInfo: TheScreenInfo = cdeNMI.MyNMIModels[cde.GuidToString(tScreenid)];
                                            if (!tScreenInfo || !tScreenInfo.MyStorageMirror[tTableName]) {
                                                const tDT: string = pFieldInfo["DisplayField"];
                                                if (tDT) {
                                                    if (tScreenInfo.MyStorageMirror[cde.GuidToString(pFieldInfo.FormID)]) {
                                                        const tTargetTable = tScreenInfo.MyStorageMirror[cde.GuidToString(pFieldInfo.FormID)];
                                                        for (let row = 0; row < tTargetTable.length; row++) {
                                                            const tRow = tTargetTable[row];
                                                            const tName: string = cdeNMI.GetFldContentByName(tRow, tParas[3], false);
                                                            if (tName && cde.GuidToString(tName) === cde.GuidToString(pContent)) {
                                                                const tFinal: string = cdeNMI.GetFldContentByName(tRow, tDT, false);
                                                                if (tFinal)
                                                                    return tFinal;
                                                            }
                                                        }
                                                    }
                                                }
                                                return pContent;
                                            } else {
                                                for (let row = 0; row < tScreenInfo.MyStorageMirror[tTableName].length; row++) {
                                                    const tRow = tScreenInfo.MyStorageMirror[tTableName][row];
                                                    const tName: string = cdeNMI.GetFldContentByName(tRow, tParas[3], false);
                                                    if (tName && cde.GuidToString(tName) === cde.GuidToString(pContent))
                                                        return cdeNMI.GetFldContentByName(tRow, tParas[2], false);
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        if (this.GetProperty("LiveOptions"))
                                            tOptions = this.GetProperty("LiveOptions");
                                        if (!tOptions && this.GetProperty("OptionsLive"))
                                            tOptions = this.GetProperty("OptionsLive");
                                        const tGroups: string[] = tOptions.split(';:;');
                                        for (let tGrp = 0; tGrp < tGroups.length; tGrp++) {
                                            let i: number;
                                            if (tGroups[tGrp].substr(0, 1) === "[") {
                                                const tJOpgs = JSON.parse(tGroups[tGrp]);
                                                for (i = 0; i < tJOpgs.length; i++) {
                                                    if (tJOpgs[i].V === pContent)
                                                        return tJOpgs[i].N;
                                                }
                                            }
                                            else {
                                                const tOps: string[] = tGroups[tGrp].split(';');
                                                for (i = 0; i < tOps.length; i++) {
                                                    if (tGroups.length > 1 && i === 0) continue;

                                                    const tOptVal: string[] = tOps[i].split(':');
                                                    if (tOptVal.length > 1) {
                                                        if (pContent === tOptVal[1] || ((!pContent || pContent === '') && tOptVal[1] === '0'))
                                                            return tOptVal[0];
                                                    }
                                                    else {
                                                        if (pContent === tOptVal[0])
                                                            return tOptVal[0];
                                                    }
                                                }
                                                if (tOptions.substr(0, 12) === "SCREENPICKER") {
                                                    if (cdeNMI.MyEngine) {
                                                        cdeNMI.MyEngine.PublishToNMI('NMI_GET_DATA:SCREENRESOLVE:' + this.GetProperty("ID") + ':' + this.GetProperty("UXID") + ':' + pContent, '', this.MyFieldInfo ? this.MyFieldInfo.cdeN : null);
                                                    }

                                                }
                                            }
                                        }
                                    }
                                }
                                break;
                            case cdeControlType.ThingPicker:
                                return this.GetNameFromValue(pContent);
                                break;
                            default:
                                if (pContent && (pFieldInfo.Flags & 256) === 0)
                                    pContent = cdeNMI.cdeEscapeHtml(pContent);
                                tFormat = pFieldInfo["Format"];
                                if (!tFormat)
                                    tFormat = this.GetProperty("Format");
                                if (!cde.IsNotSet(tFormat)) {
                                    if (cde.CInt(tFormat) > 0) {
                                        if (pContent && pContent.length > parseInt(tFormat)) {
                                            if (isNaN(Number(pContent)) === true)
                                                pContent = pContent.substr(0, parseInt(tFormat));
                                            else
                                                pContent = cde.CDbl(pContent).toFixed(parseInt(tFormat));
                                        }
                                    }
                                    else {
                                        pContent = tFormat.format(pContent);
                                        if (this.GetProperty("Cookie"))
                                            pContent = cdeNMI.GenerateFinalString(pContent, this.GetProperty("Cookie"));
                                        pContent = cdeNMI.GenerateFinalString(pContent, null, this.MyTRF);
                                    }
                                }
                                break;
                        }
                    }
                    return pContent;
                }
            }
            return "";
        }

        GetNameFromValue(pVal: string): string {
            if (pVal.length === 0)
                return pVal;
            if (!this.GetProperty("ThingFriendlyName")) {

                return pVal;
            } else {
                return this.GetProperty("ThingFriendlyName");
            }
        }

        public SetInitialSize(tMargin = 1) {
            this.SetInitialWidth(tMargin);
            this.SetInitialHeight(tMargin);
        }

        public SetInitialWidth(tMargin = 1): number {
            //SIZING: Needs to be the same on all SF Controls
            let tW: number = cde.CInt(this.GetSetting("ControlTW"));
            if (tW === 0 && this.GetProperty("ControlTW"))
                tW = cde.CInt(this.GetProperty("ControlTW"));
            if (this.GetSetting("TileWidth"))
                tW = cde.CInt(this.GetSetting("TileWidth"));
            if (tW === 0 && this.GetProperty("TileWidth"))
                tW = cde.CInt(this.GetProperty("TileWidth"));
            return this.SetWidth(this.GetElement(), tW, tMargin);
        }

        public SetInitialHeight(tMargin = 1): number {
            let tH: number = cde.CInt(this.GetSetting("ControlTH"));
            if (tH === 0 && this.GetProperty("ControlTH"))
                tH = cde.CInt(this.GetProperty("ControlTH"));
            if (this.GetSetting("TileHeight"))
                tH = cde.CInt(this.GetSetting("TileHeight"));
            if (tH === 0 && this.GetProperty("TileHeight"))
                tH = cde.CInt(this.GetProperty("TileHeight"));
            return this.SetHeight(this.GetElement(), tH, tMargin);
        }

        public IsAChildBigger(tW: number): boolean {
            for (const i in this.MyChildren) {
                if (this.MyChildren[i].MyBaseType !== cdeControlType.Table) {
                    if (this.MyChildren[i].MyBaseType !== cdeControlType.CollapsibleGroup || cde.CBool(this.MyChildren[i].GetProperty("AllowHorizontalExpand")) === false) {
                        if (cde.CInt(this.MyChildren[i].GetSegmentWidth()) > tW)
                            return true;
                    }
                    if (this.MyChildren[i].IsAChildBigger(tW) === true)
                        return true;
                }
            }
            return false;
        }
        public IsAParentSmaller(tW: number): boolean {
            if (this.MyTarget) {
                if (this.MyTarget.MyBaseType !== cdeControlType.CollapsibleGroup || cde.CBool(this.MyTarget.GetProperty("AllowHorizontalExpand")) === false) {
                    if (cde.CInt(this.MyTarget.GetSegmentWidth()) < tW)
                        return true;
                    if (this.MyTarget.IsAParentSmaller(tW) === true)
                        return true;
                }
            }
            return false;
        }

        public GetSegmentWidth(): number {
            let tWid: number = cdeNMI.GetSizeFromTile(this.GetProperty("TileWidth"));
            if (cde.CInt(this.GetProperty("TileFactorX")) > 1)
                tWid /= cde.CInt(this.GetProperty("TileFactorX"));
            else {
                if (cde.CInt(this.GetSetting("TileFactorX")) > 1)
                    tWid /= cde.CInt(this.GetSetting("TileFactorX"));
            }
            return Math.floor(tWid / GetSizeFromTile(6));
        }

        public SetWidth(pElement: HTMLElement, tW: number, tMargin = 1, tDontCheckMaxWidth = false): number {
            if (tW > 0) {
                if (this.GetProperty("MaxTileWidth") && tW > cde.CInt(this.GetProperty("MaxTileWidth")))
                    tW = cde.CInt(this.GetProperty("MaxTileWidth"));
                if (this.GetProperty("MinTileWidth") && tW < cde.CInt(this.GetProperty("MinTileWidth")))
                    tW = cde.CInt(this.GetProperty("MinTileWidth"));
                let tWid: number = cdeNMI.GetSizeFromTile(tW); // - tMargin; //-1 compensates for 1px margin
                if (cde.CInt(this.GetProperty("TileFactorX")) > 1)
                    tWid /= cde.CInt(this.GetProperty("TileFactorX"));
                else {
                    if (cde.CInt(this.GetSetting("TileFactorX")) > 1)
                        tWid /= cde.CInt(this.GetSetting("TileFactorX"));
                }
                if (cde.MyBaseAssets.MyServiceHostInfo.WebPlatform !== 1 && this.MyBaseType === cdeNMI.cdeControlType.CollapsibleGroup && this.MyFieldInfo && this.MyFieldInfo.FldOrder === 1 && cde.CBool(this.GetProperty("UseMargin")) === true) {
                    const tSegments: number = Math.floor(tW / 6);
                    if (tSegments > 0)
                        tWid += GetSizeFromTile(tSegments) / 2;
                }
                if (!tDontCheckMaxWidth && cdeNMI.MyScreenManager && cdeNMI.MyScreenManager.DocumentWidth > 0 && tWid > cdeNMI.MyScreenManager.DocumentWidth)
                    tWid = cdeNMI.MyScreenManager.DocumentWidth - (GetSizeFromTile(1));
                if (pElement) {
                    pElement.style.width = tWid + "px";
                    this.MyWidth = tWid;
                }
                return tWid;
            } else {
                //if (pElement)
                //pElement.style.width = "inherit";
            }
            return -1;
        }

        public SetHeight(pElement: HTMLElement, tH: number, tMargin = 1): number {
            if (tH > 0) {
                if (this.GetProperty("MaxTileHeight") && tH > cde.CInt(this.GetProperty("MaxTileHeight")))
                    tH = cde.CInt(this.GetProperty("MaxTileHeight"));
                if (this.GetProperty("MinTileHeight") && tH < cde.CInt(this.GetProperty("MinTileHeight")))
                    tH = cde.CInt(this.GetProperty("MinTileHeight"));
                let tHei: number = cdeNMI.GetSizeFromTile(tH) - tMargin;
                if (cde.CInt(this.GetProperty("TileFactorY")) > 1) {
                    tHei /= cde.CInt(this.GetProperty("TileFactorY"));
                }
                else {
                    if (cde.CInt(this.GetSetting("TileFactorY")) > 1)
                        tHei /= cde.CInt(this.GetSetting("TileFactorY"));
                }
                if (pElement)
                    pElement.style.height = tHei + "px";
                this.MyHeight = tHei;
                return tHei;
            } else {
                if (pElement)
                    pElement.style.height = "inherit";
            }
            return -1;
        }


        public static GetTileEntry(node: HTMLElement): HTMLElement {
            const els = (node).getElementsByTagName("*");
            for (let i = 0, j = els.length; i < j; i++) {
                const tEle: HTMLElement = els[i] as HTMLElement;
                if (tEle.className === "cdeTileEntryText") return tEle;
            }
            return null;
        }

        //Backwards Compat requirements

        public static SetPropertiesFromBag(pCtrl: cdeNMI.TheNMIBaseControl, pBag: string[], pRow?, pIsLive?: boolean, pIsInTable?: boolean) {
            return cdeNMI.ThePB.SetPropertiesFromBag(pCtrl, pBag, pRow, pIsLive, pIsInTable);
        }
    }
}