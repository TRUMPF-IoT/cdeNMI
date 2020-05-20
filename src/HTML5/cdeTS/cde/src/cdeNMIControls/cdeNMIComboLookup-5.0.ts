// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {

    export class ctrlComboLookup extends ctrlComboBox implements INMIComboBox {
        constructor(pTRF?: TheTRF) {
            super(pTRF);
        }

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            if (this.MyBaseType === cdeControlType.BaseControl) {
                this.MyBaseType = cdeControlType.ComboLookup;
                this.ControlText = "ctrlComboLookup";
            }
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);
            return true;
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
                if (this.MyFieldInfo.Type === cdeControlType.ComboOption) {
                    this.MyComboBox.multiple = true;
                }
                this.MyComboDiv.appendChild(this.MyComboBox);
            }

            if (this.GetSetting("GroupFld"))
                this.HasGroups = true;

            //var tParas: string[] = "LOOKUP:b510837f-3b75-4cf2-a900-d36c19113a13:MyPropertyBag.FriendlyName.Value:cdeMID:MyPropertyBag.DeviceType.Value:FAFA22FF-96AC-42CF-B1DB-7C073053FC39".split(':');
            this.MyTableName = cde.GuidToString(this.GetSetting("StorageTarget"));
            if (!this.MyLookup) {
                this.MyLookup = { ComboControl: this, Content: this.GetProperty("Value"), SrcFld: this.GetProperty("NameFld"), TgtID: this.GetSetting("ValueFld"), GroupName: this.GetSetting("GroupFld") };
            }

            if (cdeNMI.MyEngine) {
                let tScreenid: string = this.MyScreenID;
                if (this.GetSetting("ModelID")) tScreenid = this.GetSetting("ModelID");
                this.MyScreenID = tScreenid;
                cdeNMI.MyEngine.LoadTableLazy(tScreenid, this.MyTableName, this.HandleLazyLoad, this.MyLookup);
                return;
            }
            this.SetProperty("HasChoices", true);
            this.ApplySkiny();
        }

        public OnShowDropDown() {
            try {
                if (!this.HasLoaded || cde.CBool(this.GetProperty("RefreshOnLoad")) === true)
                    this.ComboUpdateValue("CDE_LLL");
            }
            catch (ee) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", this.ControlText + ":onBeforeShow", "Exception :" + ee);
            }
        }

        public SetOptions() {
            this.myChoicesOptions.editItems = true;
            this.myChoicesOptions.searchEnabled = true;
            this.myChoicesOptions.removeItemButton = true;
            this.myChoicesOptions.maxItemCount = 1;
        }
    }
}