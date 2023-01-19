// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿
namespace cdeNMI {
    /////////////////////////////////////////////////////////////////////////
    /////***********************************************
    /////   C-DMyForms GENERATOR
    /////***********************************************
    /**
    * Creates a complete form for a given StorageMirror
    *
    * (4.1 Ready!)
    */
    export class ctrlFormView extends TheDataViewBase implements INMIDataView {
        constructor(pTRF?: TheTRF) {
            super(pTRF);
        }

        MyScreenInfo: TheScreenInfo = null;
        MyFormInfo: TheFormInfo = null;
        mBaseDiv: HTMLDivElement = null;
        formMain: INMIControl = null;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.FormView;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            if (!this.MyTRF) { 
                return false;
            }

            this.MyTableName = cde.GuidToString(this.MyTRF.TableName);
            this.MyStorageName = this.GetSetting("TableReference");
            if (!this.MyStorageName)
                this.MyStorageName = this.MyTableName;
            this.MyScreenInfo = cdeNMI.MyNMIModels[this.MyScreenID];
            const pClassName = 'CMyForm';

            let tRenderTarget: string = null; 
            if (!tRenderTarget)
                tRenderTarget = 'Inline_' + cde.GuidToString(this.MyTableName);
            const tDiv: HTMLDivElement = document.getElementById(tRenderTarget) as HTMLDivElement;
            if (tDiv)
                this.mBaseDiv = tDiv;

            if (!this.mBaseDiv && !pTargetControl && this.MyScreenInfo.MyStorageMeta[this.MyTableName]) {
                this.mBaseDiv = document.getElementById('Content_' + cde.GuidToString(this.MyScreenInfo.MyStorageMeta[this.MyTableName].TargetElement)) as HTMLDivElement;
            }

            if (!this.mBaseDiv) {
                this.mBaseDiv = document.createElement("div");
                this.mBaseDiv.className = pClassName;
                if (this.MyTarget) {
                    const tF: INMIDataView = cdeNMI.MyTCF.GetRegisteredControl("TABLES", this.MyTableName) as INMIDataView;
                    if (tF)
                        tF.RemoveFormHooks(tF.MyFormControls);
                    this.MyTarget.GetElement().innerHTML = "";    //OK
                }
            }
            else {
                const tF: INMIDataView = cdeNMI.MyTCF.GetRegisteredControl("TABLES", this.MyTableName) as INMIDataView;
                if (tF)
                    tF.RemoveFormHooks(tF.MyFormControls);
                this.mBaseDiv.innerHTML = "";    //OK
            }
            this.mBaseDiv.style.width = "inherit";
            this.mBaseDiv.style.height = "inherit";
            this.mBaseDiv.style.margin = "auto";
            this.SetElement(this.mBaseDiv);

            const tCurrentRow = cde.CInt(this.MyTRF.RowNo);
            if (this.MyFieldInfo && cde.CBool(this.MyFieldInfo["ILF"]) && !this.MyScreenInfo.IsLiveForm)
                this.MyScreenInfo.IsLiveForm = true;

