// SPDX-FileCopyrightText: 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
//
// SPDX-License-Identifier: MPL-2.0

namespace cdeNMI {

    export class ctrlDeviceTypePicker extends ctrlPropertyPicker implements INMIComboBox {
        constructor(pTRF?: TheTRF) {
            super(pTRF);
        }

        MyThingFriendlyName: string = null;

        public InitControl(pTargetControl: cdeNMI.INMIControl, pTRF?: cdeNMI.TheTRF, pPropertyBag?: string[], pScreenID?: string): boolean {
            this.RefreshCombo = '[{"V":"CDE_NOP","N":"loading...please wait"}]';
            this.MyBaseType = cdeControlType.DeviceTypePicker;
            this.ControlText = "ctrlDeviceTypePicker";
            super.InitControl(pTargetControl, pTRF, pPropertyBag, pScreenID);
            return true;
        }

        LoadComboContent(bForceShow: boolean) {
            const tChoiceOptions = this.GetProperty("LiveOptions");
            if (!tChoiceOptions) {
                if (cdeNMI.MyEngine) {
                    let tFilter = "";
                    if (this.GetProperty("Filter"))
                        tFilter = GenerateFinalString(this.GetProperty("Filter"), null, this.MyTRF);
                    const tRemotes: boolean = cde.CBool(this.GetProperty("IncludeRemotes"));
                    cdeNMI.MyEngine.PublishToNMI('NMI_GET_DATA:DEVICETYPEPICKER:' + this.GetProperty("ID") + ':' + this.GetProperty("UXID") + ';76;' + this.MyFieldInfo.FldOrder + ':' + tRemotes + ':' + tFilter, '', this.MyFieldInfo ? this.MyFieldInfo.cdeN : null);
                }
                else {
                    this.CreateComboOptions('[{"V":"CDE_NOP","N":"No DeviceType available - nothing to show"}]', "CDE_NOP", false);
                    this.UpdatePicker(bForceShow);
                }
            }
            else {
                this.CreateComboOptions(tChoiceOptions, this.GetProperty("Value"), true);
                this.UpdatePicker(bForceShow);
            }
        }
    }

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
                const newFriendlyName = this.ReplaceNodeIdInFriendlyNameWithNodeName(pValue);
                this.MyThingFriendlyName = newFriendlyName;
                const tC = new TheComboOption();
                tC.value = this.GetProperty("Value");
                tC.label = this.GetNameFromValue(newFriendlyName);
                pValue = tC;
                pName = "SetChoice";
            }

            if (pName === "LiveOptions" && pValue) {
                // When a thinkpicker has remote things, the owner nodeid gets sent with the friendly name
                // NMI.JS maintains a list of all nodes it can see, so the node name replacement best happens here, rather than on the relay
                try {
                    const tJOpgs = JSON.parse(pValue);
                    let changed = false;
                    for (let i = 0; i < tJOpgs.length; i++) {
                        tJOpgs[i].N = this.ReplaceNodeIdInFriendlyNameWithNodeName(tJOpgs[i].N);
                        changed = true;
                    }
                    if (changed) {
                        super.SetProperty(pName, JSON.stringify(tJOpgs));
                        return;
                    }
                }
                catch (eee)
                {
                    cde.MyEventLogger.FireEvent(true, "CDE_NEW_LOGENTRY", "ctrlThingPicker:SetProperty LiveOptions", eee);
                }
                super.SetProperty(pName, pValue);
                return;
            }
            super.SetProperty(pName, pValue);
        }

        ReplaceNodeIdInFriendlyNameWithNodeName(pVal: string): string
        {
            // Syntax: <friendlyName> on (<cdeN guid with dashes 36 characters>)
            let retVal = pVal;
            if (pVal.length > 41 && pVal.endsWith(")") && pVal.substring(pVal.length - 41, pVal.length - 37) === "on (") {
                const cdeN = pVal.substring(pVal.length - 37, pVal.length - 1);
                let nodeName = cdeNMI.MyEngine.GetKnownNodeName(cdeN);
                if (nodeName && nodeName.length > 0) {
                    retVal = pVal.substring(0, pVal.length - 41) + "on " + nodeName;
                }
            }
            return retVal;
        }

        GetNameFromValue(pVal: string): string {
            if (!pVal || pVal.length === 0)
                return pVal;
            if (!this.MyThingFriendlyName) {
                if (cdeNMI.MyEngine) {
                    cdeNMI.MyEngine.PublishToNMI('NMI_GET_DATA:THINGRESOLVE:' + this.GetProperty("ID") + ':' + this.GetProperty("UXID") + ';63;' + this.MyFieldInfo.FldOrder + ':' + pVal, '', this.MyFieldInfo ? this.MyFieldInfo.cdeN : null);
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
                        tFilter = GenerateFinalString(this.GetProperty("Filter"), null, this.MyTRF);
                    cdeNMI.MyEngine.PublishToNMI('NMI_GET_DATA:THINGPICKER:' + this.GetProperty("ID") + ':' + this.GetProperty("UXID") + ';63;' + this.MyFieldInfo.FldOrder + ':' + tEngs + ':' + tRemotes + ':' + tFilter, '', this.MyFieldInfo ? this.MyFieldInfo.cdeN : null);
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