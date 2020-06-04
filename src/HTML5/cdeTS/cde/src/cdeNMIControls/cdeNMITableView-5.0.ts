// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {

    export class ctrlTableRow extends TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        public static Create(pTargetControl: INMIControl, pTRF: TheTRF, pRow?: HTMLTableRowElement, pIndex?: number, pClassName?: string, IsHeader?: boolean): ctrlTableRow {
            const tTile: ctrlTableRow = new ctrlTableRow(pTRF);
            if (pRow)
                tTile.mRow = pRow;
            tTile.InitControl(pTargetControl, pTRF);
            if (pClassName)
                tTile.SetProperty("ClassName", pClassName);
            return tTile;
        }

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.TableRow;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            this.MyTRF = pTRF;
            if (!this.mRow)
                this.mRow = document.createElement("tr");
            this.SetElement(this.mRow);
            return null;
        }

        public SetProperty(pName: string, pValue) {
            super.SetProperty(pName, pValue);
            if (pName === "ClassName" && this.mRow)
                this.mRow.className = pValue;
        }
        mRow: HTMLTableRowElement = null;

        public AppendChild(pChild: ctrlTableCell) {
            this.mRow.appendChild(pChild.GetElement());
        }
    }


    /**
     * Creates a table Cell
     *
     * (3.2 Ready!)
     */
    export class ctrlTableCell extends TheNMIBaseControl {
        constructor(pTRF?: TheTRF) {
            super(null, pTRF);
        }

        public static Create(pTargetControl: INMIControl, pTRF: TheTRF, pRow?: HTMLTableRowElement, pIndex?: number, pClassName?: string, IsHeader?: boolean): ctrlTableCell {
            const tTile: ctrlTableCell = new ctrlTableCell(pTRF);
            const tBag: string[] = [];
            if (IsHeader)
                tBag.push("IsHeader=true");
            if (pIndex)
                tBag.push("ColumnIndex=" + pIndex);
            if (pRow)
                tTile.mRow = pRow;
            tTile.InitControl(pTargetControl, pTRF, tBag);
            if (pClassName)
                tTile.SetProperty("ClassName", pClassName);
            return tTile;
        }

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.TableCell;
            if (!pTRF)
                pTRF = new TheTRF(null, 0, new TheFieldInfo(this.MyBaseType, 0, null));
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            if (this.mRow && this.MyFieldInfo)
                this.mCell = this.mRow.insertCell(cde.CInt(this.MyFieldInfo["ColumnIndex"]));
            else {
                if (this.MyFieldInfo && cde.CBool(this.MyFieldInfo["IsHeader"]))
                    this.mCell = document.createElement('th');
                else
                    this.mCell = document.createElement('td');
            }
            this.mCell.className = "cdeTabEntry";
            const bIsEdit = (pTRF.FldInfo.Flags & 2) !== 0;
            this.SetElement(this.mCell, bIsEdit); //true);

            return true;
        }

        public SetProperty(pName: string, pValue) {
            super.SetProperty(pName, pValue);
            if (pName === "ClassName" && this.mCell)
                this.mCell.className = pValue;
            if (pName === "CellStyle" && this.mCell)
                this.mCell.style.cssText = pValue;
        }

        mCell: HTMLTableCellElement = null;
        mRow: HTMLTableRowElement = null;

        public AppendChild(pChild: INMIControl) {
            this.MyChildren.push(pChild);
            this.mCell.appendChild(pChild.GetElement());
        }
    }

    /**
* Creates a Table View of a given StorageMirror
* Requires TRF to be set with the Table Name!
*
* (3.2 Ready!)
*/
    export class ctrlTableView extends TheDataViewBase implements INMIDataView {
        constructor(pTRF?: TheTRF) {
            super(pTRF);
        }

        MyScreenInfo: TheScreenInfo = null;
        MyFormInfo: TheFormInfo = null;
        MyTableTitle: INMIControl = null;
        btnAdder: ctrlTileButton = null;
        inputFilter: INMIControl = null;
        InfoText: INMIControl = null;
        mBaseDiv: HTMLDivElement = null;
        IsPropertyTable = false;
        IsNMIOnly = false;
        mSortFldID = -1;
        mColHeader: INMIControl[] = null;

        rowAdder: HTMLTableRowElement = null;
        tableMain: HTMLTableElement = null;
        tableContainer: HTMLDivElement = null;
        tableBody: HTMLElement = null;

        mTableRows: ctrlTableRow[] = [];
        mCurrentFormFieldsInfo: TheFieldInfo[] = null;
        MyMetaData: cdeNMI.TheFormInfo = null;

        IsInEdit = false;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.MyBaseType = cdeControlType.Table;
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);

            const pTableInfo: string = this.GetSetting("ExtraInfo");
            if (pTableInfo) {
                const tStr: string[] = pTableInfo.split(':');
                if (tStr.length > 4)
                    this.SetProperty("PageSize", cde.CInt(tStr[4]));
                if (tStr.length > 5)
                    this.SetProperty("CurrentPage", cde.CInt(tStr[5]));
                if (tStr.length > 7)
                    this.SetProperty("CurrentFilter", tStr[7]);
            }


            if (!this.MyTRF) {
                console.log("pTRF HAS to be specified!");
                return false;
            }

            this.MyScreenInfo = cdeNMI.MyNMIModels[this.MyScreenID];
            this.SetProperty("NoTE", true);
            this.RegisterNMIControl();
            let pTableName: string = this.MyTRF.TableName;
            if (this.MyFieldInfo && this.MyFieldInfo.Type === cdeControlType.Table && this.MyFieldInfo.DataItem)
                pTableName = this.MyFieldInfo.DataItem;

            ///Create Meta Data for Property Bag Table
            if (pTableName.substr(0, 13).toLowerCase() === "mypropertybag") {
                if (!this.MyTRF || !this.MyFieldInfo || !this.MyScreenInfo.MyStorageMirror[this.MyTRF.TableName] || !this.MyScreenInfo.MyStorageMirror[this.MyTRF.TableName][this.MyTRF.RowNo] || !this.MyScreenInfo.MyStorageMirror[this.MyTRF.TableName][this.MyTRF.RowNo].MyPropertyBag) {
                    if (pTargetControl)
                        pTargetControl.GetElement().innerHTML = "Not a Thing or No Properties found";
                    return false;
                }
                const tTableParas: string[] = pTableName.split(';');
                this.IsNMIOnly = (tTableParas.length > 1 && tTableParas[1] === '1');
                pTableName = cde.GuidToString("PB" + this.MyTRF.RowID);
                this.RefreshPropTable(pTableName);

                this.MyMetaData = new cdeNMI.TheFormInfo();
                this.MyMetaData.FormFields = [];
                this.MyMetaData.IsReadOnly = (this.MyFieldInfo.Flags & 2) === 0;
                this.MyMetaData.IsGenerated = false;
                this.MyMetaData.TargetElement = pTableName;
                this.MyMetaData.PropertyBag = ["Caption=" + (cde.IsNotSet(this.MyFieldInfo["Caption"]) ? "" : this.MyFieldInfo["Caption"])];

                let tSizeX = 3; if (cde.CInt(this.MyFieldInfo["TileWidth"]) < 3) tSizeX = 1;
                let tSizeX1 = 3; if (cde.CInt(this.MyFieldInfo["TileWidth"]) > 3) tSizeX1 = cde.CInt(this.MyFieldInfo["TileWidth"]) - 3;
                for (let index = 0; index < (this.IsNMIOnly ? 2 : 3); index++) {
                    switch (index) {
                        case 0:
                            this.MyMetaData.FormFields[index] = new cdeNMI.TheFieldInfo(1, tSizeX, "Name");
                            this.MyMetaData.FormFields[index].FldOrder = 1;
                            this.MyMetaData.FormFields[index].DataItem = "Name";
                            this.MyMetaData.FormFields[index].Flags = 0;
                            break;
                        case 1:
                            this.MyMetaData.FormFields[index] = new cdeNMI.TheFieldInfo(1, tSizeX1, "Value");
                            this.MyMetaData.FormFields[index].FldOrder = 2;
                            this.MyMetaData.FormFields[index].DataItem = "Value";
                            this.MyMetaData.FormFields[index].Flags = 2;
                            this.MyMetaData.FormFields[index].FormID = "PROPTABLEInline";
                            break;
                        case 2:
                            this.MyMetaData.FormFields[index] = new cdeNMI.TheFieldInfo(21, 8, "Time");
                            this.MyMetaData.FormFields[index].FldOrder = 3;
                            this.MyMetaData.FormFields[index].DataItem = "cdeCTIM";
                            this.MyMetaData.FormFields[index].Flags = 0;
                            break;
                    }
                }
                this.IsPropertyTable = true;
            }

            this.MyTableName = cde.GuidToString(pTableName);

            ///Set sizing of the Table
            if (!this.IsPropertyTable) {
                const tDiv: HTMLDivElement = document.getElementById('Inline_' + this.MyTableName) as HTMLDivElement;
                if (tDiv)
                    this.mBaseDiv = tDiv;

                if (!this.mBaseDiv && !pTargetControl && this.MyScreenInfo.MyStorageMeta[this.MyTableName])
                    this.mBaseDiv = document.getElementById('Content_' + cde.GuidToString(this.MyScreenInfo.MyStorageMeta[this.MyTableName].TargetElement)) as HTMLDivElement;
                if (!this.mBaseDiv) {
                    //this.mBaseDiv = document.createElement("div");
                    if (this.MyTarget) {
                        this.mBaseDiv = this.MyTarget.GetContainerElement() as HTMLDivElement;
                        if (this.mBaseDiv && !this.mBaseDiv.id && this.MyFieldInfo) {
                            this.mBaseDiv.id = 'Content_' + cde.GuidToString(this.MyTarget.MyFieldInfo.cdeMID);
                        }
                        this.RemoveTableHooks();
                        this.MyTarget.GetContainerElement().innerHTML = "";   //OK
                    }
                }
                else {
                    this.RemoveTableHooks();
                    this.mBaseDiv.innerHTML = "";   //OK
                }
            }
            else {
                //TODO: Use TileGroup and set Overflow to tru if required
                this.mBaseDiv = document.createElement("div");
                if (this.MyFieldInfo && cde.CInt(this.MyFieldInfo["TileHeight"]) > 0) {
                    //this.mBaseDiv.style.height = cdeNMI.GetSizeFromTile(this.MyFieldInfo["TileHeight"]) + "px";
                    this.mBaseDiv.className = "cdeTableContainer";
                } else {
                    this.mBaseDiv.style.height = "inherit";
                }
            }

            let pClassName = 'CMyTable';
            if (this.MyFieldInfo && this.MyFieldInfo["TableClassName"])
                pClassName = this.MyFieldInfo["TableClassName"];


            this.SetElement(this.mBaseDiv);

            if (this.MyMetaData) {
                this.MyScreenInfo.MyStorageMeta[this.MyTableName] = this.MyMetaData;
            }
            else {
                if (this.MyScreenInfo.MyStorageMirror[this.MyTableName] && this.MyScreenInfo.MyStorageMirror[this.MyTableName][0] &&
                    this.MyScreenInfo.MyStorageMirror[this.MyTableName][0].cdeM) {
                    this.MyScreenInfo.MyStorageMeta[this.MyTableName] = JSON.parse(this.MyScreenInfo.MyStorageMirror[this.MyTableName][0].cdeM);
                }
            }
            this.MyFormInfo = new cdeNMI.TheFormInfo();
            if (this.MyScreenInfo.MyStorageMeta[this.MyTableName] !== undefined && this.MyScreenInfo.MyStorageMeta[this.MyTableName].IsGenerated === true)
                this.MyScreenInfo.MyStorageMeta[this.MyTableName] = null;
            if (!this.MyScreenInfo.MyStorageMeta[this.MyTableName] || !this.MyScreenInfo.MyStorageMeta[this.MyTableName].FormFields || this.MyScreenInfo.MyStorageMeta[this.MyTableName].FormFields.length === 0) {
                if (!this.MyScreenInfo.MyStorageMirror[this.MyTableName]) {
                    this.DisplayHeader(this.mBaseDiv, "No Data Available, yet", this.GetSetting("IsLiveData"));
                    if (cdeNMI.MyEngine && this.MyTarget && this.MyTarget.MyFieldInfo) {
                        //if (cde.CBool(this.MyFieldInfo["IsDropTarget"]) === true) debugger;
                        cdeNMI.MyEngine.PublishToNMI("NMI_GET_DATA:" + cde.GuidToString(this.MyTarget.MyFieldInfo.cdeMID) + ":CMyTable:" + this.MyTableName + ":" + this.MyScreenID + ":true:true", '', this.MyFieldInfo ? this.MyFieldInfo.cdeN : null);
                    }
                    return false;
                }
                this.MyFormInfo.AssociatedClassName = this.MyTableName;
                this.MyFormInfo.FormFields = [];
                this.CreateFormInfo(this.MyScreenInfo.MyStorageMirror[this.MyTableName][0], "", this.MyFormInfo, 0);
                this.MyFormInfo.IsReadOnly = true;
                this.MyFormInfo.IsGenerated = true;
                this.MyFormInfo.TargetElement = this.MyTableName;
                this.MyScreenInfo.MyStorageMeta[this.MyTableName] = this.MyFormInfo;
            }
            this.MyFormInfo = this.MyScreenInfo.MyStorageMeta[this.MyTableName];
            if (this.MyFormInfo) {
                if (!this.MyFieldInfo) {
                    this.MyFieldInfo = new TheFieldInfo(cdeControlType.Table, 0, "");
                    this.MyFieldInfo.PropertyBag = this.MyFormInfo.PropertyBag;
                    ThePB.ConvertPropertiesFromBag(this.MyFieldInfo);
                }
                else {
                    ThePB.ConvertPropertiesFromBag(this.MyFieldInfo, this.MyFormInfo.PropertyBag);
                }
            }

            if (cde.CInt(this.MyFieldInfo["TileWidth"]) > 0) {
                this.mBaseDiv.style.width = cdeNMI.GetSizeFromTile(this.MyFieldInfo["TileWidth"]) + "px";
            } else {
                this.mBaseDiv.style.width = "inherit";
            }
            if (this.MyFieldInfo && cde.CInt(this.MyFieldInfo["TileHeight"]) > 0)
                this.mBaseDiv.style.height = "initial";

            this.DisplayHeader(this.mBaseDiv, this.MyFieldInfo["Caption"], this.MyFormInfo.IsLiveData);

            this.tableContainer = document.createElement("div");
            if (this.MyFieldInfo["TableContainerClassName"])
                this.tableContainer.className = this.MyFieldInfo["TableContainerClassName"];
            else
                this.tableContainer.className = "cdeTableContainer";
            if (cde.CInt(this.MyFieldInfo["TileWidth"]) > 0) {
                this.tableContainer.style.width = cdeNMI.GetSizeFromTile(this.MyFieldInfo["TileWidth"]) + "px";
            } else {
                this.tableContainer.style.width = "inherit";
            }
            this.mBaseDiv.appendChild(this.tableContainer);

            this.tableMain = document.createElement("table");
            this.tableMain.className = pClassName;
            this.tableContainer.appendChild(this.tableMain);

            const tHeader: HTMLElement = document.createElement("THEAD");
            if (this.MyFieldInfo["HeaderClassName"])
                tHeader.className = this.MyFieldInfo["HeaderClassName"];
            else
                tHeader.className = "cdeFixedHeader";
            this.tableMain.appendChild(tHeader);

            const tHeadRow: ctrlTableRow = ctrlTableRow.Create(null, null, null, null, "cdeHeaderRow");
            tHeader.appendChild(tHeadRow.GetElement());

            this.mCurrentFormFieldsInfo = null;
            if (this.MyFormInfo.IsGenerated)
                this.mCurrentFormFieldsInfo = this.MyFormInfo.FormFields;
            else
                this.mCurrentFormFieldsInfo = cdeNMI.SortArrayByProperty<TheFieldInfo>(this.MyFormInfo.FormFields, "FldOrder", true, false);

            this.mColHeader = new Array<ctrlSmartLabel>();
            let tOrderBy: string[]
            let tSortDescendin = false;
            if (this.MyFormInfo.OrderBy) {
                tOrderBy = this.MyFormInfo.OrderBy.split(' ');
                if (tOrderBy.length > 1 && tOrderBy[1].toLocaleLowerCase() === "desc")
                    tSortDescendin = true;
            }
            let i: number;
            for (i = 0; i < this.mCurrentFormFieldsInfo.length; i++) {
                if (!this.mCurrentFormFieldsInfo[i] || (this.mCurrentFormFieldsInfo[i].Flags & 8) !== 0 || this.mCurrentFormFieldsInfo[i].Type === cdeControlType.FacePlate) continue;
                ThePB.ConvertPropertiesFromBag(this.mCurrentFormFieldsInfo[i]);
                const tTd: ctrlTableCell = ctrlTableCell.Create(null, null, null, 0, "cdeTH", true);
                tTd.HookEvents(false);
                if (this.mCurrentFormFieldsInfo[i]["THClassName"])
                    tTd.SetProperty("ClassName", this.mCurrentFormFieldsInfo[i]["THClassName"]);
                let tHWidth = 1;
                if (cde.CInt(this.mCurrentFormFieldsInfo[i]["FldWidth"]) > 0)
                    tHWidth = cde.CInt(this.mCurrentFormFieldsInfo[i]["FldWidth"]);
                tTd.SetProperty("TileWidth", tHWidth);
                tTd.GetElement().style.height = (cdeNMI.GetSizeFromTile(1) / 2) + "px";
                const tHCellDiv: INMIControl = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(tTd);
                tHCellDiv.SetProperty("ClassName", "cdeTHCell");
                tHCellDiv.SetProperty("TileWidth", tHWidth);
                if (this.mCurrentFormFieldsInfo[i].Type === 22) {
                    let tHead = "&nbsp;";
                    if (this.mCurrentFormFieldsInfo[i]["TableHeader"])
                        tHead = this.mCurrentFormFieldsInfo[i]["TableHeader"];
                    tHCellDiv.GetElement().innerHTML = tHead;
                }
                else {
                    const tI: TheFieldInfo = new TheFieldInfo(22, 0, "", 2);
                    tI.FldOrder = i;
                    let tHead: string = this.mCurrentFormFieldsInfo[i]["Title"];
                    if (this.mCurrentFormFieldsInfo[i]["TableHeader"])
                        tHead = this.mCurrentFormFieldsInfo[i]["TableHeader"];
                    this.mColHeader[i] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(tHCellDiv, { ScreenID: this.MyScreenID, TRF: new TheTRF(tHead, 0, tI), PostInitBag: [tHead ? "iValue=" + tHead : ""] });
                    this.mColHeader[i].SetProperty("Cookie", this);
                    this.mColHeader[i].HookEvents(true);
                    this.mColHeader[i].RegisterEvent("PointerUp", (thisOb: ctrlSmartLabel) => {
                        if (!this.rowAdder) {
                            const tTable: ctrlTableView = thisOb.GetProperty("Cookie");
                            if (tTable.mSortFldID >= 0 && tTable.mSortFldID !== thisOb.MyFieldInfo.FldOrder) {
                                tTable.mColHeader[tTable.mSortFldID].SetProperty("ClassName", "");
                            }
                            tTable.mSortFldID = thisOb.MyFieldInfo.FldOrder;
                            let tSortDescendin = false;
                            if (!thisOb.GetProperty("ClassName") || thisOb.GetProperty("ClassName") === "cdeTHsortdn") {
                                thisOb.SetProperty("ClassName", "cdeTHsortup");
                                tSortDescendin = true;
                            }
                            else
                                thisOb.SetProperty("ClassName", "cdeTHsortdn");
                            this.SortTableByProperty(tTable.MyScreenInfo.MyStorageMirror[tTable.MyTableName], tTable.mCurrentFormFieldsInfo[thisOb.MyFieldInfo.FldOrder].DataItem, cdeNMI.MyTCF.IsTypeNumeric(tTable.mCurrentFormFieldsInfo[thisOb.MyFieldInfo.FldOrder].Type), tSortDescendin);
                            if (this.MyTableTitle)
                                this.MyTableTitle.SetProperty("Visibility", false);
                            if (this.InfoText) {
                                this.InfoText.SetProperty("Text", "Sorting...<i class='fa fa-spinner fa-pulse'></i>");
                                this.InfoText.SetProperty("Visibility", true);
                            }
                            window.setTimeout(() => {
                                tTable.UpdateBody(false);
                            }, 100);
                        }
                    });
                }
                if (this.MyFormInfo.OrderBy && this.mCurrentFormFieldsInfo[i].DataItem === tOrderBy[0]) {
                    if (!tSortDescendin)
                        this.mColHeader[i].SetProperty("ClassName", "cdeTHsortdn");
                    else
                        this.mColHeader[i].SetProperty("ClassName", "cdeTHsortup");
                }
                tHeadRow.AppendChild(tTd);
            }
            if (!this.MyScreenInfo.MyStorageMirror[this.MyTableName]) {
                return false;
            }

            if (this.MyFormInfo.OrderBy) {
                for (i = 0; i < this.mCurrentFormFieldsInfo.length; i++) {
                    if (this.mCurrentFormFieldsInfo[i] && this.mCurrentFormFieldsInfo[i].DataItem === tOrderBy[0]) {
                        this.SortTableByProperty(this.MyScreenInfo.MyStorageMirror[this.MyTableName], this.mCurrentFormFieldsInfo[i].DataItem, cdeNMI.MyTCF.IsTypeNumeric(this.mCurrentFormFieldsInfo[i].Type), tSortDescendin);
                        break;
                    }
                }
            }
            // table body
            this.tableBody = document.createElement("TBODY");
            this.tableBody.className = "cdeScrollBody";
            const tH: number = cde.CInt(this.GetProperty("TileHeight"));
            if (tH > 0) {
                //if (tH < 4) tH = 4;
                this.tableBody.style.height = cdeNMI.GetSizeFromTile(tH - 1) + "px";
            }
            this.tableMain.appendChild(this.tableBody);
            this.UpdateBody(true);
            return true;
        }

        public LaterApplySkin() {
            const tH: number = cde.CInt(this.GetProperty("TileHeight"));
            if (tH > 0 && this.MyTarget) {
                this.tableBody.style.height = this.MyTarget.GetContainerElement().style.height;
            }
        }

        public SetTE(pTEControl: INMIControl) {
            if (cde.CInt(pTEControl.MyTarget.GetProperty("TileWidth")) !== 0)
                this.SetProperty("TileWidth", cde.CInt(pTEControl.MyTarget.GetProperty("TileWidth")));
            if (pTEControl.MyFieldInfo["MaxFileSize"])
                this.SetProperty("MaxFileSize", pTEControl.MyFieldInfo["MaxFileSize"]);
            if (pTEControl.MyFieldInfo["IsDropTarget"])
                this.SetProperty("IsDropTarget", pTEControl.MyFieldInfo["IsDropTarget"]);
            if (pTEControl.MyFieldInfo["AllowGlobalPush"])
                this.SetProperty("AllowGlobalPush", pTEControl.MyFieldInfo["AllowGlobalPush"]);
            if (pTEControl.MyFieldInfo["EngineName"])
                this.SetProperty("EngineName", pTEControl.MyFieldInfo["EngineName"]);
            this.MyFieldInfo.cdeO = pTEControl.MyFieldInfo.cdeO;

            pTEControl.RegisterEvent("Resize", (sender, size) => {
                this.SetProperty("TileWidth", size);
            });
        }


        public SetProperty(pName: string, pValue) {
            if (pName !== "MID")
                super.SetProperty(pName, pValue);
            if (pName === "Reload") {
                cdeNMI.ResetKeyCorder();
                if (this.MyScreenInfo)
                    this.MyScreenInfo.MyStorageMirror[this.MyTableName] = null;
                this.RefreshData(this.MyTableName, cde.CInt(this.GetProperty("CurrentPage")));
            } else if ((pName === "TileWidth" || pName === "TileWidth") && this.mBaseDiv) {
                pValue = cde.CInt(pValue);
                if (pValue > 0) {
                    this.mBaseDiv.style.width = cdeNMI.GetSizeFromTile(pValue).toString() + "px";
                }
                this.mBaseDiv.style.overflowX = "auto";
            } else if ((pName === "TileHeight" || pName === "TileHeight") && this.mBaseDiv) {
                pValue = cde.CInt(pValue);
                if (this.tableBody && cde.CInt(pValue) > 1) {
                    this.tableBody.style.height = cdeNMI.GetSizeFromTile(cde.CInt(pValue) - 1).toString() + "px";
                    this.mBaseDiv.style.height = "initial";
                }
                this.mBaseDiv.style.overflowY = "auto";
            } else if (pName === "Style" && this.mBaseDiv) {
                this.mBaseDiv.style.cssText = pValue;
            } else if (pName === "InnerClassName" && this.tableMain) {
                this.tableMain.className = pValue;
            } else if (pName === "Title" && this.MyTableTitle) {
                this.MyTableTitle.SetProperty("Text", pValue);
            } else if (pName === "IsDropTarget" && this.mBaseDiv) {
                if (cde.CBool(pValue) === true) {
                    this.mBaseDiv.ondragover = () => {
                        this.mBaseDiv.classList.add('ctrlDropUploaderHover');
                        return false;
                    };
                    this.mBaseDiv.ondragend = () => {
                        this.mBaseDiv.classList.remove('ctrlDropUploaderHover');
                        return false;
                    };
                    this.mBaseDiv.ondragleave = () => {
                        this.mBaseDiv.classList.remove('ctrlDropUploaderHover');
                        return false;
                    };
                    this.mBaseDiv.ondrop = (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        this.mBaseDiv.classList.remove('ctrlDropUploaderHover');
                        this.ProcessFiles(e.dataTransfer.files);
                    }
                }
            }
        }


        DisplayHeader(pParent: HTMLElement, pHeaderTitle: string, pIsLiveData: boolean) {

            const tHeadTd: HTMLDivElement = document.createElement("div");
            tHeadTd.className = "cdeMainTableHeader";
            tHeadTd.style.height = (cdeNMI.GetSizeFromTile(1) / 2) + "px";
            pParent.appendChild(tHeadTd);

            let tAddHeadline = true;
            if (cde.IsNotSet(pHeaderTitle)) {
                pHeaderTitle = "&nbsp;";
                tAddHeadline = false;
            }
            else
                tAddHeadline = true;
            if (tAddHeadline) {
                const tScr: INMIScreen = cdeNMI.MyScreenManager.GetScreenByID(this.MyTableName);
                if (tScr && cde.CBool(tScr.GetProperty("HidePins")) === false) {
                    tScr.SetProperty("Caption", pHeaderTitle);
                    tAddHeadline = false;
                } else {
                    this.MyTableTitle = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(null, { PreInitBag: ["Element=h1"], PostInitBag: ["iValue=" + cdeNMI.GenerateFinalString(pHeaderTitle), "ClassName=cdeTableHeader"] });
                    //ctrlSmartLabel.Create(null, null, null, cdeNMI.GenerateFinalString(pHeaderTitle), "h1", false, "cdeTableHeader");
                    if (this.MyFieldInfo && this.MyFieldInfo["TNClassName"])
                        this.MyTableTitle.SetProperty("ClassName", this.MyFieldInfo["TNClassName"]);
                }
            }

            if (!pIsLiveData) {
                if (!this.IsPropertyTable) {
                    if (tAddHeadline) {
                        const tRefreshBut = ctrlTileButton.Create(null, (e: PointerEvent) => {
                            cdeNMI.ResetKeyCorder();
                            this.MyScreenInfo.MyStorageMirror[this.MyTableName] = null;
                            this.RefreshData(this.MyTableName, cde.CInt(this.GetProperty("CurrentPage")), e.button === 2);
                        }, "<span class='fa cdeTableHeaderIcon'>&#xf021;</span>", 1, 1);
                        tRefreshBut.SetProperty("TileFactorX", 2);
                        tRefreshBut.SetProperty("TileFactorY", 2);
                        tHeadTd.appendChild(tRefreshBut.GetElement());
                    }
                    if (cde.CInt(this.GetProperty("PageSize")) > 0) {
                        const tBut = ctrlTileButton.Create(null, () => {
                            if (!this.rowAdder && cde.CInt(this.GetProperty("CurrentPage")) > 0) {
                                cdeNMI.ResetKeyCorder();
                                this.MyScreenInfo.MyStorageMirror[this.MyTableName] = null;
                                this.RefreshData(this.MyTableName, 0);
                            }
                        }, "<span class='fa cdeTableHeaderIcon'>&#xf049;</span>", 1, 1);
                        tBut.SetProperty("TileFactorX", 2);
                        tBut.SetProperty("TileFactorY", 2);
                        tHeadTd.appendChild(tBut.GetElement());

                        const tBut2 = ctrlTileButton.Create(null, () => {
                            if (!this.rowAdder && cde.CInt(this.GetProperty("CurrentPage")) > 0) {
                                cdeNMI.ResetKeyCorder();
                                this.MyScreenInfo.MyStorageMirror[this.MyTableName] = null;
                                this.RefreshData(this.MyTableName, cde.CInt(this.GetProperty("CurrentPage")) - 1);
                            }
                        }, "<span class='fa cdeTableHeaderIcon'>&#xf048;</span>", 1, 1);
                        tBut2.SetProperty("TileFactorX", 2);
                        tBut2.SetProperty("TileFactorY", 2);
                        tHeadTd.appendChild(tBut2.GetElement());

                        const tBut3 = ctrlTileButton.Create(null, () => {
                            if (!this.rowAdder) {
                                cdeNMI.ResetKeyCorder();
                                this.MyScreenInfo.MyStorageMirror[this.MyTableName] = null;
                                this.RefreshData(this.MyTableName, cde.CInt(this.GetProperty("CurrentPage")) + 1);
                            }
                        }, "<span class='fa cdeTableHeaderIcon'>&#xf051;</span>", 1, 1);
                        tBut3.SetProperty("TileFactorX", 2);
                        tBut3.SetProperty("TileFactorY", 2);
                        tHeadTd.appendChild(tBut3.GetElement());

                        const tBut4 = ctrlTileButton.Create(null, () => {
                            if (!this.rowAdder) {
                                cdeNMI.ResetKeyCorder();
                                this.MyScreenInfo.MyStorageMirror[this.MyTableName] = null;
                                this.RefreshData(this.MyTableName, -1);
                            }
                        }, "<span class='fa cdeTableHeaderIcon'>&#xf050;</span>", 1, 1);
                        tBut4.SetProperty("TileFactorX", 2);
                        tBut4.SetProperty("TileFactorY", 2);
                        tHeadTd.appendChild(tBut4.GetElement());
                    }
                    //else
                    //  tAddHeadline = false;
                }

                if (this.MyFormInfo && this.MyFormInfo.FormFields) {
                    if (!this.MyFormInfo.IsReadOnly && this.MyFieldInfo["AddButtonText"]) {
                        let i = this.MyFormInfo.FormFields.length;
                        let HasDelete = false;
                        while (i--) {
                            if (this.MyFormInfo.FormFields[i].DataItem === "CDE_DELETE") {
                                HasDelete = true;
                                break;
                            }
                        }
                        if (HasDelete) {
                            this.btnAdder = ctrlTileButton.Create(null, () => this.AddRecord(this.MyScreenID), this.MyFieldInfo["AddButtonText"], 2, 1);
                            this.btnAdder.SetProperty("TileFactorY", 2);
                            if (this.MyFieldInfo["AddButtonClassName"])
                                this.btnAdder.SetProperty("ClassName", this.MyFieldInfo["AddButtonClassName"]);
                            else
                                this.btnAdder.SetProperty("ClassName", "cdeAddButton");
                            tHeadTd.appendChild(this.btnAdder.GetElement());
                        }
                    }
                    if (cde.CBool(this.MyFieldInfo["ShowFilterField"])) {
                        const tFilterIcon = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).Create(null, { PostInitBag: ["ClassName=cdeFilterInputIcon", "TileWidth=1", "TileFactorX=2", "Style=float:left;", "Text=<i class='fa fa-2x'>&#xf002;</i>"] });
                        tHeadTd.appendChild(tFilterIcon.GetElement());
                        const tFld2: TheFieldInfo = new TheFieldInfo(cdeControlType.SingleEnded, 3, "Filter:", 2);
                        let tFiVal: string = this.GetProperty("CurrentFilter");
                        if (!tFiVal)
                            tFiVal = "";
                        this.inputFilter = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SingleEnded).Create(null, { TRF: new TheTRF(this.MyTableName, 1, tFld2), PostInitBag: ["ClassName=cdeInput cdeFilterInput", "TileWidth=2", "iValue=" + tFiVal] });
                        this.inputFilter.SetProperty("TileFactorY", 2);
                        this.inputFilter.RegisterEvent("OnValueChanged", (sender, eventName, pvalue) => {
                            if (this.GetProperty("CurrentFilter") === pvalue)
                                return;
                            this.SetProperty("CurrentFilter", pvalue);
                            this.RefreshData(this.MyTableName, cde.CInt(this.GetProperty("CurrentPage")), true);
                        });
                        tHeadTd.appendChild(this.inputFilter.GetElement());
                    }
                }
                this.InfoText = ctrlSmartLabel.Create(null, null, null, "", "span", true);
                this.InfoText.SetProperty("TileFactorY", 2);
                this.InfoText.SetProperty("ClassName", "cdeRefresher");
                this.InfoText.SetProperty("Visibility", false);
                tHeadTd.appendChild(this.InfoText.GetElement());

            }

            if (tAddHeadline)
                tHeadTd.appendChild(this.MyTableTitle.GetElement());
        }

        public UpdateBody(IsNewTable: boolean) {
            if (!IsNewTable) {
                this.RemoveTableHooks();
                //cdeNMI.MyEngine.RemoveTableHooks(this.MyTableControls);
            }
            this.MyTableControls = [];
            this.mTableRows = [];
            if (!this.tableBody)
                return;
            this.tableBody.innerHTML = "";    //OK

            for (let i = 0; i < this.MyScreenInfo.MyStorageMirror[this.MyTableName].length; i++) {
                const tRow: ctrlTableRow = ctrlTableRow.Create(null, this.MyTRF);
                this.MyTableControls[i] = [];
                tRow.SetProperty("ClassName", (i % 2 === 0) ? 'cdeRowEven' : 'cdeRowOdd');
                this.tableBody.appendChild(tRow.GetElement());
                const tDataRow = this.MyScreenInfo.MyStorageMirror[this.MyTableName][i];
                this.mTableRows[tDataRow.cdeMID] = tRow;
                for (let j = 0; j < this.mCurrentFormFieldsInfo.length; j++) {
                    if (!this.mCurrentFormFieldsInfo[j] || (this.mCurrentFormFieldsInfo[j].Flags & 8) !== 0 || this.mCurrentFormFieldsInfo[j].Type === cdeControlType.FacePlate) continue;
                    const tD: ctrlTableCell = ctrlTableCell.Create(null, null);
                    tRow.AppendChild(tD);
                    const tFldInfo: cdeNMI.TheFieldInfo = this.mCurrentFormFieldsInfo[j];
                    if (!tFldInfo.FldOrder)
                        tFldInfo.FldOrder = (j + 1) * 10;
                    const tFldID: string = this.MyTableName + '_' + i + '_' + tFldInfo.FldOrder;
                    if ((tFldInfo.Flags & 2) !== 0)
                        tD.HookEvents(false);

                    if (!this.MyFormInfo.IsReadOnly && tFldInfo.DataItem === "CDE_DELETE") {
                        tD.SetProperty("ClassName", 'cdeTH');
                        tD.SetProperty("TileWidth", 1);
                        this.MyTableControls[i][tFldID] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(null, { TRF: new TheTRF(this.MyTableName, i, tFldInfo), PreInitBag: ["ControlTW=1", "ControlTH=1"], PostInitBag: ["Title=<span class='fa fa-3x'>&#xf1f8;</span>", "ClassName=cdeBadActionButton cdeDeleteButton"] });
                        this.MyTableControls[i][tFldID].SetProperty("Cookie", this);
                        this.MyTableControls[i][tFldID].SetProperty("Cookie2", tDataRow);
                        this.MyTableControls[i][tFldID].SetProperty("OnClick", (pSender: INMIControl, evt: KeyboardEvent) => {
                            const tMe: INMIDataView = pSender.GetProperty("Cookie");
                            if (evt.shiftKey) {
                                tMe.DeleteRecord(pSender.GetProperty("Cookie2"));
                            } else {
                                if (cdeNMI.MyPopUp)
                                    cdeNMI.MyPopUp.Show('Are you sure you want to delete this record? ', false, null, 1, (tPopup: INMIPopUp, pParent: INMIDataView, cookie) => {
                                        pParent.DeleteRecord(cookie);
                                    }, null, pSender.GetProperty("Cookie2"), tMe);
                            }
                        });
                        tD.AppendChild(this.MyTableControls[i][tFldID]);
                    }
                    else if (tFldInfo.DataItem === "CDE_DETAILS") {
                        tD.SetProperty("ClassName", 'cdeTH');
                        tD.SetProperty("TileWidth", 1);
                        this.MyTableControls[i][tFldID] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(null, { TRF: new TheTRF(this.MyTableName, i, tFldInfo), PreInitBag: ["ControlTW=1", "ControlTH=1"], PostInitBag: ["Title=<span class='fa fa-3x'>&#xf044;</span>", "ClassName=cdeTransitButton cdeDetailButton"] });
                        this.MyTableControls[i][tFldID].SetProperty("Cookie", i);
                        this.MyTableControls[i][tFldID].SetProperty("OnClick", (pSender: INMIControl) => {
                            if (!this.rowAdder) {
                                cdeNMI.TogglePortalFull(false);
                                if (this.GetProperty("TemplateID") && cdeNMI.MyScreenManager) {
                                    const tRowID = this.MyScreenInfo.MyStorageMirror[this.MyTableName][cde.CInt(pSender.GetProperty("Cookie"))].cdeMID;
                                    const tTemplID: string = cde.GuidToString(this.GetProperty("TemplateID"));
                                    cdeNMI.MyScreenManager.TransitToScreen(tTemplID, true, false, tRowID);
                                } else {
                                    cdeNMI.MyTCF.CreateNMIControl(cdeControlType.FormView).Create(this.MyTarget, { ScreenID: this.MyScreenID, TRF: new cdeNMI.TheTRF(this.MyTableName, pSender.GetProperty("Cookie"), null) });
                                }
                            }
                        });
                        tD.AppendChild(this.MyTableControls[i][tFldID]);
                    }
                    else {
                        let tFldContent = "";
                        if (tFldInfo.DataItem) {
                            tFldContent = cdeNMI.GetFldContent(tDataRow, tFldInfo, this.MyFormInfo.IsGenerated, false);
                        }
                        if (tFldInfo["TCClassName"])
                            tD.SetProperty("ClassName", tFldInfo["TCClassName"]);
                        else
                            tD.SetProperty("ClassName", 'cdeTabEntry');
                        let tDWidth = 1;
                        if (cde.CInt(tFldInfo["FldWidth"]) > 0)
                            tDWidth = cde.CInt(tFldInfo["FldWidth"]);
                        tD.SetProperty("TileWidth", tDWidth);

                        if (tFldInfo["HorizontalAlignment"])
                            tD.SetProperty("HorizontalAlignment", tFldInfo["HorizontalAlignment"]);
                        const tDCellDiv: INMIControl = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(tD);
                        tDCellDiv.SetProperty("ClassName", "cdeTDCell");
                        tDCellDiv.SetProperty("TileWidth", tDWidth);
                        const HookEvent = true;
                        tFldInfo["IsInTable"] = true;
                        switch (tFldInfo.Type) {
                            case cdeControlType.Picture:
                                if (tFldContent && (tFldContent.length > 512 || cde.CBool(ThePB.GetSetting(tFldInfo, "IsBlob"))))
                                    tFldContent = "data:image/jpeg;base64," + tFldContent;
                                this.MyTableControls[i][tFldID] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.Picture).Create(null, { PostInitBag: ["iValue=" + tFldContent] }); //ctrlZoomImage.Create(null, 0, 0, tFldContent);
                                if (cde.CInt(tFldInfo["FldWidth"]) > 0) {
                                    this.MyTableControls[i][tFldID].SetProperty("ControlTW", cde.CInt(tFldInfo["FldWidth"]));
                                    this.MyTableControls[i][tFldID].SetProperty("ControlTH", 1);
                                }
                                break;
                            case cdeControlType.Table:
                                //this.MyTableControls[i][tFldID] = ctrlTableView.Create(null, this.MyScreenID, new TheTRF(this.MyTableName, i, tFldInfo), null, false, "cdeInlineTable");
                                this.MyTableControls[i][tFldID] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.Table).Create(null, { ScreenID: this.MyScreenID, TRF: new cdeNMI.TheTRF(this.MyTableName, i, tFldInfo), PostInitBag: ["InnerClassName=cdeInlineTable"] });
                                break;
                            case cdeControlType.TouchDraw:
                                // ctrlTouchDraw.Create(null, new TheTRF(this.MyTableName, i, tFldInfo), false, cde.CInt(tFldInfo["FldWidth"]) * cdeNMI.GetSizeFromTile(1), tFldInfo["TileHeight"] * cdeNMI.GetSizeFromTile(1), tFldContent);
                                this.MyTableControls[i][tFldID] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TouchDraw).Create(null, { TRF: new TheTRF(this.MyTableName, i, tFldInfo), PostInitBag: ["iValue=" + tFldContent] });
                                break;
                            case cdeControlType.FormButton:
                            case cdeControlType.TileButton:
                                {
                                    tFldInfo["OnClick"] = cdeNMI.GenerateFinalString(tFldInfo["OnClick"], tDataRow)
                                    let tTit = "";
                                    if (tFldInfo.DataItem)
                                        tTit = cdeNMI.GenerateFinalString("%" + tFldInfo.DataItem + "%", tDataRow);
                                    else
                                        tTit = cdeNMI.GenerateFinalString(tFldInfo["Title"], tDataRow)
                                    this.MyTableControls[i][tFldID] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(this, { ScreenID: this.MyScreenID, TRF: new TheTRF(this.MyTableName, i, tFldInfo), PostInitBag: ["iValue=" + (tTit ? tTit : "")] });
                                }
                                break;
                            case cdeControlType.SingleCheck:
                                this.MyTableControls[i][tFldID] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SingleCheck).Create(this, { ScreenID: this.MyScreenID, TRF: new TheTRF(this.MyTableName, i, tFldInfo), PreInitBag: ["IsInTable=true"], PostInitBag: ["iValue=" + cde.CBool(tFldContent)] });
                                //ctrlCheckBox.CreateOLD(null, this.MyScreenID, new TheTRF(this.MyTableName, i, tFldInfo), cde.CBool(tFldContent), "", false);
                                this.MyTableControls[i][tFldID].SetProperty("UpdateTable", true);
                                break;
                            case cdeControlType.CircularGauge:
                                if (cde.CInt(tFldInfo["FldWidth"]) > 0)
                                    tFldInfo["ControlTW"] = cde.CInt(tFldInfo["FldWidth"]);
                                else
                                    tFldInfo["ControlTW"] = 1;
                                tFldInfo["ControlTH"] = 1;
                                this.MyTableControls[i][tFldID] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.CircularGauge).Create(this, { ScreenID: this.MyScreenID, TRF: new TheTRF(this.MyTableName, i, tFldInfo), PreInitBag: ["IsInTable=true"], PostInitBag: ["iValue=" + cde.CDbl(tFldContent)] });
                                break;
                            case cdeControlType.BarChart:
                                if (cde.CInt(tFldInfo["FldWidth"]) > 0)
                                    tFldInfo["ControlTW"] = cde.CInt(tFldInfo["FldWidth"]);
                                else
                                    tFldInfo["ControlTW"] = 1;
                                tFldInfo["ControlTH"] = 1;
                                this.MyTableControls[i][tFldID] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.BarChart).Create(this, { ScreenID: this.MyScreenID, TRF: new TheTRF(this.MyTableName, i, tFldInfo), PreInitBag: ["IsInTable=true"], PostInitBag: ["iValue=" + cde.CDbl(tFldContent)] });
                                break;
                            case cdeControlType.StatusLight:
                                {
                                    const tSL: ctrlStatusLight = new ctrlStatusLight();
                                    if (cde.CInt(tFldInfo["FldWidth"]) > 0)
                                        tFldInfo["ControlTW"] = cde.CInt(tFldInfo["FldWidth"]);
                                    else
                                        tFldInfo["ControlTW"] = 1;
                                    tFldInfo["ControlTH"] = 1;
                                    tSL.InitControl(null, new TheTRF(this.MyTableName, i, tFldInfo), null, this.MyScreenID);
                                    tSL.SetProperty("iValue", tFldContent);
                                    this.MyTableControls[i][tFldID] = tSL;
                                }
                                break;
                            case cdeControlType.CollapsibleGroup:
                            case cdeControlType.TileGroup:
                                this.MyTableControls[i][tFldID] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileGroup).Create(null, { TRF: new TheTRF(this.MyTableName, i, tFldInfo) }); // ctrlTileGroup.Create(null, new TheTRF(this.MyTableName, i, tFldInfo));
                                this.MyTableControls[i][tFldID].SetProperty("ClassName", "cdeTileGroup");
                                this.MyTableControls[i][tFldID].SetProperty("IsDivOnly", tFldInfo["IsDivOnly"]);
                                this.MyTableControls[i][tFldID].SetProperty("iValue", tFldContent);
                                break;
                            case cdeControlType.UserControl:
                                if (cde.CInt(tFldInfo["FldWidth"]) > 0)
                                    tFldInfo["ControlTW"] = cde.CInt(tFldInfo["FldWidth"]);
                                else
                                    tFldInfo["ControlTW"] = 1;
                                tFldInfo["ControlTH"] = 1;
                                tFldInfo["IsInTable"] = true;
                                tFldInfo["DataRow"] = tDataRow;
                                tFldInfo["FldID"] = tFldID;
                                tFldInfo["iValue"] = tFldContent;
                                cdeNMI.MyTCF.CreateControlLazy(tDCellDiv, tFldInfo["EngineName"], tFldInfo["ControlType"], (parent: INMIControl, resControl: INMIControl, cookie: TheTRF) => {
                                    this.MyTableControls[cookie.RowNo][cookie.FldInfo["FldID"]] = resControl;
                                    resControl.InitControl(parent, cookie);
                                    resControl.SetProperty("iValue", cookie.FldInfo["iValue"]);
                                    this.FinishControlSetup(cookie.RowNo, cookie.FldInfo["FldID"], cookie.FldInfo, cookie.FldInfo["DataRow"], true, parent);
                                }, new TheTRF(this.MyTableName, i, tFldInfo));
                                continue;
                            default:
                                this.MyTableControls[i][tFldID] = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.SmartLabel).
                                    Create(null,
                                        {
                                            ScreenID: this.MyScreenID,
                                            TRF: new TheTRF(this.MyTableName, i, tFldInfo),
                                            PreInitBag: ["Element=div", "IsReadOnly=" + this.MyFormInfo.IsReadOnly, "IsInTable=true"],
                                            PostInitBag: ["iValue=" + tFldContent],
                                            Cookie: tDataRow
                                        });
                                if ((tFldInfo.Flags & 2) !== 0 && tFldInfo.Type !== cdeNMI.cdeControlType.SmartLabel) {
                                    tD.MyNMIControl = this.MyTableControls[i][tFldID];
                                    this.MyTableControls[i][tFldID].MyNMIControl = tD;
                                    tD.MyNMIControl.MyDataView = this;
                                    tD.RegisterEvent("PointerUp", (pControl: INMIControl, evt: Event, pPointer: ThePointer) => {
                                        cdeNMI.StopPointerEvents(evt);
                                        (pControl.MyNMIControl as ctrlSmartLabel).EditControl(evt, pPointer, pControl);
                                    });
                                }
                                break;
                        }
                        this.FinishControlSetup(i, tFldID, tFldInfo, tDataRow, HookEvent, tDCellDiv);
                    }
                }
                cdeNMI.MyEngine.UnregisterEvent("RecordUpdated_" + this.MyTableName + "_" + i, this.UpdateRecord);
                cdeNMI.MyEngine.RegisterEvent("RecordUpdated_" + this.MyTableName + "_" + i, this.UpdateRecord);
                this.ValidateRules(this.MyScreenID, this.MyTableName, this.MyTableName, i, this.MyTableControls[i], true, false);  //Run local rules on Table Row
            }
            cdeNMI.TheFlashCache.FlushCache();
            this.InfoText.SetProperty("Text", "");
            this.InfoText.SetProperty("Visibility", false);
            if (this.MyTableTitle)
                this.MyTableTitle.SetProperty("Visibility", true);

        }

        private FinishControlSetup(i: number, tFldID: string, tFldInfo: TheFieldInfo, tDataRow, HookEvent: boolean, tDCellDiv: INMIControl) {
            if (!this.MyTableControls[i][tFldID].MyTRF)
                this.MyTableControls[i][tFldID].MyTRF = new TheTRF(this.MyTableName, i, tFldInfo);
            if (this.MyScreenInfo.MyStorageMirror[this.MyTableName] && tDataRow && tDataRow.cdeMID)
                this.MyTableControls[i][tFldID].MyTRF.RowID = tDataRow.cdeMID;
            this.MyTableControls[i][tFldID].MyTRF.ModelID = this.MyScreenID;
            this.MyTableControls[i][tFldID].MyDataView = this;
            if (HookEvent) {
                this.MyTableControls[i][tFldID].SetProperty("OnValueChanged", (pCtrl: INMIControl, evt, pValue, pTRF: TheTRF) => {
                    if (pTRF) {
                        this.ValidateRules(this.MyScreenID, this.MyTableName, this.MyTableName, pTRF.RowNo, this.MyTableControls[pTRF.RowNo], false, false); //Push Table changes to Relay
                    }
                });
            }
            if (tFldInfo.PropertyBag && tFldInfo.PropertyBag.length > 0) {
                cdeNMI.ThePB.SetPropertiesFromBag(this.MyTableControls[i][tFldID], tFldInfo.PropertyBag, this.MyScreenInfo.MyStorageMirror[this.MyTableName] ? tDataRow : null, false, true);
            }
            if (tFldInfo.DataItem) {
                this.MyTableControls[i][tFldID].SetProperty("DataItem", tFldInfo.DataItem);
            }
            if ((tFldInfo.Flags & 0x40) !== 0 || tFldInfo.Type === cdeNMI.cdeControlType.ThingPicker) {
                this.MyTableControls[i][tFldID].SetProperty("TID", tDataRow.cdeMID);
                this.MyTableControls[i][tFldID].SetProperty("UXID", tFldInfo.cdeMID);
                this.MyTableControls[i][tFldID].RegisterNMIControl();
            }
            tDCellDiv.AppendChild(this.MyTableControls[i][tFldID]);
        }

        UpdateRecord(pSI: cdeNMI.INMIControl, pModelMID: string, tTabName: string, tRowID: number, tMask: string) {
            if (this.MyTableName && this.MyTableName === tTabName) {
                const tMod: TheScreenInfo = cdeNMI.MyNMIModels[pModelMID];
                if (tMod) {
                    let cnt = 0;
                    for (const cc in this.MyTableControls[tRowID]) {
                        const tN = this.MyTableControls[tRowID][cc].GetProperty("DataItem");
                        if (tN && (!tMask || tMask.substr(cnt, 1) === '1')) {
                            if (!Object.prototype.hasOwnProperty.call(tMod.MyStorageMirror[tTabName][tRowID], 'SecToken'))
                                this.MyTableControls[tRowID][cc].SetProperty("iValue", cdeNMI.GetFldContent(tMod.MyStorageMirror[tTabName][tRowID], this.MyTableControls[tRowID][cc].MyFieldInfo, this.MyFormInfo.IsGenerated, false)); //     tMod.MyStorageMirror[tTabName][tRowID][tN]);
                        }
                        cnt++; //V5: This was missing!
                    }
                    this.ValidateRules(pModelMID, tTabName, tTabName, tRowID, this.MyTableControls[tRowID], true, false);  //Validate rules in Row
                }
            }
        }

        public ReloadData(): boolean {
            this.MyScreenInfo.MyStorageMirror[this.MyTableName] = null;
            this.RefreshData(this.MyTableName, cde.CInt(this.GetProperty("CurrentPage")), false);
            return true;
        }

        public RefreshData(pTableName: string, pPageNo: number, bForceReload = false) {
            if (this.IsPropertyTable) {
                this.RefreshPropTable(pTableName);
                this.UpdateBody(true);
            }
            else {
                let tID = "auto";
                if (this.MyTarget) {
                    if (this.MyTarget.MyNMIControl && this.MyTarget.MyNMIControl.MyBaseType === cdeControlType.Table) {
                        tID = cde.GuidToString(this.MyTarget.MyFieldInfo.cdeMID);
                    }
                    else if (this.MyTarget.MyScreenID)
                        tID = this.MyTarget.MyScreenID;
                }
                if (cdeNMI.MyEngine) {
                    let tFilter = this.GetProperty("CurrentFilter");
                    if (!tFilter)
                        tFilter = "";
                    cdeNMI.MyEngine.PublishToNMI('NMI_GET_DATA:' + tID + ':CMyTable:' + pTableName + ':' + this.MyScreenID + (bForceReload === true ? ":false:true" : ""), pPageNo.toString() + (tFilter.length > 0 ? (":;:" + tFilter) : ""), this.MyTRF ? this.MyTRF.GetNodeID() : null);
                }
                if (this.MyTableTitle)
                    this.MyTableTitle.SetProperty("Visibility", false);
                if (this.InfoText) {
                    this.InfoText.SetProperty("Text", "Refreshing...<i class='fa fa-spinner fa-pulse'></i>");
                    this.InfoText.SetProperty("Visibility", true);
                }
                if (cdeNMI.MyToast)
                    cdeNMI.MyToast.ShowToastMessage("Table Refresh request sent to Relay");
            }
        }

        private RefreshPropTable(pTableName: string) {
            this.MyScreenInfo.MyStorageMirror[pTableName] = [];
            for (const idx in this.MyScreenInfo.MyStorageMirror[this.MyTRF.TableName][this.MyTRF.RowNo].MyPropertyBag) {
                if (this.IsNMIOnly && (this.MyScreenInfo.MyStorageMirror[this.MyTRF.TableName][this.MyTRF.RowNo].MyPropertyBag[idx].cdeE & 64) === 0)
                    continue;
                this.MyScreenInfo.MyStorageMirror[pTableName].push(this.MyScreenInfo.MyStorageMirror[this.MyTRF.TableName][this.MyTRF.RowNo].MyPropertyBag[idx]);
            }
            this.SortTableByProperty(this.MyScreenInfo.MyStorageMirror[pTableName], "Name", false, false);
        }

        public TableHighlightRow() {
            if (document.getElementById && document.createTextNode) {
                const tables = document.getElementsByTagName('table');
                for (let i = 0; i < tables.length; i++) {
                    if ((tables[i]).className === 'cdeHilite') {
                        const trs = (tables[i]).getElementsByTagName('tr');
                        for (let j = 0; j < trs.length; j++) {
                            if ((trs[j]).parentNode.nodeName === 'TBODY') {
                                (trs[j]).onmouseover = (ev) => {
                                    const target = (ev.target || ev.srcElement) as HTMLElement;
                                    target.setAttribute("oldClass", target.className);
                                    target.className = 'cdeHilightRow';
                                    return false
                                };
                                (trs[j]).onmouseout = (ev) => {
                                    const target = (ev.target || ev.srcElement) as HTMLElement;
                                    target.className = target.attributes["oldClass"].nodeValue;
                                    return false
                                };
                            }
                        }
                    }
                }
            }
        }

        public DeleteRecord(pDataRow) {
            const pMID = pDataRow.cdeMID;
            if (cdeNMI.MyEngine)
                cdeNMI.MyEngine.PublishToNMI('NMI_DEL_ID:' + this.MyTableName + ":" + pMID, "", pDataRow.cdeN);
            this.mTableRows[pMID].SetProperty("ClassName", "rowDeleted");
        }
        CancelAddRecord() {
            this.IsInEdit = false;
            cdeNMI.ResetKeyCorder();
            if (this.rowAdder) {
                this.tableMain.deleteRow(1);
                this.rowAdder = null;
            }
            if (this.btnAdder)
                this.btnAdder.SetProperty("Visibility", true);
        }

        SaveRecord() {
            this.IsInEdit = false;
            cdeNMI.ResetKeyCorder();
            const tTableRecord: any[] = [];
            if (this.MyScreenInfo.MyStorageMirror[this.MyTableName] && this.MyScreenInfo.MyStorageMirror[this.MyTableName][0])
                tTableRecord[0] = this.MyScreenInfo.MyStorageMirror[this.MyTableName][0].constructor();
            else
                tTableRecord[0] = {};
            for (let i = 0; i < this.mCurrentFormFieldsInfo.length; i++) {
                const tFldInfo: cdeNMI.TheFieldInfo = this.mCurrentFormFieldsInfo[i];
                if (!tFldInfo)
                    continue;
                const tFldID = this.MyTableName + "_" + tFldInfo.FldOrder;
                if (!this.MyAdderRow[tFldID] || !this.MyAdderRow[tFldID].MyNMIControl)
                    continue;
                if (tFldInfo.DataItem !== "CDE_DELETE" && (tFldInfo.Flags & 2) !== 0 && this.MyAdderRow[tFldID]) {
                    let tVal;
                    switch (tFldInfo.Type) {
                        case 4: //Checkbox
                            tVal = cde.CBool(this.MyAdderRow[tFldID].MyNMIControl.GetProperty("IsChecked"));
                            break;
                        default:
                            tVal = this.MyAdderRow[tFldID].MyNMIControl.GetProperty("Value");
                            break;
                    }
                    cdeNMI.UpdFldContent(tTableRecord[0], tFldInfo, tVal, null);
                }
            }
            if (this.rowAdder) {
                this.tableMain.deleteRow(1);
                this.rowAdder = null;
                this.MyAdderRow = null;
                this.btnAdder.SetProperty("Visibility", true);
            }
            if (cdeNMI.MyEngine) {
                let tID = "auto";
                if (this.MyTarget) {
                    if (this.MyTarget.MyNMIControl && this.MyTarget.MyNMIControl.MyBaseType === cdeControlType.Table)
                        tID = cde.GuidToString(this.MyTarget.MyFieldInfo.cdeMID);
                    else if (this.MyTarget.MyScreenID)
                        tID = this.MyTarget.MyScreenID;
                }
                cdeNMI.MyEngine.PublishToNMI('NMI_INS_DATA:' + this.MyTableName + ":" + this.MyScreenID + ":" + tID, JSON.stringify(tTableRecord[0]), this.MyFormInfo.cdeN);
                cdeNMI.ShowToastMessage("New Record was sent to owner");
            } else {
                cdeNMI.ShowToastMessage("No Engine Found");
            }
        }

        AddRecord(pScreenID: string) {
            if (this.GetSetting("AddTemplateType") && cdeNMI.MyScreenManager) {
                cdeNMI.MyScreenManager.TransitToScreen(this.GetSetting("AddTemplateType"), true, false, null, this.MyTableName);
                return;
            }

            if (!this.tableMain) return;
            if (this.rowAdder) return;
            this.rowAdder = this.tableMain.insertRow(1);
            this.MyAdderRow = [];
            let tFCnt = 0;
            for (let i = 0; i < this.mCurrentFormFieldsInfo.length; i++) {
                const tFldInfo: cdeNMI.TheFieldInfo = this.mCurrentFormFieldsInfo[i];
                this.rowAdder.className = "cdeHilightRow";
                const cell3: ctrlTableCell = ctrlTableCell.Create(null, new TheTRF(this.MyTableName, 0, tFldInfo), this.rowAdder, tFCnt); //  this.rowAdder.insertCell(i);
                if ((this.mCurrentFormFieldsInfo[i].Flags & 8) !== 0) cell3.SetProperty("Visibility", false);
                if (tFldInfo.DataItem === "CDE_DELETE") {
                    cell3.SetProperty("TileWidth", 1);
                    cell3.SetProperty("ClassName", "cdeTH");
                    cdeNMI.Key13Event = () => { this.SaveRecord(); };
                    const tSB = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(cell3, { PreInitBag: ["ControlTW=1", "ControlTH=1", "TileFactorY=2"], PostInitBag: ["Title=<span class='fa fa-2x'>&#xf058;</span>"] });
                    tSB.SetProperty("OnClick", () => { this.SaveRecord(); });
                    cdeNMI.Key27Event = () => { this.CancelAddRecord(); };
                    const tCB = cdeNMI.MyTCF.CreateNMIControl(cdeControlType.TileButton).Create(cell3, { PreInitBag: ["ControlTW=1", "ControlTH=1", "TileFactorY=2"], PostInitBag: ["Title=<span class='fa fa-2x'>&#xf057;</span>"] });
                    tCB.SetProperty("OnClick", () => { this.CancelAddRecord(); });
                }
                else {
                    if (tFldInfo.DataItem !== "CDE_DETAILS" &&
                        tFldInfo.Type !== 29 &&
                        tFldInfo.Type !== 11 &&
                        tFldInfo.Type !== 27 &&
                        tFldInfo.Type !== 22 &&
                        tFldInfo.Type !== 23 &&
                        tFldInfo.Type !== 33 &&
                        (tFldInfo.Flags & 2) !== 0) {
                        tFldInfo["Value"] = tFldInfo["DefaultValue"];
                        const tE: ctrlTileEntry = new ctrlTileEntry();
                        tE.InitControl(cell3, new TheTRF(this.MyTableName, 0, tFldInfo), ["IsInTable=true"], pScreenID);
                        tE.SetProperty("NoTE", true);
                        tE.MyDataView = this;
                        if (tFldInfo.Type === cdeControlType.CheckField)
                            tE.SetProperty("TileWidth", tFldInfo["Bits"]);
                        else
                            tE.SetProperty("TileWidth", tFldInfo["FldWidth"]);
                        tE.CreateControl("Id" + i, null);
                        tE.SetProperty("UXID", tFldInfo.cdeMID); //Sets the guid of the control
                        this.MyAdderRow[this.MyTableName + "_" + tFldInfo.FldOrder] = tE;
                    }
                }
                cell3.MyRootElement.style.verticalAlign = "top";
                tFCnt++;
            }
            this.btnAdder.SetProperty("Visibility", false);
            this.IsInEdit = true;
        }

        //Drag Drop Functions
        mFileList: any[] = [];

        UploadNext() {
            if (this.mFileList.length) {

                const nextFile = this.mFileList.shift();
                let tFileSize: number = this.GetProperty("MaxFileSize");
                if (!tFileSize) {
                    tFileSize = 512000;
                }
                if (tFileSize > 500000000) tFileSize = 500000000;
                if (nextFile.size >= tFileSize) { // 262144) { // 256kb
                    cdeNMI.MyToast.ShowToastMessage("File " + nextFile.name + " size " + nextFile.size + " too big - Max: " + tFileSize);
                    this.OnComplete(nextFile.size);
                } else {
                    cdeNMI.MyToast.ShowToastMessage("Reading: " + nextFile.name);
                    this.UploadFile(nextFile, status);
                }
            } else {
                this.mBaseDiv.classList.remove('ctrlDropUploaderHover');
            }
        }
        OnComplete(size) {
            this.UploadNext();
        }

        UploadFile(file, status) {
            const reader = new FileReader();
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

        //Legacy Compliance
        public static Create(pTargetControl: INMIControl, pScreenID: string, pTRF: TheTRF, pTableInfo?: string, pIsLiveData?: boolean, pClassName?: string, pMetaData?: TheFormInfo): ctrlTableView {
            const tTable: ctrlTableView = new ctrlTableView(pTRF);

            if (pMetaData)
                tTable.MyMetaData = pMetaData;
            if (cdeCommonUtils.CBool(pIsLiveData))
                tTable.SetProperty("IsLiveData", true);
            else
                tTable.SetProperty("IsLiveData", false);

            if (pTableInfo) {
                const tStr: string[] = pTableInfo.split(':');
                if (tStr.length > 4)
                    tTable.SetProperty("PageSize", cdeCommonUtils.CInt(tStr[4]));
                if (tStr.length > 5)
                    tTable.SetProperty("CurrentPage", cdeCommonUtils.CInt(tStr[5]));
            }

            tTable.InitControl(pTargetControl, pTRF, null, pScreenID);

            if (pClassName)
                tTable.SetProperty("InnerClassName", pClassName);
            return tTable;
        }
    }
}