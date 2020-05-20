// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

﻿namespace cdeNMI {

    export class ctrlThingPicker extends ctrlPropertyPicker implements INMIComboBox {
        constructor(pTRF?: TheTRF) {
            super(pTRF);
        }

        MyThingFriendlyName: string = null;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.RefreshCombo = '[{"G":"Other Options...","V":"CDE_PPP","N":"Please select..."}]';
            this.MyBaseType = cdeControlType.ThingPicker;
            this.ControlText = "ctrlThingPicker";
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);
            return true;
        }

        public SetProperty(pName: string, pValue) {
            if (pName === "Value" || pName === "iValue") {
                if (this.GetProperty("Value") !== pValue)
                    this.MyThingFriendlyName = null;
                this.GetNameFromValue(pValue);
                if (this.MyThingFriendlyName) {
                    const tC = new TheComboOption();
                    tC.value = pValue;
                    tC.label = this.MyThingFriendlyName;
                    pValue = tC;
                    pName = "SetChoiceV";
                }
            }
            if (pName === "ThingFriendlyName" && pValue) {
                this.MyThingFriendlyName = pValue;
                const tC = new TheComboOption();
                tC.value = this.GetProperty("Value");
                tC.label = this.GetNameFromValue(pValue);
                pValue = tC;
                pName = "SetChoice";
            }
            super.SetProperty(pName, pValue);
        }

        GetNameFromValue(pVal: string): string {
            if (!pVal || pVal.length === 0)
                return pVal;
            if (!this.MyThingFriendlyName) {
                if (cdeNMI.MyEngine) {
                    cdeNMI.MyEngine.PublishToNMI('NMI_GET_DATA:THINGRESOLVE:' + this.GetProperty("ID") + ':' + this.GetProperty("UXID") + ';63:' + pVal , '', this.MyFieldInfo ? this.MyFieldInfo.cdeN : null);
                }
                return pVal;
            } else {
                return this.MyThingFriendlyName;
            }
        }

        SetThingFriendlyName(pValue: string) {
            if (!this.GetProperty("LiveOptions"))
                return;
            try {
                const tJOpgs = JSON.parse(this.GetProperty("LiveOptions"));
                for (let i = 0; i < tJOpgs.length; i++) {
                    if (tJOpgs[i].V === pValue) {
                        this.SetProperty("ThingFriendlyName", tJOpgs[i].N);
                        return;
                    }
                }
            } catch (eee) {
                cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "ctrlThingPicker:GetFriendlyName", eee);
            }
        }

        LoadComboContent(bForceShow: boolean) {
            const tChoiceOptions = this.GetProperty("LiveOptions");
            if (!tChoiceOptions) {
                if (cdeNMI.MyEngine) {
                    const tEngs: boolean = cde.CBool(this.GetProperty("IncludeEngines"));
                    const tRemotes: boolean = cde.CBool(this.GetProperty("IncludeRemotes"));
                    let tFilter = "";
                    if (this.GetProperty("Filter"))
                        tFilter = this.GetProperty("Filter");
                    cdeNMI.MyEngine.PublishToNMI('NMI_GET_DATA:THINGPICKER:' + this.GetProperty("ID") +':' + this.GetProperty("UXID") +';63:' + tEngs + ':' + tRemotes +':'+ tFilter, '', this.MyFieldInfo ? this.MyFieldInfo.cdeN : null);
                }
                else {
                    this.CreateComboOptions('[{"G":"Other Options...","V":"CDE_NOP","N":"No NMI Engine available - cannot load"}]', "CDE_NOP", false);
                    this.UpdatePicker(bForceShow);
                }
            }
            else {
                this.CreateComboOptions(tChoiceOptions, this.GetProperty("Value"), true);
                this.UpdatePicker(bForceShow);
            }
        }

        ComboUpdateValue(pValue: string, DoRemove?: boolean): boolean {
            if (pValue === "CDE_PPP") {
                this.SetProperty("LiveOptions", null);
                this.LoadComboContent(false);
            } else {
                if (!DoRemove) {
                    this.SetThingFriendlyName(pValue);
                    return super.ComboUpdateValue(pValue, DoRemove);
                }
            }
            return false;
        }
    }
}