            if (!this.MyScreenInfo.IsLiveForm && !this.MyScreenInfo.MyStorageMirror[this.MyStorageName] && !this.MyScreenInfo.MyStorageMeta[this.MyTableName]) {
                this.formMain = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(this);
                cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.formMain, { PreInitBag: ["Element=h1"], PostInitBag: ["iValue=Neither meta-data nor storage data defined"] });
            }
            else {
                if ((this.MyScreenInfo.IsLiveForm || this.MyScreenInfo.MyStorageMirror[this.MyStorageName]) && tCurrentRow >= 0) {
                    cdeNMI.MyEngine.RegisterEvent("RecordUpdated_" + this.MyStorageName + "_" + tCurrentRow, (pSI: cdeNMI.INMIControl, pModelGUID: string, tTabName: string, tRowID: number) => {
                        //Updates a form from changes in the corresponding table p- but no templates or wizards (they should always be blank)
                        if (pModelGUID && pModelGUID !== "" && !this.GetSetting("TableReference")) {
                            const tMod: TheScreenInfo = cdeNMI.MyNMIModels[pModelGUID];
                            for (const cc in this.MyFormControls) {
                                const tN = this.MyFormControls[cc].GetProperty("DataItem");
                                if (tN) {
                                    if (!Object.prototype.hasOwnProperty.call(tMod.MyStorageMirror[tTabName][tRowID], 'SecToken')) {
                                        const tCont = cdeNMI.GetFldContent(tMod.MyStorageMirror[tTabName][tRowID], this.MyFormControls[cc].MyFieldInfo, this.MyScreenInfo.IsGenerated);
                                        if (this.MyFormControls[cc].GetProperty("Value") !== tCont)
                                            this.MyFormControls[cc].SetProperty("iValue", tCont);
                                    }
                                }
                            }
                            this.ValidateRules(pModelGUID, null, tTabName, tRowID, this.MyFormControls, true, false);    //Runs values change in a table against the form - no push to Relay
                        }
                    });
                    if (!this.MyScreenInfo.IsLiveForm) {
                        if (!this.MyScreenInfo.MyStorageMirror[this.MyStorageName][tCurrentRow] || !this.MyScreenInfo.MyStorageMirror[this.MyStorageName][tCurrentRow].cdeM || this.MyScreenInfo.MyStorageMirror[this.MyStorageName][tCurrentRow].cdeM === "") {
                            if (!this.MyScreenInfo.MyStorageMeta[this.MyTableName] || this.MyScreenInfo.MyStorageMeta[this.MyTableName].FormFields.length === 0) {
                                if (!this.MyScreenInfo.MyStorageMeta[this.MyTableName]) {
                                    this.MyScreenInfo.MyStorageMeta[this.MyTableName] = new cdeNMI.TheFormInfo();
                                    this.MyScreenInfo.MyStorageMeta[this.MyTableName].FormTitle = this.MyTableName;
                                    this.MyScreenInfo.MyStorageMeta[this.MyTableName].FormFields = [];
                                }
                                this.CreateFormInfo(this.MyScreenInfo.MyStorageMirror[this.MyStorageName][tCurrentRow], "", this.MyScreenInfo.MyStorageMeta[this.MyTableName], 0);
                                this.MyScreenInfo.IsGenerated = true;
                            }
                        }
                        else {
                            this.MyScreenInfo.MyStorageMeta[this.MyTableName] = JSON.parse(this.MyScreenInfo.MyStorageMirror[this.MyStorageName][tCurrentRow].cdeM);
                        }
                    }
                }

                if (!this.MyScreenInfo.MyStorageMeta[this.MyTableName] || this.MyScreenInfo.MyStorageMeta[this.MyTableName].FormFields.length === 0) {
                    this.formMain = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(this);
                    cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(this.formMain, { PreInitBag: ["Element=h1"], PostInitBag: ["iValue=This form does not contain any controls, yet"] });
                }
                else {
                    this.MyFormInfo = this.MyScreenInfo.MyStorageMeta[this.MyTableName];
                    let tC: INMIControl = this;
                    if (this.MyFormInfo.IsUsingAbsolute) {
                        tC = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(this);
                        tC.SetProperty("ClassName", "cdeRelativeDiv");
                    }
                    this.formMain = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(tC); 
                    (this.formMain as any).cdeMID = this.MyScreenInfo.cdeMID; 
                    if (this.MyFieldInfo && this.MyFieldInfo["TitleClassName"])
                        this.formMain.SetProperty("LabelClassName", this.MyFieldInfo["TitleClassName"]);
                    else
                        this.formMain.SetProperty("LabelClassName", "cdeFormTitle");
                    this.formMain.SetProperty("IsSmall", true);
                    this.formMain.SetProperty("Float", "none");
                    this.formMain.SetProperty("HidePins", true);
                    if (this.MyFormInfo.IsUsingAbsolute) {
                        this.formMain.SetProperty("ClassName", "CMyCanvas");
                    } else {
                        this.formMain.SetProperty("ClassName", "cdeInnerForm")
                    }

                    //Set Form Properties from Bag
                    const tCap = cdeNMI.ThePB.GetValueFromBagByName(this.MyFormInfo.PropertyBag, "Caption");
                    if (tCap && cdeNMI.MyScreenManager) {
                        const tSCreen = cdeNMI.MyScreenManager.GetScreenByID(this.MyTableName);
                        if (tSCreen)
                            tSCreen.SetProperty("Caption", tCap);
                        cdeNMI.ThePB.RemoveProperty(this.MyFormInfo.PropertyBag, "Caption");
                    }
                    const bUseMargin = cde.CBool(cdeNMI.ThePB.GetValueFromBagByName(this.MyFormInfo.PropertyBag, "UseMargin"));

                    cdeNMI.ThePB.SetPropertiesFromBag(this.formMain, this.MyFormInfo.PropertyBag);
                    if (this.MyFormInfo.IsUsingAbsolute) {
                        tC.SetProperty("TileWidth", this.formMain.GetProperty("TileWidth"));
                        tC.SetProperty("TileHeight", this.formMain.GetProperty("TileHeight"));
                    } else {
                        this.formMain.GetElement().style.width = "fit-content";
                        this.formMain.GetElement().style.maxWidth = "unset";
                    }

                    let tRowID: string = null;
                    if (this.MyScreenInfo.MyStorageMirror[this.MyStorageName] && tCurrentRow >= 0) {
                        this.MyDataRow = this.MyScreenInfo.MyStorageMirror[this.MyStorageName][tCurrentRow];
                        if (this.MyScreenInfo.MyStorageMirror[this.MyStorageName][tCurrentRow] && this.MyScreenInfo.MyStorageMirror[this.MyStorageName][tCurrentRow].cdeMID)
                            tRowID = this.MyScreenInfo.MyStorageMirror[this.MyStorageName][tCurrentRow].cdeMID;
                    }
                    const tFormFields: TheFieldInfo[] = cdeNMI.SortArrayByProperty<TheFieldInfo>(this.MyFormInfo.FormFields, "FldOrder", true, false);
                    for (const tFldInfo of tFormFields) {
                        if (tFldInfo && (tFldInfo.Flags & 16) !== 0) continue;   //Skip if NoShowInForm is set
                        const tFldID: string = this.MyStorageName + '_' + tCurrentRow + '_' + tFldInfo.FldOrder;

                        //Set tFldInfo with Extra Properties from PropertyBag
                        ThePB.ConvertPropertiesFromBag(tFldInfo);

                        //Calculate Parent Field
                        let fldParent: INMIControl = this.formMain;
                        const PFldNo: number = cde.CInt(tFldInfo["ParentFld"]);
                        if (PFldNo > 0 && PFldNo < tFldInfo.FldOrder) {
                            if (this.MyFormControls[this.MyStorageName + '_' + tCurrentRow + '_' + PFldNo])
                                fldParent = this.MyFormControls[this.MyStorageName + '_' + tCurrentRow + '_' + PFldNo];
                            else
                                continue; //No draw if parent is not found
                        }

                        //Calculate TRF of Control
                        let tOwnerThingID = this.MyStorageName;
                        const tTRF: TheTRF = new TheTRF(tOwnerThingID, tCurrentRow, tFldInfo);
                        tTRF.RowID = tRowID;
                        tTRF.ModelID = this.MyScreenID;
                        tFldInfo["IsInTable"] = false;
                        switch (tFldInfo.Type) {
                            case cdeControlType.Table:
                                {
                                    const tTE: INMITileEntry = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileEntry).Create(fldParent, { ScreenID: this.MyScreenID, TRF: tTRF, PostInitBag: ["ContentOuterClassName=cdeTableInline", "ContainerClassName=cdeTableTEContainer"] }) as INMITileEntry;
                                    this.MyFormControls[tFldID] = tTE;
                                    if (cdeNMI.MyTCF)
                                        cdeNMI.MyTCF.RegisterControl(cde.GuidToString(tFldInfo.cdeMID), "TE", tTE);
                                    tTE.MyDataView = this;
                                    tTE.CreateControl(tFldID, () => {
                                        //ignored
                                    });
                                    if (tFldInfo && tFldInfo.PropertyBag && tFldInfo.PropertyBag.length > 0) {
                                        cdeNMI.ThePB.SetPropertiesFromBag(tTE, tFldInfo.PropertyBag, null, false, false);
                                    }
                                }
                                continue;
                            case cdeControlType.CollapsibleGroup:
                                this.MyFormControls[tFldID] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.CollapsibleGroup).Create(fldParent, { TRF: tTRF }); 
                                if (bUseMargin === true)
                                    this.MyFormControls[tFldID].SetProperty("UseMargin", true);
                                break;
                            case cdeControlType.TileGroup:
                                this.MyFormControls[tFldID] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(fldParent, { TRF: tTRF });  
                                this.MyFormControls[tFldID].SetProperty("ClassName", "cdeTileGroup");
                                break;
                            case cdeControlType.FormButton:
                                switch (tFldInfo.DataItem) {
                                    case "CDE_DELETE":
                                        if (tFldInfo["TableReference"]) {
                                            this.MyFormControls[tFldID] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(fldParent, { PreInitBag: ["ControlTW=1", "ControlTH=1"], PostInitBag: ["Title=<span class='fa fa-3x'>&#xf1f8;</span>", "ClassName=cdeBadActionButton cdeDeleteButton"] });
                                            this.MyFormControls[tFldID].SetProperty("OnClick", (pSender: INMIControl, evt: KeyboardEvent) => {
                                                const tMe: INMIDataView = pSender as INMIDataView;
                                                if (evt.shiftKey) {
                                                    tMe.DeleteRecord(tMe.MyDataRow);
                                                    cdeNMI.MyScreenManager.TransitToScreen(tFldInfo["TableReference"]);
                                                } else {
                                                    if (cdeNMI.MyPopUp)
                                                        cdeNMI.MyPopUp.Show('Are you sure you want to delete this record? ', false, null, 1, () => {
                                                            tMe.DeleteRecord(tMe.MyDataRow);
                                                            cdeNMI.MyScreenManager.TransitToScreen(tFldInfo["TableReference"]);
                                                        }, null, tMe.MyDataRow, tMe);
                                                }
                                            });
                                            if (!this.MyDataRow)
                                                this.MyFormControls[tFldID].SetProperty("Disabled", true);
                                        }
                                        break;
                                }
                                break;
                            default:
                                {
                                    const tTE: INMITileEntry = cdeNMI.MyTCF.CreateNMIControl(cdeNMI.cdeControlType.TileEntry).Create(fldParent, { ScreenID: this.MyScreenID, TRF: tTRF }) as INMITileEntry;
                                    this.MyFormControls[tFldID] = tTE;
                                    tTE.MyDataView = this;
                                    tTE.CreateControl(tFldID, (e: INMIControl) => {
                                        e.SetProperty("OnValueChanged", (sender: INMIControl) => {
                                            let tLocalOnly: boolean = this.MyFormInfo.IsPostingOnSubmit;
                                            if (this.MyScreenInfo.IsLiveForm && cdeNMI.MyEngine) {
                                                cdeNMI.MyEngine.PublishToNMI('SETP', sender.MyFieldInfo.DataItem + '=' + sender.GetProperty("Value"), sender.MyFieldInfo.cdeO, true); //ThingProperties
                                                tLocalOnly = true;
                                            }
                                            //Checks rules after each ValueChange. tLocalOnly is true for Templates and Wizards
                                            this.ValidateRules(this.MyScreenID, this.MyTableName, this.MyStorageName, sender.MyTRF ? sender.MyTRF.RowNo : 0, this.MyFormControls, tLocalOnly, false); //if IsPostingOnSubmit is true, no push to node
                                        });
                                        if (e.MyBaseType === cdeControlType.TileButton && cde.CBool(e.GetProperty("IsSubmit")) === true) {   //Wizard and Template submit
                                            e.SetProperty("OnClick", (sender: INMIControl) => {
                                                this.ValidateRules(this.MyScreenID, this.MyTableName, this.MyStorageName, sender.MyTRF ? sender.MyTRF.RowNo : 0, this.MyFormControls, false, true); //Submit button pushed - all values will be written and sent to Node
                                                if (!this.PropertyBag["FinishPage"] && !this.PropertyBag["ProcessingPage"]) {
                                                    if (this.PropertyBag["FinishScreenID"]) {
                                                        const tScrParts = this.PropertyBag["FinishScreenID"];
                                                        if (tScrParts === "CLOSE") {
                                                            const tLast: INMIScreen = cdeNMI.MyScreenManager.GetCurrentScreen();
                                                            if (tLast) {
                                                                const tOld: string = tLast.GetProperty("OldScreen");
                                                                if (tOld)
                                                                    cdeNMI.MyScreenManager.TransitToScreen(tOld);
                                                            }
                                                        } else {
                                                            cdeNMI.MyScreenManager.TransitToScreen(tScrParts); // this.PropertyBag["FinishScreenID"]);
                                                        }
                                                    }
                                                    else if (this.MyTRF.FldInfo["TableReference"])
                                                        cdeNMI.MyScreenManager.TransitToScreen(this.MyTRF.FldInfo["TableReference"]);
                                                }
                                            });
                                        }
                                    });
                                }
                                continue;
                        }
                        cdeNMI.MyTCF.SetControlEssentials(this.MyFormControls[tFldID], this.MyFormControls[tFldID], tTRF);
                    }
                }
            }
            this.ValidateRules(this.MyScreenID, this.MyTableName, this.MyStorageName, tCurrentRow, this.MyFormControls, true, false); //Just verify all rules on the form
            cdeNMI.TheFlashCache.FlushCache();
            this.RegisterEvent("RRT", () => { this.RenderRenderTargets(); });
            this.SetProperty("ID", "FORM_" + this.MyTableName);
            this.RegisterNMIControl();
            return true;
        }

        OnLoad(bIsVisible?: boolean) {
            if (this.GetProperty("TTSCookie") && cdeNMI.MyScreenManager) {
                const tRID: string = this.GetProperty("TTSCookie");
                this.SetProperty("TTSCookie", null);
                cdeNMI.MyScreenManager.CreateDataViewScreen(this.MyScreenInfo, null, this.MyTableName, this.GetProperty("ExtraInfo"), this.MyTableName, false, tRID);
                return;
            } else {
                if (this.MyFieldInfo && this.MyFieldInfo["TableReference"] && this.MyFormInfo.IsAlwaysEmpty === true) {
                    cdeNMI.MyScreenManager.CreateDataViewScreen(this.MyScreenInfo, null, this.MyTableName, this.GetProperty("ExtraInfo"), this.MyTableName, true);
                }
            }
            if (this.GetProperty("StartGroup"))
                this.SetProperty("SetGroup", "GRP:" + this.GetProperty("StartGroup"));
            super.OnLoad(bIsVisible);
        }

        OnLoaded() {
            super.OnLoad();
        }

        public SetProperty(pName: string, pValue) {
            if (pName === "TileWidth") {
                if (cde.CBool(this.GetProperty("UseMargin")))
                    pValue = cde.CInt(pValue) + 1;
            }
            super.SetProperty(pName, pValue);
            if (pName === "SetGroup") {
                cdeNMI.MyTCF.ToggleGroup(this.MyTableName, pValue.substr(4));
            }
        }

        public ResetData(): boolean {
            for (const i in this.MyFormControls) {
                const tF: INMIControl = this.MyFormControls[i];
                if (tF.MyBaseType === cdeControlType.TileEntry) {
                    tF.MyNMIControl.SetToDefault(false);
                }
            }
            return false;
        }

        public ReloadData(): boolean {
            for (const i in this.MyFormControls) {
                const tF: INMIControl = this.MyFormControls[i];
                if (cde.CBool(tF.GetProperty("IsRefresh"))) {
                    if (tF.MyBaseType === cdeControlType.TileEntry)
                        tF.DoFireClick(tF.MyNMIControl);
                    else
                        tF.DoFireClick(tF);
                    return true;
                }
            }
            return false;
        }

        RenderRenderTargets() {
            if (!this.MyFormInfo)
                return;
            const tFormFields: TheFieldInfo[] = cdeNMI.SortArrayByProperty<TheFieldInfo>(this.MyFormInfo.FormFields, "FldOrder", true, false);
            for (const tFldInfo of tFormFields) {
                if (tFldInfo && (tFldInfo.Flags & 16) !== 0) continue;

                if (tFldInfo["RenderTarget"]) {
                    const tCurrentRow: number = cde.CInt(this.MyTRF.RowNo);
                    const tFldID: string = this.MyTableName + '_' + tCurrentRow + '_' + tFldInfo.FldOrder;
                    const tTRF: TheTRF = new TheTRF(this.MyTableName, tCurrentRow, tFldInfo);
                    tTRF.ModelID = this.MyScreenID;
                    const tTarget = cdeNMI.GenerateFinalString(tFldInfo["RenderTarget"], false, tTRF);
                    const tCtrl: INMIControl = this.MyFormControls[tFldID];
                    tCtrl.FindRenderTarget(tTarget);
                }
            }
        }

        public DeleteRecord(pDataRow) {
            if (cdeNMI.MyEngine)
                cdeNMI.MyEngine.PublishToNMI('NMI_DEL_ID:' + this.MyTableName + ":" + pDataRow.cdeMID, pDataRow.cdeN);
        }
    }
}