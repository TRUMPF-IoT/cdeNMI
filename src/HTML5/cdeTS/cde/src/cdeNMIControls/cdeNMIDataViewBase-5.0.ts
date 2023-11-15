// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {
    export class TheDataViewBase extends TheNMIBaseControl implements INMIDataView {
        constructor(pTRF?: TheTRF) {
            super(null, null);
        }

        public MyTableControls: INMIControl[][] = [];
        public MyFormControls: INMIControl[] = new Array<INMIControl>(); //TODO:4.1 Merge the two!
        MyDataRow: cde.TheMetaDataBase;
        MyTableName: string = null;
        MyStorageName: string = null;
        MyAdderRow: INMIControl[] = null;

        public GetControlByFldNo(pRowNo: number, pFld: number): INMIControl {
            if (!this.MyTRF)
                return null;
            if (this.MyAdderRow) {
                return this.MyAdderRow[this.MyTRF.TableName + "_" + pFld];
            } else {
                if (this.MyBaseType === cdeControlType.FormView) {
                    if (this.MyTRF.FldInfo["TableReference"])
                        return this.MyFormControls[this.MyTRF.FldInfo["TableReference"] + "_" + pRowNo + "_" + pFld];
                    else
                        return this.MyFormControls[this.MyTRF.TableName + "_" + pRowNo + "_" + pFld];
                }
                else
                    return this.MyTableControls[pRowNo][this.MyTRF.TableName + "_" + pRowNo + "_" + pFld];
            }
        }
        public ValidateRules(pScreenID: string, pFormID: string, pTableName: string, pTRF: TheTRF, pFldEntries: INMIControl[], pLocalOnly: boolean, pForceWrite: boolean): boolean {
            const tModel: cdeNMI.TheScreenInfo = cdeNMI.MyNMIModels[pScreenID];
            if (!pFormID)
                pFormID = this.MyTableName;

            if (!tModel.MyStorageMeta[pFormID] || tModel.MyStorageMeta[pFormID].AreRulesRunning === true)
                return false;
            let tRowNo = 0;
            if (pTRF) tRowNo = pTRF.RowNo;
                
            tModel.MyStorageMeta[pFormID].AreRulesRunning = true;
            try {
                let bIsDirty = false;
                let tID = "";
                let tFldInfo: TheFieldInfo = null;
                let tFldEntry: INMIControl = null;
                let tDirtyMask = "";
                const tOldValues: [] = [];
                let RowData = null;
                if (tModel.MyStorageMirror[pTableName])
                    RowData = tModel.MyStorageMirror[pTableName][tRowNo];
                if (!RowData)
                    RowData = {};
                if (RowData.cdeMID)
                    tID = RowData.cdeMID;
                if (RowData.hasOwnProperty('SecToken'))
                    RowData.SecToken = 'CDE!';
                RowData.nmiTableName = pTableName;
                RowData.nmiScreenID = pScreenID;
                const tScreen: INMIScreen = cdeNMI.MyScreenManager.GetScreenByID(pFormID);
                if (tScreen && tScreen.GetProperty("MyOwnerTable"))
                    RowData.nmiOwner = tScreen.GetProperty("MyOwnerTable");
                let j: number;
                for (j = 0; j < tModel.MyStorageMeta[pFormID].FormFields.length; j++) {
                    try {
                        tFldInfo = tModel.MyStorageMeta[pFormID].FormFields[j];
                        if (!tFldInfo) continue;
                        tFldEntry = pFldEntries[pTableName + "_" + tRowNo + "_" + tFldInfo.FldOrder];
                        let WasDirty = false;
                        if (tFldEntry && tFldInfo.Type !== cdeControlType.CollapsibleGroup && tFldInfo.Type !== cdeControlType.TileGroup) {   //TODO: do not process any control that uses the OnUpdateName with Format!
                            if (tFldEntry.MyNMIControl && tFldEntry.MyNMIControl.MyBaseType !== 27)
                                tFldEntry = tFldEntry.MyNMIControl;

                            if (!pLocalOnly && tFldInfo && tFldInfo.DataItem && (((tFldInfo.Flags & 2) !== 0 && !cde.CBool(tFldInfo["WriteOnce"])) || pForceWrite)) {
                                let tNewValue = tFldEntry.GetProperty("Value");
                                if (!tFldEntry.IsDirty && tFldInfo["DefaultValue"] && (cde.IsNotSet(tNewValue) || tNewValue === tFldInfo["DefaultValue"])) {
                                    tNewValue = tFldInfo["DefaultValue"];
                                    tFldEntry.IsDirty = true;
                                }
                                if (tFldEntry.IsDirty) {
                                    tFldEntry.IsDirty = false;
                                    if (cdeNMI.UpdFldContent(RowData, tFldInfo, tNewValue, tOldValues)) {
                                        bIsDirty = true;
                                        WasDirty = true;
                                    }
                                }
                            }
                            if (tFldEntry) {
                                for (const tDItem in tFldEntry.MyDataItems) {
                                    if (tFldEntry.MyDataItems.hasOwnProperty(tDItem)) {
                                        const pVal = tFldEntry.MyDataItems[tDItem];
                                        let nVal = cdeNMI.GenerateFinalString(pVal, RowData);
                                        if (nVal === pVal) {
                                            nVal = cdeNMI.GenerateFinalString(pVal, pFldEntries);
                                        }
                                        tFldEntry.SetProperty(tDItem, nVal);
                                    }
                                }
                            }
                            if (pForceWrite || ((!pTRF || pTRF.FldInfo.cdeO == tFldInfo.cdeO) && (((tFldInfo.Flags & 2) !== 0 && !cde.CBool(tFldInfo["WriteOnce"])) || WasDirty)))
                                tDirtyMask += "1";
                            else
                                tDirtyMask += "0";
                        } else
                            tDirtyMask += "0";
                    }
                    catch (ext) {
                        cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "Validator:Error:" + ext, ext.stack);
                    }
                }
                if (bIsDirty || pForceWrite) {
                    if (!pLocalOnly || pForceWrite) {
                        if (RowData.hasOwnProperty('SecToken') && cde.MyContentEngine) {
                            if (RowData.SecToken === "")
                                RowData.SecToken = cde.MyContentEngine.RSAEncrypt("CDE!");   //Attention: Token can exceed encryptable Size!
                            else
                                RowData.SecToken = cde.MyContentEngine.RSAEncrypt(RowData.SecToken);   //Attention: Token can exceed encryptable Size!
                        }
                        if (cdeNMI.MyEngine) {
                            if (tID === "")
                                cdeNMI.MyEngine.PublishToNMI('NMI_INS_DATA:' + pTableName + ':' + pScreenID + ':' + pFormID, JSON.stringify(RowData), tModel.cdeN);
                            else
                                cdeNMI.MyEngine.PublishToNMI('NMI_UPD_DATA:' + pTableName + ':' + tID + ':' + pScreenID + ':' + tDirtyMask, JSON.stringify(RowData), RowData.cdeN);
                        }
                    }
                    if (cdeNMI.MyEngine && tID !== "")
                        cdeNMI.MyEngine.FireEvent(false, "RecordUpdated_" + pTableName + "_" + tRowNo, cde.GuidToString(tModel.cdeMID), pTableName, tRowNo, tDirtyMask, pTRF);
                }

                for (j = 0; j < tModel.MyStorageMeta[pFormID].FormFields.length; j++) {
                    tFldInfo = tModel.MyStorageMeta[pFormID].FormFields[j];
                    tFldEntry = pFldEntries[pTableName + "_" + tRowNo + "_" + tFldInfo.FldOrder];
                    let IsHidden = false;
                    const tHideCondition: string = tFldInfo["HideCondition"];
                    if (tHideCondition && tHideCondition !== "") {
                        let tRealCondition = "";
                        try {
                            tRealCondition = cdeNMI.GenerateFinalString(tHideCondition, RowData);
                            IsHidden = cde.cdeEval(tRealCondition);
                        }
                        catch (e) {
                            //cdeNMI.ShowToastMessage("Validating Hide-Condition Error:" + e, "in: (" + tHideCondition + ") resolved to<br/>" + tRealCondition);
                            cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "Validating Hide-Condition Error:" + e, "in: (" + tHideCondition + ") resolved to<br/>" + tRealCondition);
                            IsHidden = true;
                        }
                    }
                    let IsGreyd = false;
                    const tGrayCondition: string = tFldInfo["GreyCondition"];
                    if (tGrayCondition && tGrayCondition !== "") {
                        let tRealCondition = "";
                        try {
                            tRealCondition = cdeNMI.GenerateFinalString(tGrayCondition, RowData);
                            IsGreyd = cde.cdeEval(tRealCondition);
                        }
                        catch (e) {
                            //cdeNMI.ShowToastMessage("Validating Gray-Condition Error:" + e, "in: (" + tGrayCondition + ") resolved to<br/>" + tRealCondition);
                            cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "Validating Gray-Condition Error:" + e, "in: (" + tGrayCondition + ") resolved to<br/>" + tRealCondition);
                            IsGreyd = true;
                        }
                    }

                    if (tFldEntry) {
                        if (tHideCondition && tHideCondition !== "") {
                            tFldEntry.SetProperty("Visibility", !IsHidden);
                        }
                        if (tGrayCondition && tGrayCondition !== "") {
                            tFldEntry.SetProperty("Disabled", IsGreyd);
                        }
                    }
                }
            }
            catch (eee) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "Validator:Error", eee);
            }
            tModel.MyStorageMeta[pFormID].AreRulesRunning = false;
            return true;
        }

        public SortTableByProperty(pTable: [], pDataItem: string, IsNumeric: boolean, pSortDescending: boolean) {
            if (!pTable) return [];
            return pTable.sort((a, b) => {
                let c;
                let d;
                if (pDataItem.indexOf('.') > 0) {
                    c = cdeNMI.GetFldContentByName(a, pDataItem, false);
                    d = cdeNMI.GetFldContentByName(b, pDataItem, false);
                    if (IsNumeric) {
                        c = cde.CDbl(c);
                        d = cde.CDbl(d);
                    }
                }
                else {
                    c = IsNumeric ? cde.CDbl(a[pDataItem]) : cde.CStr(a[pDataItem]);
                    d = IsNumeric ? cde.CDbl(b[pDataItem]) : cde.CStr(b[pDataItem]);
                }
                if (c === d) return 0;
                return pSortDescending ? d > c ? 1 : -1 : d < c ? 1 : -1;
            });
        }

        public ReplaceMarcos(tInStr: string, pFormControls: INMIControl[]): string {
            let outStr: string = tInStr;
            for (const tfld in pFormControls) {
                const tCtrl: INMIControl = pFormControls[tfld];
                if (tCtrl && tCtrl.MyBaseType === cdeControlType.TileEntry && tCtrl.MyNMIControl.MyFieldInfo && tCtrl.MyNMIControl.MyFieldInfo["DataItem"]) {
                    const tDI: string = tCtrl.MyNMIControl.MyFieldInfo["DataItem"];
                    do {
                        tInStr = outStr;
                        outStr = outStr.replace('<%' + tDI + '%>', tCtrl.GetProperty("Value"));
                    } while (tInStr !== outStr);
                }
            }
            while (outStr.indexOf("<%") >= 0) {
                if (outStr.indexOf("%>") > 0) {
                    const tPre: string = outStr.substr(0, outStr.indexOf("<%"));
                    outStr = tPre + outStr.substr(outStr.indexOf("%>") + 2);
                }
                else
                    break;
            }
            return outStr;
        }

        ///Creates the FormField Definition for a given TableRow
        public CreateFormInfo(pTableRow, pParentClass: string, pForm: cdeNMI.TheFormInfo, pFldIdx: number): number {
            let lastName = "";
            for (const index in pTableRow) {
                if (index.length > 3 && index.substring(0, 3) === "cde" && !((index === "cdeMID" || index === "cdeA") && pParentClass === "")) continue;
                let tIndex: string = index;
                if (pParentClass !== "")
                    tIndex = pParentClass + "." + tIndex;

                lastName = tIndex;
                if (typeof pTableRow[index] === "object") {
                    pFldIdx = this.CreateFormInfo(pTableRow[index], lastName, pForm, pFldIdx);
                    continue;
                }
                if (tIndex.length > 13 && tIndex.substr(0, 13) === "MyPropertyBag" && tIndex.substr(tIndex.length - 6, 6) === ".Value")
                    continue;
                let tHeader: string = tIndex;
                if (tIndex.substr(0, 13) === "MyPropertyBag") {
                    const th: string[] = tIndex.split('.');
                    tHeader = th[1];
                    if (th.length > 3) {
                        for (let i = 2; i < th.length - 1; i++) {
                            tHeader += "." + th[i];
                        }
                    }
                }
                if (pTableRow[tIndex] && typeof pTableRow[tIndex] === "string" && pTableRow[tIndex].substring(0, 5) === "/Date")
                    pForm.FormFields[pFldIdx] = new cdeNMI.TheFieldInfo(21, 2, tHeader);
                else {
                    if (pTableRow[tIndex] && typeof pTableRow[tIndex] === "string" && pTableRow[tIndex].length > 1000)
                        pForm.FormFields[pFldIdx] = new cdeNMI.TheFieldInfo(29, 0, tHeader);
                    else {
                        if (index === "cdeA")
                            pForm.FormFields[pFldIdx] = new cdeNMI.TheFieldInfo(24, 1, tHeader);
                        else
                            pForm.FormFields[pFldIdx] = new cdeNMI.TheFieldInfo(1, 1, tHeader);
                    }
                }
                pForm.FormFields[pFldIdx].FormID = cde.GuidToString(pForm.cdeMID);
                pForm.FormFields[pFldIdx].DataItem = tIndex;
                pForm.FormFields[pFldIdx].FldOrder = pFldIdx;
                if (tIndex.substr(0, 13) === "MyPropertyBag") {
                    if (tIndex.substr(tIndex.length - 5, 5) === ".Name") {
                        pForm.FormFields[pFldIdx]["Title"] = tHeader;
                        pForm.FormFields[pFldIdx].DataItem = tIndex.substr(0, tIndex.length - 5) + '.Value';
                    }
                }
                pForm.FormFields[pFldIdx++].Flags = 0;
            }
            if (pParentClass === "") {
                pForm.FormFields[pFldIdx] = new cdeNMI.TheFieldInfo(cdeControlType.FormButton, 1, "Details", 2, cde.GuidToString(pForm.cdeMID));
                pForm.FormFields[pFldIdx].FldOrder = 1000;
                pForm.FormFields[pFldIdx].DataItem = "CDE_DETAILS";
                pForm.FormFields[pFldIdx].PropertyBag = ["ClassName=cdeTableButton", "Value=<span class='fa fa-3x'>&#xf044;</span>"];
            }
            return pFldIdx;
        }

        public RemoveTableHooks() {
            if (!this.MyTableControls) return;
            for (let i = 0; i < this.MyTableControls.length; i++) {
                this.RemoveFormHooks(this.MyTableControls[i]);
            }
        }

        public RemoveFormHooks(pFormControls: cdeNMI.INMIControl[]) {
            for (const vd in pFormControls) {
                if (pFormControls.hasOwnProperty(vd)) {
                    const tID: string = pFormControls[vd].GetProperty("ID");
                    if (tID && tID.length > 0) {
                        let tOwn = "TABLES";
                        if (pFormControls[vd].MyNMIControl)
                            pFormControls[vd].MyNMIControl.FireEvent(false, "OnDelete");
                        if (pFormControls[vd].MyNMIControl && pFormControls[vd].MyNMIControl.MyTRF && pFormControls[vd].MyNMIControl.MyTRF.FldInfo && pFormControls[vd].MyNMIControl.MyTRF.FldInfo.cdeMID)
                            tOwn = cde.GuidToString(pFormControls[vd].MyNMIControl.MyTRF.FldInfo.cdeMID);
                        cdeNMI.MyTCF.UnregisterControl(tOwn, tID);
                    }
                }
            }
        }

        public DeleteRecord(pDataRow) {
            //override if required
        }

        public OnLoaded() {
            //override if required
        }
    }
}