// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {

    export class ctrlPropertyPicker extends ctrlComboLookup implements INMIComboBox {
        constructor(pTRF?: TheTRF) {
            super(pTRF);
        }

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            if (this.MyBaseType === cdeControlType.BaseControl) {
                this.ControlText = "ctrlPropertyPicker";
                this.RefreshCombo = '[{"V":"CDE_NOP","N":"loading...please wait"}]';
                this.MyBaseType = cdeControlType.PropertyPicker;
            }
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);
            return true;
        }

        public SetProperty(pName: string, pValue) {
            if (pName === "LiveOptions" && pValue) {
                super.SetProperty(pName, pValue);
                this.LoadComboContent(this.DoShow);
                return;
            }
            super.SetProperty(pName, pValue);
        }

        public CalculateOption() {
            if (this.myChoices)
                return;

            if (!this.MyComboDiv) {
                this.MyComboDiv = document.createElement("div");
                this.MyComboDiv.className = "cdeComboBox";
                this.SetElement(this.MyComboDiv);
            }
            if (!this.MyComboBox) {
                this.MyComboBox = document.createElement("select");
                this.MyComboBox.id = cde.GuidToString(this.GetProperty("ID"));;
                if (cde.CBool(this.GetProperty("AllowMultiSelect"))) {
                    this.MyComboBox.multiple = true;
                }
                this.MyComboDiv.appendChild(this.MyComboBox);
            }

            this.RegisterNMIControl();
            this.CreateComboOptions(this.RefreshCombo, "CDE_NOP", false);
            this.SetProperty("HasChoices", true);
            this.ApplySkiny();
        }

        public OnShowDropDown() {
            super.OnShowDropDown();
            try {
                if (!this.GetProperty("LiveOptions") || this.GetProperty("LiveOptions").substr(0, 15) === '[{"V":"CDE_NOP"')
                    this.LoadComboContent(false);
            }
            catch (ee) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", this.ControlText + ":onBeforeShow", "Exception :" + ee);
            }
        }

        LoadComboContent(bForceShow: boolean) {
            const tChoiceOptions = this.GetProperty("LiveOptions");
            if (!tChoiceOptions) {
                const tThingID: string = this.GetThingID();
                if (tThingID?.length > 0) {
                    if (cdeNMI.MyEngine) {
                        cdeNMI.MyEngine.PublishToNMI('NMI_GET_DATA:PROPERTYPICKER:' + this.GetProperty("ID") + ':' + this.GetProperty("UXID") + ':' + tThingID, '', this.MyFieldInfo ? this.MyFieldInfo.cdeN : null);
                        if (bForceShow)
                            this.UpdatePicker(bForceShow);
                    }
                    else {
                        this.DoShow = bForceShow;
                        this.SetProperty("LiveOptions", '[{"V":"CDE_NOP","N":"No NMI Engine available - cannot load"}]');
                    }
                } else {
                    this.DoShow = bForceShow;
                    this.SetProperty("LiveOptions", '[{"V":"CDE_NOP","N":"You have to Select a Thing first"}]');
                }
            }
            else {
                this.CreateComboOptions(tChoiceOptions, this.GetProperty("Value"), true);
                this.UpdatePicker(bForceShow);
            }
            this.DoShow = false;
        }

        UpdatePicker(bForceShow: boolean) {
            this.NeedRefresh = true;
            this.ApplySkiny();
            if (bForceShow)
                this.ShowComboPicker();
        }

        public ComboUpdateValue(pValue: string, DoRemove?: boolean): boolean {
            if (pValue === "CDE_PPP") {
                this.SetProperty("LiveOptions", null);
                this.LoadComboContent(false);
            }
            else {
                return super.ComboUpdateValue(pValue, DoRemove);
            }
            return false;
        }

        GetThingID(): string {
            const tFld: number = this.GetProperty("ThingFld");
            if (tFld === 0)
                return null;
            let tCtrl: INMIControl;
            if (this.MyTE && this.MyTE.MyDataView)
                tCtrl = this.MyTE.MyDataView.GetControlByFldNo(this.MyTRF.RowNo, tFld);
            else {
                if (this.MyDataView)
                    tCtrl = this.MyDataView.GetControlByFldNo(this.MyTRF.RowNo, tFld);
            }
            if (!tCtrl)
                return null;
            return tCtrl.GetProperty("Value");
        }
    }
}

