// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {

    export class TheControlFactory extends cde.TheMetaDataBase {
        constructor() {
            super();
            this.cdeControlTypeNames[0] = "cdeNMI.TheNMIBaseControl";
            this.cdeControlTypeNames[1] = "cdeNMI.ctrlEditBox";
            this.cdeControlTypeNames[2] = "cdeNMI.ctrlComboBox";
            //Radion coming soon
            this.cdeControlTypeNames[4] = "cdeNMI.ctrlCheckBox";
            this.cdeControlTypeNames[5] = "cdeNMI.ctrlEditBox";
            this.cdeControlTypeNames[6] = "cdeNMI.ctrlComboBox";
            this.cdeControlTypeNames[7] = "cdeNMI.ctrlComboBox";
            this.cdeControlTypeNames[8] = "cdeNMI.ctrlDateTimePicker"; //TODO: New Time Picker
            this.cdeControlTypeNames[9] = "cdeNMI.ctrlDateTimePicker";//TODO: New TimeSpan Picker
            this.cdeControlTypeNames[10] = "cdeNMI.ctrlEditBox";
            this.cdeControlTypeNames[11] = "cdeNMI.ctrlTileButton";      //11: Submit Button Retired
            this.cdeControlTypeNames[12] = "cdeNMI.ctrlEditBox";
            this.cdeControlTypeNames[13] = "cdeNMI.ctrlComboBox";
            this.cdeControlTypeNames[14] = "cdeNMI.ctrlComboBox";
            this.cdeControlTypeNames[15] = "cdeNMI.ctrlComboBox";
            this.cdeControlTypeNames[16] = "cdeNMI.ctrlEditBox";  
            this.cdeControlTypeNames[17] = "cdeNMI.ctrlComboBox";  //Todo:Combo Option
            this.cdeControlTypeNames[18] = "cdeNMI.ctrlDateTimePicker";

            this.cdeControlTypeNames[20] = "cdeNMI.ctrlSmartLabel";
            this.cdeControlTypeNames[21] = "cdeNMI.ctrlDateTimePicker";   //TODO: Time Picker
            this.cdeControlTypeNames[22] = "cdeNMI.ctrlTileButton";
            this.cdeControlTypeNames[23] = "cdeNMI.ctrlTableView";
            this.cdeControlTypeNames[24] = "cdeNMI.ctrlCheckField";

            this.cdeControlTypeNames[26] = "cdeNMI.TheNMIScreen";

            this.cdeControlTypeNames[28] = "cdeNMI.ctrlTileEntry";
            this.cdeControlTypeNames[29] = "cdeNMI.ctrlZoomImage";
            this.cdeControlTypeNames[30] = "cdeNMI.ctrlCanvasDraw";
            this.cdeControlTypeNames[31] = "cdeNMI.ctrlEditBox";
            this.cdeControlTypeNames[32] = "cdeNMI.ctrlEditBox";
            this.cdeControlTypeNames[33] = "cdeNMI.ctrlEndlessSlider";
            this.cdeControlTypeNames[34] = "cdeNMI.ctrlBarChart";
            this.cdeControlTypeNames[35] = "cdeNMI.TheToast";
            this.cdeControlTypeNames[36] = "cdeNMI.ctrlTouchDraw";
            this.cdeControlTypeNames[37] = "cdeNMI.ThePopup";
            this.cdeControlTypeNames[38] = "cdeNMI.ctrlDrawOverlay";

            this.cdeControlTypeNames[40] = "cdeNMI.ctrlDropUploader";
            this.cdeControlTypeNames[41] = "cdeNMI.ctrlRevealButton";
            this.cdeControlTypeNames[42] = "cdeNMI.ctrlPinButton";

            this.cdeControlTypeNames[44] = "cdeNMI.TheDashboard";
            this.cdeControlTypeNames[45] = "cdeNMI.ctrlFormView";
            this.cdeControlTypeNames[46] = "cdeNMI.ctrlTouchOverlay";
            this.cdeControlTypeNames[47] = "cdeNMI.ctrlMoTLock";
            this.cdeControlTypeNames[48] = "cdeNMI.ctrlProgressBar";
            this.cdeControlTypeNames[49] = "cdeNMI.ctrlTileGroup";
            this.cdeControlTypeNames[50] = "cdeNMI.ctrlVideoViewer";

            this.cdeControlTypeNames[53] = "cdeNMI.ctrlEditBox";
            this.cdeControlTypeNames[54] = "cdeNMI.ctrlShape";
            this.cdeControlTypeNames[55] = "cdeNMI.ctrlCollapsibleGroup";
            this.cdeControlTypeNames[56] = "cdeNMI.ctrlAboutButton";
            this.cdeControlTypeNames[57] = "cdeNMI.ctrlStatusLight";
            this.cdeControlTypeNames[58] = "cdeNMI.ctrlFacePlate";
            this.cdeControlTypeNames[59] = "cdeNMI.TheLoginScreen";

            this.cdeControlTypeNames[60] = "cdeNMI.TheShapeRecognizer";
            this.cdeControlTypeNames[61] = "cdeNMI.TheScreenManager";
            this.cdeControlTypeNames[62] = "cdeNMI.ctrlLogoButton";
            this.cdeControlTypeNames[63] = "cdeNMI.ctrlThingPicker";   //ThingPicker

            this.cdeControlTypeNames[64] = "cdeNMI.ctrlImageSlider2";
            this.cdeControlTypeNames[65] = "cdeNMI.ctrlCircularGauge2";
            this.cdeControlTypeNames[66] = "cdeNMI.ctrlSmartGauge2";
            this.cdeControlTypeNames[67] = "cdeNMI.ctrlIFrameView";
            this.cdeControlTypeNames[68] = "cdeNMI.ctrlPropertyPicker"; //Goes to PropertyPickerCtrl control
            this.cdeControlTypeNames[69] = "cdeNMI.ctrlPropertyPicker"; //The real Property Picker (no edit Box);
            this.cdeControlTypeNames[70] = "cdeNMI.ctrlToolTip";
            this.cdeControlTypeNames[71] = "cdeNMI.ctrlComboLookup";
            this.cdeControlTypeNames[72] = "cdeNMI.ctrlUserMenu";
            this.cdeControlTypeNames[73] = "cdeNMI.ctrlMeshPicker";
            this.cdeControlTypeNames[74] = "cdeNMI.ctrlHashIcon";
            this.cdeControlTypeNames[75] = "cdeNMI.ctrlCertPicker";
            this.cdeControlTypeNames[76] = "cdeNMI.ctrlDeviceTypePicker";

            this.MyKnownControls[0] = "CMyDashboard";
            this.MyKnownControls[1] = "CMyChart";
            this.MyKnownControls[2] = "CMyTable";
            this.MyKnownControls[3] = "CMyForm";
            this.MyKnownControls[4] = "CMyData";
            this.MyKnownControls[5] = "CMyHTML";
            this.MyKnownControls[6] = "CMySCRIPT";
            this.MyKnownControls[7] = "CMyInfo";
            this.MyKnownControls[8] = "CMyNavigator";
            this.MyKnownControls[9] = "CMyLiveScreen";
            this.MyKnownControls[10] = "CMyIFrame";

            this.MyNMIControls["TABLES"] = [];
        }

        //Required to register customer controls
        public InitTCF() {
            this.FireEvent(true, "ControlTypeFactory_Ready");
        }

        cdeControlTypeNames: string[] = new Array<string>();
        MyNMIControls: cdeNMI.INMIControl[][] = [];
        MyKnownControls: string[] = new Array<string>();

        public RegisterKnownControl(pIDX: number, pName: string) {
            this.MyKnownControls[pIDX] = pName;
        }

        public IsControlNameKnown(pName: string): boolean {
            return cdeNMI.DoesArrayContain(this.MyKnownControls, pName);
        }

        public RegisterControl(pGroup: string, pID?: string, pCtrl?: INMIControl) {
            if (!this.MyNMIControls[pGroup])
                this.MyNMIControls[pGroup] = [];
            if (pID && pCtrl)
                this.MyNMIControls[pGroup][pID] = pCtrl;
        }
        public DeleteRegisteredControl(pGroup: string, pID: string) {
            if (this.MyNMIControls[pGroup] && this.MyNMIControls[pGroup][pID])
                delete this.MyNMIControls[pGroup][pID];
        }
        public GetRegisteredControl(pGroup: string, pID: string): INMIControl {
            if (this.MyNMIControls[pGroup] && this.MyNMIControls[pGroup][pID])
                return this.MyNMIControls[pGroup][pID];
            return null;
        }
        public GetRegisteredControlGroup(pGroup: string): INMIControl[] {
            if (this.MyNMIControls[pGroup])
                return this.MyNMIControls[pGroup];
            return null;
        }
        public UnregisterControl(tOWN: string, pID: string) {
            tOWN = cde.GuidToString(tOWN);
            pID = cde.GuidToString(pID);
            //if (this.MyNMIControls[tOWN] && this.MyNMIControls[tOWN][pID]) {
            const tc: INMIControl = this.GetRegisteredControl(tOWN, pID); // this.MyNMIControls[tOWN][pID];
            if (tc) {
                if (cdeNMI.MyEngine) {
                    const tThingOwn: string = cde.GuidToString(tc.GetProperty("MyThing"));
                    if (cdeNMI.MyNMIThingEvents[tThingOwn] && cdeNMI.MyNMIThingEvents[tThingOwn][pID])
                        delete cdeNMI.MyNMIThingEvents[tThingOwn][pID];
                }
                //delete this.MyNMIControls[tOWN][pID];
                this.DeleteRegisteredControl(tOWN, pID);
            }
            //}
        }

        public IsComboBased(pFldType: number): boolean {
            switch (pFldType) {
                case 2:
                case 6:
                case 7:
                case 8:
                case 9:
                case 13:
                case 14:
                case 15:
                case 17:
                case 18:
                case 21:
                    return true;
            }
            return false;
        }

        IsTypeNumeric(pFldType: number): boolean {
            switch (pFldType) {
                case 12:
                    return true;
            }
            return false;
        }

        public RegisterControlType(pCType: cdeControlType, pTypeName: string) {
            this.cdeControlTypeNames[pCType] = pTypeName;
        }
        public GetControlByName(pCTYpe: string): string {
            if (!this.cdeControlTypeNames[pCTYpe])
                return null;
            else
                return this.cdeControlTypeNames[pCTYpe];
        }

        public RegisterControlName(pCType: string, pTypeName: string) {
            this.cdeControlTypeNames[pCType] = pTypeName;
        }
        public GetControlType(pCTYpe: cdeControlType): string {
            if (!this.cdeControlTypeNames[pCTYpe])
                return this.cdeControlTypeNames[0];
            else
                return this.cdeControlTypeNames[pCTYpe];
        }

        //////////////////////////////////////////////////////////////////////////////
        /// NMI Lazy Control Loader
        //////////////////////////////////////////////////////////////////////////////
        MyLazyCallbacks: [][] = [];

        public FireLazyCreate(pEngineName: string, pTargetControl: INMIControl = null, IsRecurse = false) {
            if (!pEngineName || !this.MyLazyCallbacks[pEngineName]) return;
            for (let mh = this.MyLazyCallbacks[pEngineName].length - 1; mh >= 0; mh--) {
                if (this.MyLazyCallbacks[pEngineName][mh].CallBack) {
                    if (this.CreateControlLazy(this.MyLazyCallbacks[pEngineName][mh].TargetControl, pEngineName, this.MyLazyCallbacks[pEngineName][mh].ControlType, this.MyLazyCallbacks[pEngineName][mh].CallBack, this.MyLazyCallbacks[pEngineName][mh].Cookie))
                        this.MyLazyCallbacks[pEngineName].splice(mh, 1);
                }
            }
            if (!IsRecurse && this.MyLazyCallbacks[pEngineName].length > 0)
                this.FireLazyCreate(pEngineName, pTargetControl, true);
        }

        public CreateNMIControl(pControlType: cdeNMI.cdeControlType, bReturnNull = false): INMIControl {
            if (!this.cdeControlTypeNames[pControlType] || this.cdeControlTypeNames[pControlType] === '') {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeNMI:CreateNMIControl", "Unkown Control Type specified: " + pControlType);
                if (bReturnNull)
                    return null;
                return this.CreateBaseControl();
            }
            let tControl = this.CreateControlLazy(null, cdeNMI.eTheNMIEngine, this.cdeControlTypeNames[pControlType], this.CreateNMICallback, null);
            if (!tControl) {
                if (bReturnNull)
                    return null;
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeNMI:CreateNMIControlAsync", "Control Type specified not found: " + pControlType);
                tControl = this.CreateBaseControl();
            }
            return tControl;
        }

        public CreateBaseControl(): INMIControl {
            try {
                return new (<any>cdeNMI)[this.cdeControlTypeNames[0].split('.')[1]]() as cdeNMI.INMIControl;
            }
            catch {
                //ignored
            }
            return null;
        }

        CreateNMICallback() { //pTargetControl: INMIControl, pResControl: INMIControl, pCookie) {
            //TODO: Later replace dummy with real control
        }

        CreateNMIControlAsync(pTargetControl: INMIControl, pControlType: cdeNMI.cdeControlType, callback): INMIControl {
            if (!this.cdeControlTypeNames[pControlType]) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeNMI:CreateNMIControlAsync", "Unkown Control Type specified: " + pControlType);
                return null;
            }
            return this.CreateControlLazy(pTargetControl, cdeNMI.eTheNMIEngine, this.cdeControlTypeNames[pControlType], callback, null);
        }

        CreateControlLazy(pTargetControl: INMIControl, pEngineName: string, pControlType: string, callback, cookie?): INMIControl {
            let tResControl: INMIControl = null;
            let bSuccess = false;
            if (pControlType && pControlType.length > 0) {
                try {
                    const mClass = this.stringToFunction(pControlType);
                    tResControl = new mClass();
                    bSuccess = true;
                    tResControl.MyParentCtrl = pTargetControl;
                    if (callback)
                        callback(pTargetControl, tResControl, cookie);
                }
                catch (e) {
                    cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "cdeNMI:CreateControlLazy", "LazyLoad failed:(" + pControlType + ") " + e + ":" + e.stack);
                }
            } else {
                return null;
            }

            if (!bSuccess && pEngineName && callback) {
                if (!this.MyLazyCallbacks[pEngineName]) {
                    this.MyLazyCallbacks[pEngineName] = [];
                    if (!cde.MyBaseAssets.MyEngines[pEngineName] && cdeNMI.MyEngine)
                        cdeNMI.MyEngine.PublishToNMI("NMI_GET_ENGINEJS", pEngineName);
                }
                let HasCallback = false;
                for (let mh = 0; mh < this.MyLazyCallbacks[pEngineName].length; mh++) {
                    if (this.MyLazyCallbacks[pEngineName][mh].Cookie === cookie) {
                        HasCallback = true;
                        break;
                    }
                }
                if (!HasCallback)
                    this.MyLazyCallbacks[pEngineName].push({ ControlType: pControlType, TargetControl: pTargetControl, CallBack: callback, Cookie: cookie });
            }
            return tResControl;
        }

        public SetControlEssentials(pTEControl: INMITileEntry, pTgtControl: INMIControl, pTEControlMyTRF?: TheTRF) {
            //var pTEControl: ctrlTileEntry = this;
            if (!pTEControl)
                return;
            if (!pTEControlMyTRF)
                pTEControlMyTRF = pTEControl.MyTRF;
            if (!pTEControlMyTRF)
                return;
            try {
                let tFldInfo: TheFieldInfo = pTEControlMyTRF.FldInfo;
                let tScreenInfo: TheScreenInfo = null;
                if (cdeNMI.MyEngine)
                    tScreenInfo = cdeNMI.MyNMIModels[pTEControlMyTRF.ModelID];
                if (!tFldInfo && pTEControl)
                    tFldInfo = pTEControl.MyFieldInfo;
                if (pTEControl !== pTgtControl) {
                    pTEControl.MyNMIControl = pTgtControl;
                    pTEControl.MyTEContent.AppendChild(pTEControl.MyNMIControl);
                    if (pTgtControl.MyBaseType === cdeControlType.Table) //Possibly remove other control types from further processing
                        return;
                    //ID Management
                    const tID = pTEControl.GetProperty("ID");
                    const tOldID = pTgtControl.GetProperty("ID");
                    pTgtControl.SetProperty("ID", tID);
                    cdeNMI.MyTCF.UnregisterControl(tID, tOldID);
                    if (!pTgtControl.MyTRF)
                        pTgtControl.MyTRF = pTEControlMyTRF;
                    if (!pTgtControl.MyFieldInfo) {
                        pTgtControl.MyFieldInfo = pTEControl.MyFieldInfo;
                    }

                    //Size Management
                    if (!cde.IsNotSet(pTgtControl.GetProperty("NoTE")))
                        pTEControl.SetProperty("NoTE", pTgtControl.GetProperty("NoTE"));
                    if (!cde.IsNotSet(pTgtControl.GetProperty("UseTE")))
                        pTEControl.SetProperty("UseTE", pTgtControl.GetProperty("UseTE"));
                    if (!cde.IsNotSet(pTgtControl.GetProperty("TileFactorX")))
                        pTEControl.SetProperty("TileFactorX", pTgtControl.GetProperty("TileFactorX"));
                    if (!cde.IsNotSet(pTgtControl.GetProperty("TileFactorY")))
                        pTEControl.SetProperty("TileFactorY", pTgtControl.GetProperty("TileFactorY"));
                    if (!cde.CBool(pTEControl.GetProperty("IsInTable"))) {
                        pTEControl.SetProperty("MinTileWidth", pTgtControl.GetProperty("MinTileWidth"));
                        pTEControl.SetProperty("MinTileHeight", pTgtControl.GetProperty("MinTileHeight"));
                        if (cde.CInt(pTgtControl.GetProperty("TileWidth")) > 0)
                            pTEControl.SetProperty("TileWidth", pTgtControl.GetProperty("TileWidth"));
                        if (cde.CInt(pTgtControl.GetProperty("TileHeight")) > 0)
                            pTEControl.SetProperty("TileHeight", pTgtControl.GetProperty("TileHeight"));
                        if (cde.CBool(pTgtControl.GetProperty("ShowOverflow")))
                            pTEControl.MyTEContainer.GetElement().style.overflow = "initial";
                        pTgtControl.SetProperty("ControlTW", cde.CInt(pTEControl.GetProperty("ControlTW")));
                        pTgtControl.SetProperty("ControlTH", cde.CInt(pTEControl.GetProperty("ControlTH")));
                    }
                }

                pTgtControl.RegisterNMIControl();
                if (tFldInfo && tFldInfo.DataItem) {
                    pTgtControl.SetProperty("DataItem", tFldInfo.DataItem);
                }
                let tDataRow = null;
                if (tScreenInfo && tScreenInfo.MyStorageMirror[pTEControlMyTRF.TableName]) {
                    tDataRow = tScreenInfo.MyStorageMirror[pTEControlMyTRF.TableName][pTgtControl.MyTRF ? pTgtControl.MyTRF.RowNo : 0];
                    let tFldContentLC: string = cdeNMI.GetFldContent(tDataRow, pTgtControl.MyFieldInfo, tScreenInfo.IsGenerated, false);
                    if (!cde.IsNotSet(tFldContentLC)) {
                        if (pTgtControl.MyFieldInfo && pTgtControl.MyFieldInfo && pTgtControl.MyFieldInfo.Type === cdeControlType.Picture && tFldContentLC && tFldContentLC.length > 255)
                            tFldContentLC = "data:image/jpeg;base64," + tFldContentLC;
                        pTgtControl.SetProperty("iValue", tFldContentLC);
                    }
                    tFldInfo["OnClick"] = cdeNMI.GenerateFinalString(tFldInfo["OnClick"], tDataRow);
                    cdeNMI.ThePB.SetRawProperty(pTgtControl, "OnThingEvent", tFldInfo["OnThingEvent"], tDataRow, tScreenInfo.IsLiveForm);
                }
                else {
                    if (tFldInfo["OnThingEvent"] && tScreenInfo.IsLiveForm === true)
                        cdeNMI.ThePB.SetRawProperty(pTgtControl, "OnThingEvent", tFldInfo["OnThingEvent"], null, tScreenInfo.IsLiveForm);
                    if (tFldInfo["DefaultValue"] && !pTgtControl.GetProperty("Value"))
                        pTgtControl.SetProperty("iValue", tFldInfo["DefaultValue"]);
                }
                tFldInfo["Title"] = cdeNMI.GenerateFinalString(tFldInfo["Title"], tDataRow);
                if (!cde.CBool(pTEControl.GetProperty("IsInTable")) &&
                    !cde.CBool(tFldInfo["IsInTable"])) {
                    if (tFldInfo["Options"])
                        tFldInfo["OptionsLive"] = cdeNMI.GenerateFinalString(tFldInfo["Options"], tDataRow);
                    if (tFldInfo && tFldInfo.PropertyBag && tFldInfo.PropertyBag.length > 0) {
                        cdeNMI.ThePB.SetPropertiesFromBag(pTEControl, tFldInfo.PropertyBag,
                            (tScreenInfo && tScreenInfo.MyStorageMirror[pTEControlMyTRF.TableName]) ? tScreenInfo.MyStorageMirror[pTEControlMyTRF.TableName][pTgtControl.MyTRF ? pTgtControl.MyTRF.RowNo : 0] : null,
                            tScreenInfo ? tScreenInfo.IsLiveForm : false,
                            cde.CBool(pTEControl.GetProperty("IsInTable")));
                    }

                    if (tScreenInfo && pTEControlMyTRF.FldInfo) {
                        const tFormInfo: TheFormInfo = tScreenInfo.MyStorageMeta[cde.GuidToString(pTEControlMyTRF.FldInfo.FormID)];
                        if (tFormInfo && tFormInfo.IsUsingAbsolute && cde.CInt(tFldInfo["ParentFld"]) === 0) {
                            pTEControl.SetProperty("IsAbsolute", true);
                        }
                    }
                    if (pTEControl.GetProperty("RenderTarget")) {
                        const tTarget: string = cdeNMI.GenerateFinalString(pTEControl.GetProperty("RenderTarget"), false, pTEControl.MyTRF); //.replace("%ID%", this.GetProperty("ID"));
                        pTEControl.FindRenderTarget(tTarget);
                    }
                }
                pTgtControl.SetProperty("TabIndex", !pTgtControl.MyTarget || cde.CBool(pTgtControl.MyTarget.GetProperty("IsUnloaded")) ? -1 : tFldInfo.FldOrder);
                const tPos: number = pTgtControl.MyTarget.MyChildren.indexOf(pTgtControl);
                if (tPos >= 0)
                    pTgtControl.MyTarget.MyChildren.splice(tPos, 1);
                pTgtControl.MyTarget.MyChildren.push(pTgtControl);

                pTgtControl.ApplySkin();
            }
            catch (eee) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "TileEntry:SetControlEssentials", eee.message + ":" + eee.stack);
                if (pTEControl)
                    pTEControl.SetProperty("PlaceHolder", eee.message);
            }
        }

        public ToggleGroup(pScreenID: string, pPara: string) {
            if (!pScreenID || !pPara) return;
            const tCtrl: INMIControl = cdeNMI.MyTCF.GetRegisteredControl("TABLES", cde.GuidToString(pScreenID)); // cdeNMI.MyEngine.MyNMIControls["TABLES"][cde.GuidToString(pScreenID)];
            if (tCtrl) {
                const tV: string[] = pPara.split(':');
                const tGroup: string = tV[0];
                let tID: string = tV.length > 1 ? tV[1] : null;
                if (tV.length > 2 && tCtrl.MyBaseType === cdeControlType.FormView) {
                    const tForm: INMIDataView = tCtrl as cdeNMI.INMIDataView;
                    let tRealCondition = "";
                    try {
                        if (tV.length > 3) {
                            tRealCondition = tForm.ReplaceMarcos(tV[3], tForm.MyFormControls);
                            const IsTrue = cde.cdeEval(tRealCondition);
                            if (IsTrue)
                                tID = tV[2];
                        } else {
                            tID = tForm.ReplaceMarcos(tV[2], tForm.MyFormControls);
                        }
                    }
                    catch (e) {
                        //cdeNMI.ShowToastMessage("Validating Hide-Condition Error:" + e, "in: (" + tHideCondition + ") resolved to<br/>" + tRealCondition);
                        cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "Validating Group-Condition Error:" + e, "in: (" + pPara + ") resolved to<br/>" + tRealCondition);
                    }
                }
                tCtrl.SetProperty("StartGroup", pPara);
                this.ToggleChildren(tCtrl, tGroup, tID);
            }
        }

        public ToggleChildren(pControl: INMIControl, pGroup: string, pID: string) {
            for (const iPC in pControl.MyChildren) {
                if (pControl.MyChildren.hasOwnProperty(iPC)) {
                    const tCtrl: INMIControl = pControl.MyChildren[iPC];
                    if (tCtrl.GetProperty("Group")) {
                        if (tCtrl.GetProperty("Group").toString().startsWith(pGroup)) {
                            if (pID === null || tCtrl.GetProperty("Group") !== pGroup + ":" + pID) {
                                if (tCtrl.MyBaseType === cdeControlType.CollapsibleGroup)
                                    tCtrl.ToggleDrop(false, true);
                                else {
                                    tCtrl.SetProperty("Visibility", false);
                                    if (tCtrl.GetTE())
                                        tCtrl.GetTE().SetProperty("Visibility", false);
                                }
                            } else {
                                if (tCtrl.MyBaseType === cdeControlType.CollapsibleGroup)
                                    tCtrl.ToggleDrop(true, true);
                                else {
                                    tCtrl.SetProperty("Visibility", true);
                                    if (tCtrl.GetTE())
                                        tCtrl.GetTE().SetProperty("Visibility", true);
                                }
                            }
                        }
                    } else if (tCtrl.MyBaseType === cdeNMI.cdeControlType.TileButton && typeof tCtrl.GetProperty("OnClick") === "string") {
                        const tOncl: string = tCtrl.GetProperty("OnClick");
                        if (tOncl === "GRP:" + pGroup + ":" + pID) {
                            if (!tCtrl.GetElement().classList.contains("cdeTabSelected"))
                                tCtrl.GetElement().classList.add("cdeTabSelected");
                            if (tCtrl.GetElement().classList.contains("cdeTabNotSelected"))
                                tCtrl.GetElement().classList.remove("cdeTabNotSelected");
                        } else if (tOncl.startsWith("GRP:" + pGroup)) {
                            if (!tCtrl.GetElement().classList.contains("cdeTabNotSelected"))
                                tCtrl.GetElement().classList.add("cdeTabNotSelected");
                            if (tCtrl.GetElement().classList.contains("cdeTabSelected"))
                                tCtrl.GetElement().classList.remove("cdeTabSelected");
                        }
                    }
                    this.ToggleChildren(tCtrl, pGroup, pID);
                }
            }
        }

        public FireControls(pProcessMessage: cde.TheProcessMessage): boolean {
            if (!pProcessMessage || !pProcessMessage.Message) return false;

            const IsSETP: boolean = ((pProcessMessage.Message.TXT.substr(0, 5) === 'SETNP' || pProcessMessage.Message.TXT.substr(0, 6) === 'SETFNP') && !(!pProcessMessage.Message.PLS)); //Tuning - UX Properties only
            const tOWN: string = (pProcessMessage.Message && pProcessMessage.Message.OWN) ? cde.GuidToString(pProcessMessage.Message.OWN) : null; //Tuning
            let tProps: string[] = null; //Tuning
            let tInfo;
            let tControl: INMIControl;
            if (IsSETP) {
                tProps = pProcessMessage.Message.PLS.split(":;:");
                if (tOWN && tProps) {
                    let tIsTP: string = null;
                    let tTargetControl: cdeControlType = cdeControlType.BaseControl;
                    let tFldOrder = -1;
                    const tp = pProcessMessage.Message.TXT.split(":");
                    if (pProcessMessage.Message.TXT.substr(0, 6) === 'SETFNP') {
                        if (tp.length > 1) {
                            tIsTP = cde.GuidToString(tp[1]);
                        }
                    }
                    if (tp.length > 2) {
                        const tCtrlParts = tp[2].split(';');
                        tTargetControl = cde.CInt(tCtrlParts[0]) as cdeControlType;
                        if (tCtrlParts.length > 1)
                            tFldOrder = cde.CInt(tCtrlParts[1]);
                    }

                    const myNmiControl = cdeNMI.MyTCF.GetRegisteredControlGroup(tOWN);
                    for (tInfo in myNmiControl) {
                        if (myNmiControl.hasOwnProperty(tInfo)) {
                            tControl = myNmiControl[tInfo];
                            if (tIsTP && tIsTP !== "NULL" && tControl && tInfo !== tIsTP)
                                continue;
                            for (let i = 0; i < tProps.length; i++) {
                                const pos = tProps[i].indexOf("=");
                                const tPName = pos < 0 ? tProps[i] : tProps[i].substr(0, pos);
                                if (pos < 0) {
                                    tControl.SetProperty(tProps[i], true);
                                } else {
                                    if (pos > 0 && pos < tProps[i].length) {
                                        let tPV = "";
                                        if (pos < tProps[i].length - 1)
                                            tPV = tProps[i].substr(pos + 1);
                                        if (tPV.substr(0, 11) !== "&^CDESP1^&:") {
                                            if (tTargetControl > 0 && tControl.MyBaseType > 0 && tControl.MyBaseType !== tTargetControl)
                                                continue;
                                            if (tFldOrder >= 0 && tControl.MyTRF && tControl.MyTRF.FldInfo && tControl.MyTRF.FldInfo.FldOrder !== tFldOrder)
                                                continue;
                                            if (tControl.GetTE())
                                                cdeNMI.ThePB.SetRawProperty(tControl.GetTE(), tPName.trim(), tPV.trim());
                                            else
                                                cdeNMI.ThePB.SetRawProperty(tControl, tPName.trim(), tPV.trim());
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else {
                if (tOWN) {
                    const myNmiThingEvent = cdeNMI.MyNMIThingEvents[tOWN];
                    for (tInfo in myNmiThingEvent) {
                        if (myNmiThingEvent.hasOwnProperty(tInfo)) {
                            tControl = myNmiThingEvent[tInfo];
                            tControl.FireEvent(false, "SETP", pProcessMessage);
                        }
                    }
                }
                else {
                    return false;
                }
            }
            return true;
        }

        stringToFunction = function (str) {
            const arr = str.split(".");

            const fn = (window) as any;
            let outFn = fn;
            for (let i = 0, len = arr.length; i < len; i++) {
                outFn = outFn[arr[i]];
            }

            if (typeof outFn !== "function") {
                throw new Error("function not found");
            }

            return outFn;
        };

        public static AddAdHocSmartControl(pParent: INMIControl, pID: string, pType: cdeControlType, pHeader?: string, pFlags?: number, pBag?: Array<string>): INMITileEntry {
            const tTRF: cdeNMI.TheTRF = new cdeNMI.TheTRF("NOTABLE", 0, cdeNMI.TheFieldInfo.NewTFI(pType, 0, pHeader, pFlags, pBag));
            const tTileEntry = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileEntry).Create(pParent, { TRF: tTRF }) as INMITileEntry;
            tTileEntry.CreateControl(pID);
            return tTileEntry;
        }
    }
    export const MyTCF: TheControlFactory = new TheControlFactory();
}